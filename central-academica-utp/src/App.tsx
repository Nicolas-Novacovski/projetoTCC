import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import Swal from 'sweetalert2'
import './App.css'

import { emptyCareerProfile, emptyLostItemForm } from './constants/app'
import { toast } from './lib/alerts'
import { requestJson } from './lib/http'
import { AuthenticatedLayout } from './components/layout/AuthenticatedLayout'
import { LoginScreen } from './components/layout/LoginScreen'
import { LostItemModal } from './components/modals/LostItemModal'
import { PublishModal } from './components/modals/PublishModal'
import { RideModal } from './components/modals/RideModal'
import { ReportModal } from './components/modals/ReportModal'
import {
  BriefcaseIcon,
  CarIcon,
  GridIcon,
  SearchIcon,
  ShieldIcon,
  UserCardIcon,
} from './components/icons'
import { CareerView } from './views/CareerView'
import { DatabaseView } from './views/DatabaseView'
import { HomeView } from './views/HomeView'
import { LostFoundView } from './views/LostFoundView'
import { ModerationView } from './views/ModerationView'
import { MuralView } from './views/MuralView'
import { RidesView } from './views/RidesView'
import type {
  AdminDatabaseSnapshot,
  AppData,
  AppUser,
  CareerProfile,
  LoginMode,
  LostItem,
  LostItemForm,
  ModerationPost,
  MuralPost,
  PageView,
  PostStatus,
  PublishForm,
  ReportForm,
  RideForm,
  RideOffer,
} from './types/app'

const SESSION_STORAGE_KEY = 'central-academica-utp:session-user'
const VIEW_STORAGE_KEY = 'central-academica-utp:current-view'
const APP_DATA_STORAGE_KEY = 'central-academica-utp:app-data'
const ACCESSIBILITY_STORAGE_KEY = 'central-academica-utp:accessibility-settings'

type AccessibilitySettings = {
  largeFont: boolean
  highContrast: boolean
  wordSpacing: boolean
}

const defaultAccessibilitySettings: AccessibilitySettings = {
  largeFont: false,
  highContrast: false,
  wordSpacing: false,
}

function parseWeekdays(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item && item !== 'Nao informado')
}

function isAllowedViewForRole(view: PageView, role: AppUser['role']) {
  const studentViews: PageView[] = ['home', 'rides', 'lostFound', 'career', 'mural']
  const adminViews: PageView[] = ['mural', 'moderation', 'database']

  return role === 'admin' ? adminViews.includes(view) : studentViews.includes(view)
}

function removeRideRequestFromAppData(data: AppData, requestId: number): AppData {
  return {
    ...data,
    rideRequestsInbox: data.rideRequestsInbox.filter((request) => request.id !== requestId),
  }
}

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [currentView, setCurrentView] = useState<PageView>('mural')
  const [loginMode, setLoginMode] = useState<LoginMode>('student')
  const [ra, setRa] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [adminLogin, setAdminLogin] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [sessionUser, setSessionUser] = useState<AppUser | null>(null)
  const [appData, setAppData] = useState<AppData | null>(null)
  const [isRestoringSession, setIsRestoringSession] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false)
  const [isRideModalOpen, setIsRideModalOpen] = useState(false)
  const [isLostItemModalOpen, setIsLostItemModalOpen] = useState(false)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false) // ESTADO DA DENÚNCIA
  const [editingRideId, setEditingRideId] = useState<number | null>(null)
  const [adminSnapshot, setAdminSnapshot] = useState<AdminDatabaseSnapshot | null>(null)
  const [appliedPostIds, setAppliedPostIds] = useState<number[]>([])
  const [isLoadingSnapshot, setIsLoadingSnapshot] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [isAccessibilityMenuOpen, setIsAccessibilityMenuOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [accessibilitySettings, setAccessibilitySettings] = useState<AccessibilitySettings>(defaultAccessibilitySettings)
  
  const [itemParaExcluir, setItemParaExcluir] = useState<ModerationPost | null>(null);
  
  const [rideItemParaExcluir, setRideItemParaExcluir] = useState<{ id: number, type: 'Oferta' | 'Pedido', title: string } | null>(null);
  
  const [publishForm, setPublishForm] = useState<PublishForm>({
    category: 'Vaga',
    title: '',
    location: '',
    contactEmail: '',
    description: '',
  })
  
  const [reportForm, setReportForm] = useState<ReportForm>({ title: '', detail: '' }) // FORM DA DENÚNCIA
  
  const [rideForm, setRideForm] = useState<RideForm>({
    zone: '',
    title: '',
    departureTime: '',
    seats: '',
    meetingPoint: '',
    vehicle: '',
    whatsapp: '',
    weekdays: [],
  })
  const [careerProfile, setCareerProfile] = useState<CareerProfile>(emptyCareerProfile)
  const [lostItemForm, setLostItemForm] = useState<LostItemForm>(emptyLostItemForm)

  const profileMenuRef = useRef<HTMLDivElement | null>(null)
  const accessibilityMenuRef = useRef<HTMLDivElement | null>(null)
  const notificationsMenuRef = useRef<HTMLDivElement | null>(null)

  const refreshAppDataForUser = useCallback(async (user: AppUser) => {
    if (!user) return
    const data = await requestJson<AppData>(`/api/app-data?userId=${user.id}&role=${user.role}`)
    setAppData(data)
    setCareerProfile(data.careerProfile)
    setAppliedPostIds(data.appliedPostIds ?? [])
  }, [])

  const refreshAppData = useCallback(async (user = sessionUser) => {
    if (!user) return
    await refreshAppDataForUser(user)
  }, [refreshAppDataForUser, sessionUser])

  useEffect(() => {
    const storedSession = window.localStorage.getItem(SESSION_STORAGE_KEY)
    const storedView = window.localStorage.getItem(VIEW_STORAGE_KEY)
    const storedAppData = window.localStorage.getItem(APP_DATA_STORAGE_KEY)

    if (!storedSession) {
      setIsRestoringSession(false)
      return
    }

    let parsedSession: AppUser | null = null

    try {
      parsedSession = JSON.parse(storedSession) as AppUser
    } catch {
      window.localStorage.removeItem(SESSION_STORAGE_KEY)
      setIsRestoringSession(false)
      return
    }

    if (!parsedSession?.id || !parsedSession?.role) {
      window.localStorage.removeItem(SESSION_STORAGE_KEY)
      setIsRestoringSession(false)
      return
    }

    setSessionUser(parsedSession)
    const restoredView =
      storedView && isAllowedViewForRole(storedView as PageView, parsedSession.role)
        ? (storedView as PageView)
        : parsedSession.role === 'admin'
          ? 'moderation'
          : 'home'

    setCurrentView(restoredView)

    if (storedAppData) {
      try {
        const parsedData = JSON.parse(storedAppData) as AppData
        setAppData(parsedData)
        setCareerProfile(parsedData.careerProfile)
        setAppliedPostIds(parsedData.appliedPostIds ?? [])
      } catch {
        window.localStorage.removeItem(APP_DATA_STORAGE_KEY)
      }
    }

    void refreshAppDataForUser(parsedSession)
      .catch((error) => {
        console.warn('Nao foi possivel atualizar a sessao restaurada.', error)
      })
      .finally(() => {
        setIsRestoringSession(false)
      })
  }, [refreshAppDataForUser])

  useEffect(() => {
    const storedSettings = window.localStorage.getItem(ACCESSIBILITY_STORAGE_KEY)

    if (!storedSettings) {
      return
    }

    try {
      const parsedSettings = JSON.parse(storedSettings) as Partial<AccessibilitySettings>
      setAccessibilitySettings({
        largeFont: Boolean(parsedSettings.largeFont),
        highContrast: Boolean(parsedSettings.highContrast),
        wordSpacing: Boolean(parsedSettings.wordSpacing),
      })
    } catch {
      window.localStorage.removeItem(ACCESSIBILITY_STORAGE_KEY)
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(ACCESSIBILITY_STORAGE_KEY, JSON.stringify(accessibilitySettings))
  }, [accessibilitySettings])

  useEffect(() => {
    document.body.classList.toggle('accessibility-large-font', accessibilitySettings.largeFont)
    document.body.classList.toggle('accessibility-high-contrast', accessibilitySettings.highContrast)
    document.body.classList.toggle('accessibility-word-spacing', accessibilitySettings.wordSpacing)

    return () => {
      document.body.classList.remove('accessibility-large-font', 'accessibility-high-contrast', 'accessibility-word-spacing')
    }
  }, [accessibilitySettings])

  useEffect(() => {
    if (!sessionUser) {
      window.localStorage.removeItem(SESSION_STORAGE_KEY)
      return
    }

    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionUser))
  }, [sessionUser])

  useEffect(() => {
    if (!sessionUser) {
      window.localStorage.removeItem(VIEW_STORAGE_KEY)
      return
    }

    if (isAllowedViewForRole(currentView, sessionUser.role)) {
      window.localStorage.setItem(VIEW_STORAGE_KEY, currentView)
    }
  }, [currentView, sessionUser])

  useEffect(() => {
    if (!appData || !sessionUser) {
      window.localStorage.removeItem(APP_DATA_STORAGE_KEY)
      return
    }

    window.localStorage.setItem(APP_DATA_STORAGE_KEY, JSON.stringify(appData))
  }, [appData, sessionUser])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setIsProfileMenuOpen(false)
      }

      if (!accessibilityMenuRef.current?.contains(event.target as Node)) {
        setIsAccessibilityMenuOpen(false)
      }

      if (!notificationsMenuRef.current?.contains(event.target as Node)) {
        setIsNotificationsOpen(false)
      }
    }

    if (isProfileMenuOpen || isAccessibilityMenuOpen || isNotificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isProfileMenuOpen, isAccessibilityMenuOpen, isNotificationsOpen])

  function handleToggleAccessibilitySetting(setting: keyof AccessibilitySettings) {
    setAccessibilitySettings((current) => ({
      ...current,
      [setting]: !current[setting],
    }))
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setErrorMessage('')

    try {
      if (loginMode === 'student') {
        const normalizedRa = ra.replace(/\D/g, '')

        if (normalizedRa.length !== 10) throw new Error('Informe os 10 digitos do RA para continuar.')
        if (!birthDate) throw new Error('Preencha sua data de nascimento antes de entrar.')

        const response = await requestJson<{ user: AppUser; data: AppData }>('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ mode: 'student', ra: normalizedRa, birthDate }),
        })

        setSessionUser(response.user)
        setAppData(response.data)
        setCareerProfile(response.data.careerProfile)
        setAppliedPostIds(response.data.appliedPostIds ?? [])
        setCurrentView('home')
      } else {
        if (!adminLogin.trim() || !adminPassword.trim()) {
          throw new Error('Preencha login e senha do administrador.')
        }

        const response = await requestJson<{ user: AppUser; data: AppData }>('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ mode: 'admin', login: adminLogin, password: adminPassword }),
        })

        setSessionUser(response.user)
        setAppData(response.data)
        setCareerProfile(response.data.careerProfile)
        setAppliedPostIds(response.data.appliedPostIds ?? [])
        setCurrentView('moderation')
      }

      await toast.fire({
        icon: 'success',
        title: loginMode === 'student' ? 'Login realizado com sucesso.' : 'Moderacao liberada.',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nao foi possivel autenticar agora.'
      setErrorMessage(message)
      await Swal.fire({ icon: 'error', title: 'Acesso negado', text: message, confirmButtonText: 'Tentar novamente' })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleLogout() {
    const result = await Swal.fire({
      icon: 'question',
      title: 'Deseja sair do sistema?',
      text: 'Sua sessao atual sera encerrada.',
      showCancelButton: true,
      confirmButtonText: 'Sair',
      cancelButtonText: 'Continuar',
    })

    if (!result.isConfirmed) return

    setSessionUser(null)
    setAppData(null)
    setCareerProfile(emptyCareerProfile)
    setIsSidebarOpen(true)
    setCurrentView('mural')
    setLoginMode('student')
    setRa('')
    setBirthDate('')
    setAdminLogin('')
    setAdminPassword('')
    setErrorMessage('')
    window.localStorage.removeItem(SESSION_STORAGE_KEY)
    window.localStorage.removeItem(VIEW_STORAGE_KEY)
    window.localStorage.removeItem(APP_DATA_STORAGE_KEY)

    await toast.fire({ icon: 'success', title: 'Sessao encerrada.' })
  }

  async function handlePublishSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!sessionUser) return

    if (!publishForm.title.trim() || !publishForm.description.trim()) {
      await Swal.fire({
        icon: 'warning',
        title: 'Campos obrigatorios',
        text: 'Preencha pelo menos titulo e descricao da publicacao.',
        confirmButtonText: 'Corrigir',
      })
      return
    }

    try {
      const response = await requestJson<{ data: AppData }>('/api/publications', {
        method: 'POST',
        body: JSON.stringify({ userId: sessionUser.id, role: sessionUser.role, ...publishForm }),
      })

      setAppData(response.data)
      setCareerProfile(response.data.careerProfile)
      setIsPublishModalOpen(false)
      setPublishForm({ category: 'Vaga', title: '', location: '', contactEmail: '', description: '' })

      await toast.fire({
        icon: 'success',
        title: sessionUser.role === 'admin'
          ? 'Publicacao aprovada e exibida no mural.'
          : 'Publicacao enviada para moderacao.',
      })
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Falha ao publicar',
        text: error instanceof Error ? error.message : 'Nao foi possivel salvar a publicacao.',
        confirmButtonText: 'Fechar',
      })
    }
  }

  // === NOVA FUNÇÃO DE SUBMISSÃO DA DENÚNCIA ===
  async function handleReportSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!sessionUser) return

    if (!reportForm.title.trim() || !reportForm.detail.trim()) {
      await Swal.fire({ icon: 'warning', title: 'Campos obrigatórios', text: 'Preencha o título e os detalhes.' })
      return
    }

    try {
      const response = await requestJson<{ data: AppData }>('/api/reports', {
        method: 'POST',
        body: JSON.stringify({ userId: sessionUser.id, ...reportForm }),
      })

      setAppData(response.data)
      setIsReportModalOpen(false)
      setReportForm({ title: '', detail: '' })

      await toast.fire({ icon: 'success', title: 'Denúncia registrada com sucesso. A equipe investigará.' })
    } catch (error) {
      await Swal.fire({ icon: 'error', title: 'Falha ao reportar', text: error instanceof Error ? error.message : 'Tente novamente.' })
    }
  }

  async function handleSaveProfile() {
    if (!sessionUser) return
    setIsSavingProfile(true)

    try {
      const response = await requestJson<{ data: AppData }>(`/api/career-profile/${sessionUser.id}`, {
        method: 'PUT',
        body: JSON.stringify(careerProfile),
      })

      setAppData(response.data)
      setCareerProfile(response.data.careerProfile)
      await toast.fire({ icon: 'success', title: 'Perfil profissional atualizado.' })
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Falha ao salvar',
        text: error instanceof Error ? error.message : 'Nao foi possivel salvar o perfil.',
        confirmButtonText: 'Fechar',
      })
    } finally {
      setIsSavingProfile(false)
    }
  }

  async function handleModerationAction(status: Extract<PostStatus, 'Aprovado' | 'Revisao'>, item: ModerationPost) {
    if (!sessionUser) return

    try {
      const response = await requestJson<{ data: AppData }>(`/api/publications/${item.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, userId: sessionUser.id, role: sessionUser.role }),
      })

      setAppData(response.data)

      if (status === 'Revisao') {
        await Swal.fire({
          title: 'Revisao de Publicacao',
          width: 650,
          customClass: {
            popup: 'application-popup',
            confirmButton: 'primary-button',
          },
          buttonsStyling: false,
          html: `
            <div style="text-align: left; margin-top: 10px;">
              <span class="detail-tag">${item.category}</span>
              <h2 style="margin: 12px 0 16px; color: #163a54; font-size: 24px;">${item.title}</h2>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                <div style="background: #f7fafc; padding: 12px; border-radius: 12px;">
                  <span style="display: block; font-size: 11px; color: #708d9f; font-weight: bold; text-transform: uppercase; margin-bottom: 4px;">Local ou Empresa</span>
                  <strong style="color: #163a54; font-size: 14px;">${item.location}</strong>
                </div>
                <div style="background: #f7fafc; padding: 12px; border-radius: 12px;">
                  <span style="display: block; font-size: 11px; color: #708d9f; font-weight: bold; text-transform: uppercase; margin-bottom: 4px;">E-mail de Contato</span>
                  <strong style="color: #163a54; font-size: 14px;">${item.contactEmail}</strong>
                </div>
                <div style="background: #f7fafc; padding: 12px; border-radius: 12px;">
                  <span style="display: block; font-size: 11px; color: #708d9f; font-weight: bold; text-transform: uppercase; margin-bottom: 4px;">Autor (Aluno/Admin)</span>
                  <strong style="color: #163a54; font-size: 14px;">${item.author}</strong>
                </div>
                <div style="background: #f7fafc; padding: 12px; border-radius: 12px;">
                  <span style="display: block; font-size: 11px; color: #708d9f; font-weight: bold; text-transform: uppercase; margin-bottom: 4px;">Enviado em</span>
                  <strong style="color: #163a54; font-size: 14px;">${item.submittedAt}</strong>
                </div>
              </div>

              <div style="background: #f7fafc; padding: 16px; border-radius: 14px; border: 1px solid #e3edf3;">
                <span style="display: block; font-size: 11px; color: #708d9f; font-weight: bold; text-transform: uppercase; margin-bottom: 8px;">Descricao da Publicacao</span>
                <div style="color: #466579; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${item.description || 'Nenhuma descricao fornecida.'}</div>
              </div>
            </div>
          `,
          confirmButtonText: 'Fechar',
        })
      } else {
        await Swal.fire({
          icon: 'success',
          title: 'Publicacao aprovada!',
          text: 'O item ja esta visivel no mural para os alunos.',
          confirmButtonText: 'Ok',
          customClass: {
            confirmButton: 'primary-button',
          },
          buttonsStyling: false,
        })
      }

    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Falha na moderacao',
        text: error instanceof Error ? error.message : 'Nao foi possivel atualizar a publicacao.',
        confirmButtonText: 'Fechar',
      })
    }
  }

  const handleRequestDelete = (item: ModerationPost) => {
    setItemParaExcluir(item);
  };
  
  const handleConfirmDelete = async () => {
    if (!itemParaExcluir || !sessionUser) return;

    try {
      await requestJson(`/api/publications/${itemParaExcluir.id}`, {
        method: 'DELETE',
      });
      
      setItemParaExcluir(null);
      void refreshAppDataForUser(sessionUser); 
      
    } catch (error) {
      console.error(error);
      alert('Erro ao excluir a publicacao.');
    }
  };

  const handleConfirmDeleteRideItem = async () => {
    if (!rideItemParaExcluir || !sessionUser) return;

    try {
      if (rideItemParaExcluir.type === 'Oferta') {
        await requestJson(`/api/rides/${rideItemParaExcluir.id}?userId=${sessionUser.id}`, { method: 'DELETE' });
      } else {
        await requestJson(`/api/ride-requests/${rideItemParaExcluir.id}?userId=${sessionUser.id}&role=${sessionUser.role}`, { method: 'DELETE' });
      }
      
      setRideItemParaExcluir(null);
      void refreshAppDataForUser(sessionUser); 
    } catch (error) {
      console.error(error);
      alert('Erro ao excluir o item da carona.');
    }
  };

  async function handleMarkLostItemRecovered(item: LostItem) {
    if (!sessionUser || sessionUser.role !== 'admin') return

    const result = await Swal.fire({
      icon: 'question',
      title: 'Marcar item como recuperado?',
      text: `O item "${item.title}" deixara de aparecer para os alunos.`,
      showCancelButton: true,
      confirmButtonText: 'Marcar recuperado',
      cancelButtonText: 'Cancelar',
    })

    if (!result.isConfirmed) return

    try {
      const response = await requestJson<{ data: AppData }>(`/api/lost-items/${item.id}/recovered`, {
        method: 'PATCH',
        body: JSON.stringify({ userId: sessionUser.id, role: sessionUser.role }),
      })

      setAppData(response.data)

      if (adminSnapshot) {
        await loadAdminSnapshot(sessionUser)
      }

      await toast.fire({ icon: 'success', title: 'Item marcado como recuperado.' })
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Falha ao atualizar item',
        text: error instanceof Error ? error.message : 'Nao foi possivel marcar o item como recuperado.',
        confirmButtonText: 'Fechar',
      })
    }
  }

  async function handleApply(post: MuralPost) {
    const jobContactEmail = post.contactEmail || 'secretaria@utp.br'
    const missingProfileItems = [
      !careerProfile.resumeFileName ? 'curriculo' : null,
      !careerProfile.contactEmail ? 'e-mail de contato' : null,
      !careerProfile.course ? 'curso' : null,
      !careerProfile.desiredArea ? 'area desejada' : null,
    ].filter(Boolean)

    if (missingProfileItems.length > 0) {
      const missingText = missingProfileItems.join(', ')
      const result = await Swal.fire({
        icon: 'info',
        title: 'Complete seu perfil antes de declarar interesse',
        html: `Para enviar um interesse mais completo, preencha: <strong>${missingText}</strong>.`,
        showCancelButton: true,
        confirmButtonText: 'Ir para perfil',
        cancelButtonText: 'Continuar mesmo assim',
      })

      if (result.isConfirmed) {
        setCurrentView('career')
        return
      }
    }

    const result = await Swal.fire({
      title: 'Declarar interesse na vaga?',
      showCancelButton: true,
      confirmButtonText: 'Enviar interesse',
      cancelButtonText: 'Revisar depois',
      buttonsStyling: false,
      customClass: {
        popup: 'application-popup',
        confirmButton: 'application-popup-confirm',
        cancelButton: 'application-popup-cancel',
      },
      html: `
        <div class="application-review">
          <span class="detail-tag">Pre-visualizacao</span>
          <h2>${post.title}</h2>
          <p>${post.subtitle}</p>
          <div class="application-review-grid">
            <div><span>Aluno</span><strong>${sessionUser?.name ?? 'Estudante UTP'}</strong></div>
            <div><span>E-mail</span><strong>${careerProfile.contactEmail || 'Nao informado'}</strong></div>
            <div><span>Curso</span><strong>${careerProfile.course || 'Nao informado'}</strong></div>
            <div><span>Area</span><strong>${careerProfile.desiredArea || 'Nao informada'}</strong></div>
            <div><span>Curriculo</span><strong>${careerProfile.resumeFileName || 'Nao anexado'}</strong></div>
            <div><span>Contato da vaga</span><strong>${jobContactEmail}</strong></div>
          </div>
          <p class="application-review-note">Seu interesse ficara registrado visualmente nesta sessao e usa os dados atuais do perfil profissional.</p>
        </div>
      `,
    })

    if (!result.isConfirmed) {
      return
    }

    try {
      void Swal.fire({
        title: 'Enviando informacoes...',
        html: `
          <div class="application-loading-state">
            <span class="application-loading-spinner" aria-hidden="true"></span>
            <p>Estamos encaminhando os dados da vaga para seu e-mail.</p>
          </div>
        `,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        customClass: {
          popup: 'application-popup application-loading-popup',
        },
      })

      const response = await requestJson<{
        application: {
          emailSent: boolean
          emailMessage: string
          contactEmail: string
        }
      }>('/api/applications', {
        method: 'POST',
        body: JSON.stringify({
          userId: sessionUser?.id,
          publicationId: post.id,
          studentName: sessionUser?.name,
        }),
      })

      setAppliedPostIds((current) => (current.includes(post.id) ? current : [...current, post.id]))

      await Swal.fire({
        icon: response.application.emailSent ? 'success' : 'info',
        title: response.application.emailSent ? 'Interesse declarado' : 'Interesse registrado sem envio automatico',
        confirmButtonText: 'Entendi',
        customClass: {
          popup: 'application-popup',
          confirmButton: 'application-popup-confirm',
        },
        buttonsStyling: false,
        html: `
          <div class="application-result">
            <p>${response.application.emailMessage}</p>
            <div class="application-disclaimer">
              <strong>Aviso importante</strong>
              <p>A Central Academica nao realiza a inscricao do aluno na vaga e nao se responsabiliza pelo processo seletivo. Nos apenas encaminhamos as informacoes ao aluno. O estudante deve entrar em contato com a empresa, enviar o curriculo quando necessario e acompanhar todas as etapas diretamente com o responsavel pela oportunidade.</p>
            </div>
            <div class="application-contact-box">
              <span>Contato da vaga</span>
              <strong>${response.application.contactEmail}</strong>
            </div>
          </div>
        `,
      })
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Falha ao declarar interesse',
        text: error instanceof Error ? error.message : 'Nao foi possivel registrar seu interesse.',
        confirmButtonText: 'Entendi',
      })
    }
  }

  async function handleRideSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!sessionUser) return

    if (
      !rideForm.zone ||
      !rideForm.title.trim() ||
      !rideForm.departureTime ||
      !rideForm.seats.trim() ||
      !rideForm.meetingPoint.trim() ||
      !rideForm.vehicle.trim() ||
      !rideForm.whatsapp.trim() ||
      rideForm.weekdays.length === 0
    ) {
      await Swal.fire({
        icon: 'warning',
        title: 'Campos obrigatorios',
        text: 'Preencha todos os campos para oferecer a carona.',
        confirmButtonText: 'Corrigir',
      })
      return
    }

    try {
      const response = await requestJson<{ data: AppData }>(editingRideId ? `/api/rides/${editingRideId}` : '/api/rides', {
        method: editingRideId ? 'PATCH' : 'POST',
        body: JSON.stringify({ userId: sessionUser.id, ...rideForm }),
      })

      setAppData(response.data)
      setIsRideModalOpen(false)
      setEditingRideId(null)
      setRideForm({
        zone: '',
        title: '',
        departureTime: '',
        seats: '',
        meetingPoint: '',
        vehicle: '',
        whatsapp: '',
        weekdays: [],
      })

      await toast.fire({ icon: 'success', title: editingRideId ? 'Carona atualizada com sucesso.' : 'Carona publicada com sucesso.' })
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Falha ao publicar carona',
        text: error instanceof Error ? error.message : 'Nao foi possivel salvar a carona.',
        confirmButtonText: 'Fechar',
      })
    }
  }

  function handleStartRideCreation() {
    setEditingRideId(null)
    setRideForm({
      zone: '',
      title: '',
      departureTime: '',
      seats: '',
      meetingPoint: '',
      vehicle: '',
      whatsapp: '',
      weekdays: [],
    })
    setIsRideModalOpen(true)
  }

  function handleStartRideEdit(ride: RideOffer) {
    setEditingRideId(ride.id)
    setRideForm({
      zone: ride.zone,
      title: ride.title,
      departureTime: ride.time.replace(/^Saida\s+/i, '').trim(),
      seats: ride.seats,
      meetingPoint: ride.meeting,
      vehicle: ride.vehicle,
      whatsapp: ride.whatsapp,
      weekdays: parseWeekdays(ride.weekdays),
    })
    setIsRideModalOpen(true)
  }

  async function handleLostItemSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!sessionUser) return

    if (
      !lostItemForm.title.trim() ||
      !lostItemForm.place.trim() ||
      !lostItemForm.date.trim() ||
      !lostItemForm.category.trim() ||
      !lostItemForm.description.trim() ||
      !lostItemForm.foundBy.trim()
    ) {
      await Swal.fire({
        icon: 'warning',
        title: 'Campos obrigatorios',
        text: 'Preencha todos os campos para registrar o item em achados e perdidos.',
        confirmButtonText: 'Corrigir',
      })
      return
    }

    try {
      const response = await requestJson<{ data: AppData }>('/api/lost-items', {
        method: 'POST',
        body: JSON.stringify({ userId: sessionUser.id, role: sessionUser.role, ...lostItemForm }),
      })

      setAppData(response.data)
      setIsLostItemModalOpen(false)
      setLostItemForm({
        ...emptyLostItemForm,
        foundBy: sessionUser.name,
      })

      await toast.fire({ icon: 'success', title: 'Item registrado com sucesso.' })
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Falha ao registrar item',
        text: error instanceof Error ? error.message : 'Nao foi possivel salvar o item agora.',
        confirmButtonText: 'Fechar',
      })
    }
  }

  async function loadAdminSnapshot(user = sessionUser) {
    if (!user || user.role !== 'admin') return

    setIsLoadingSnapshot(true)

    try {
      const response = await requestJson<{ status: string; data: AdminDatabaseSnapshot }>(
        `/api/admin/database-snapshot?userId=${user.id}`,
      )
      setAdminSnapshot(response.data)
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Falha ao carregar tabelas',
        text: error instanceof Error ? error.message : 'Nao foi possivel carregar os dados do banco.',
        confirmButtonText: 'Fechar',
      })
    } finally {
      setIsLoadingSnapshot(false)
    }
  }

  if (isRestoringSession) {
    return (
      <LoginScreen
        loginMode={loginMode}
        isLoading
        ra={ra}
        birthDate={birthDate}
        adminLogin={adminLogin}
        adminPassword={adminPassword}
        errorMessage=""
        onSubmit={(event) => void handleLogin(event)}
        onChangeLoginMode={(mode) => {
          setLoginMode(mode)
          setErrorMessage('')
        }}
        onRaChange={(value) => setRa(value.replace(/\D/g, '').slice(0, 10))}
        onBirthDateChange={setBirthDate}
        onAdminLoginChange={setAdminLogin}
        onAdminPasswordChange={setAdminPassword}
      />
    )
  }

  if (!sessionUser || !appData) {
    return (
      <LoginScreen
        loginMode={loginMode}
        isLoading={isLoading}
        ra={ra}
        birthDate={birthDate}
        adminLogin={adminLogin}
        adminPassword={adminPassword}
        errorMessage={errorMessage}
        onSubmit={(event) => void handleLogin(event)}
        onChangeLoginMode={(mode) => {
          setLoginMode(mode)
          setErrorMessage('')
        }}
        onRaChange={(value) => setRa(value.replace(/\D/g, '').slice(0, 10))}
        onBirthDateChange={setBirthDate}
        onAdminLoginChange={setAdminLogin}
        onAdminPasswordChange={setAdminPassword}
      />
    )
  }

  const menuItems = [
    { label: 'Inicio', icon: GridIcon, view: 'home' as PageView, visible: sessionUser.role === 'student' },
    { label: 'Caronas', icon: CarIcon, view: 'rides' as PageView, visible: sessionUser.role === 'student' },
    { label: 'Achados e Perdidos', icon: SearchIcon, view: 'lostFound' as PageView, visible: sessionUser.role === 'student' },
    { label: 'Perfil Profissional', icon: UserCardIcon, view: 'career' as PageView, visible: sessionUser.role === 'student' },
    { label: 'Mural', icon: BriefcaseIcon, view: 'mural' as PageView, visible: true },
    { label: 'Moderacao', icon: ShieldIcon, view: 'moderation' as PageView, visible: sessionUser.role === 'admin' },
    { label: 'Banco', icon: GridIcon, view: 'database' as PageView, visible: sessionUser.role === 'admin' },
  ].filter((item) => item.visible)

  const notifications = [
    !careerProfile.resumeFileName || !careerProfile.contactEmail || !careerProfile.course || !careerProfile.desiredArea
      ? {
          id: 'career-profile',
          title: 'Perfil profissional incompleto',
          detail: 'Complete curriculo, e-mail, curso e area desejada para declarar interesse em vagas.',
          tone: 'warning' as const,
        }
      : {
          id: 'career-ready',
          title: 'Perfil pronto para vagas',
          detail: 'Seu perfil possui os dados principais para declarar interesse em vagas.',
          tone: 'success' as const,
        },
    appData.moderationQueue.length > 0 && sessionUser.role === 'admin'
      ? {
          id: 'moderation',
          title: 'Itens aguardando moderacao',
          detail: `${appData.moderationQueue.length} publicacao(es) precisam de revisao.`,
          tone: 'warning' as const,
        }
      : null,
    appData.rideRequestsInbox.some((request) => request.status === 'Aceito' && request.requesterId === sessionUser.id)
      ? {
          id: 'ride-accepted',
          title: 'Pedido de carona aceito',
          detail: 'Ha um motorista disponivel em seus pedidos de carona.',
          tone: 'success' as const,
        }
      : null,
    appliedPostIds.length > 0
      ? {
          id: 'applications',
          title: 'Interesses registrados',
          detail: `${appliedPostIds.length} interesse(s) registrado(s) nesta sessao.`,
          tone: 'info' as const,
        }
      : null,

    ...appData.muralPosts
      .filter((post) => {
        const lidas = JSON.parse(localStorage.getItem('notificacoesLidas') || '[]')
        return post.author === sessionUser.name && post.status === 'Aprovado' && !lidas.includes(post.id)
      })
      .map((post) => ({
        id: `mural-approved-${post.id}`,
        title: 'Publicação Aprovada!',
        detail: `O seu post "${post.title}" foi revisado e já está disponível no Mural Acadêmico.`,
        tone: 'success' as const,
      })),

  ].filter((item): item is { id: string; title: string; detail: string; tone: 'info' | 'warning' | 'success' } => Boolean(item))

  return (
    <>
      <AuthenticatedLayout
        sessionUser={sessionUser}
        currentView={currentView}
        isSidebarOpen={isSidebarOpen}
        isProfileMenuOpen={isProfileMenuOpen}
        isAccessibilityMenuOpen={isAccessibilityMenuOpen}
        isNotificationsOpen={isNotificationsOpen}
        profileMenuRef={profileMenuRef}
        accessibilityMenuRef={accessibilityMenuRef}
        notificationsMenuRef={notificationsMenuRef}
        accessibilitySettings={accessibilitySettings}
        notifications={notifications}
        menuItems={menuItems}
        onToggleSidebar={() => setIsSidebarOpen((current) => !current)}
        onChangeView={setCurrentView}
        onRefresh={() => void refreshAppData()}
        onToggleProfileMenu={() => {
          setIsProfileMenuOpen((current) => !current)
          setIsAccessibilityMenuOpen(false)
          setIsNotificationsOpen(false)
        }}
        onToggleAccessibilityMenu={() => {
          setIsAccessibilityMenuOpen((current) => !current)
          setIsProfileMenuOpen(false)
          setIsNotificationsOpen(false)
        }}
      onToggleNotifications={() => {
          if (isNotificationsOpen) {
            const aprovados = appData.muralPosts
              .filter((post) => post.author === sessionUser.name && post.status === 'Aprovado')
              .map((post) => post.id)
            
            const lidas = JSON.parse(localStorage.getItem('notificacoesLidas') || '[]')
            const novasLidas = Array.from(new Set([...lidas, ...aprovados]))
            localStorage.setItem('notificacoesLidas', JSON.stringify(novasLidas))
          }

          setIsNotificationsOpen((current) => !current)
          setIsProfileMenuOpen(false)
          setIsAccessibilityMenuOpen(false)
        }}
        onToggleAccessibilitySetting={handleToggleAccessibilitySetting}
        onLogout={() => void handleLogout()}
      >
        {currentView === 'home' ? (
          <HomeView 
            dashboard={appData.dashboard} 
            onNavigate={(view) => setCurrentView(view)} 
          />
        ) : null}
        {currentView === 'rides' ? (
          <RidesView
            currentUserId={sessionUser.id}
            rides={appData.rides ?? []}
            rideHotspots={appData.rideHotspots ?? []}
            rideRequestsInbox={appData.rideRequestsInbox ?? []}
            rideInterestsInbox={appData.rideInterestsInbox ?? []}
            onOpenRideModal={handleStartRideCreation}
            onEditRide={(ride) => handleStartRideEdit(ride)}
            onCreateRideRequest={async (zone, payload) => {
              const response = await requestJson<{ data: AppData }>('/api/ride-requests', {
                method: 'POST',
                body: JSON.stringify({
                  userId: sessionUser.id,
                  zone,
                  whatsapp: payload.whatsapp,
                  pickupAddress: payload.pickupAddress,
                  weekdays: payload.weekdays ?? [],
                }),
              })
              setAppData(response.data)
            }}
            onUpdateRideRequest={async (requestId, zone, payload) => {
              const response = await requestJson<{ data: AppData }>(`/api/ride-requests/${requestId}`, {
                method: 'PATCH',
                body: JSON.stringify({
                  userId: sessionUser.id,
                  zone,
                  whatsapp: payload.whatsapp,
                  pickupAddress: payload.pickupAddress,
                  weekdays: payload.weekdays ?? [],
                }),
              })
              setAppData(response.data)
            }}
            onCloseRide={async (rideId) => {
              const response = await requestJson<{ data: AppData }>(`/api/rides/${rideId}/close`, {
                method: 'PATCH',
                body: JSON.stringify({ userId: sessionUser.id }),
              })
              setAppData(response.data)
            }}
            onDeclareRideInterest={async (rideId, payload) => {
              const response = await requestJson<{ data: AppData }>(`/api/rides/${rideId}/interests`, {
                method: 'POST',
                body: JSON.stringify({
                  userId: sessionUser.id,
                  whatsapp: payload.whatsapp,
                  pickupAddress: payload.pickupAddress,
                }),
              })
              setAppData(response.data)
            }}
            onAcceptRideRequest={async (requestId) => {
              const response = await requestJson<{ data: AppData }>(`/api/ride-requests/${requestId}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ userId: sessionUser.id, status: 'Aceito' }),
              })
              setAppData(response.data)
            }}
            onDeleteRideRequest={async (requestId) => {
              const previousData = appData

              if (previousData) {
                setAppData(removeRideRequestFromAppData(previousData, requestId))
              }

              try {
                await requestJson<{ data: AppData }>(`/api/ride-requests/${requestId}?userId=${sessionUser.id}`, {
                  method: 'DELETE',
                })
                await refreshAppData(sessionUser)
              } catch (error) {
                if (previousData) {
                  setAppData(previousData)
                }

                throw error
              }
            }}
          />
        ) : null}
        {currentView === 'lostFound' ? (
          <LostFoundView
            lostItems={appData.lostItems}
            onOpenRegisterModal={() => {
              setLostItemForm((current) => ({
                ...current,
                foundBy: current.foundBy || sessionUser.name,
              }))
              setIsLostItemModalOpen(true)
            }}
          />
        ) : null}
        {currentView === 'career' ? (
          <CareerView
            careerProfile={careerProfile}
            isSaving={isSavingProfile}
            onCareerChange={setCareerProfile}
            onSave={() => void handleSaveProfile()}
          />
        ) : null}
       {currentView === 'mural' ? (
          <MuralView
            userRole={sessionUser.role}
            muralPosts={appData.muralPosts}
            importantDeadlines={appData.importantDeadlines}
            careerProfile={careerProfile}
            appliedPostIds={appliedPostIds}
            jobInterests={appData.jobInterests ?? []} 
            onApply={(post) => void handleApply(post)}
            onOpenPublishModal={() => setIsPublishModalOpen(true)}
            onOpenReportModal={() => setIsReportModalOpen(true)}
          />
        ) : null}
        {currentView === 'moderation' ? (
          <ModerationView
            moderationQueue={appData.moderationQueue}
            reports={appData.reports}
            dashboard={appData.dashboard}
            lostItems={appData.lostItems}
            rides={appData.rides ?? []}
            rideRequests={appData.rideRequestsInbox ?? []}
            onRefresh={() => void refreshAppData()}
            onModerate={(status, item) => void handleModerationAction(status, item)}
            onMarkLostItemRecovered={(item) => void handleMarkLostItemRecovered(item)}
            onDelete={(item) => void handleRequestDelete(item)}
            onDeleteRideItem={(id, type, title) => setRideItemParaExcluir({ id, type, title })}
            onOpenLostItemModal={() => {
              setLostItemForm((current) => ({
                ...current,
                foundBy: current.foundBy || sessionUser.name,
              }))
              setIsLostItemModalOpen(true)
            }}
          />
        ) : null}
        {currentView === 'database' ? (
          <DatabaseView
            snapshot={adminSnapshot}
            isLoading={isLoadingSnapshot}
            onLoad={() => void loadAdminSnapshot()}
          />
        ) : null}
      </AuthenticatedLayout>

      {/* === MODAIS RENDERIZADOS AQUI === */}

      {isPublishModalOpen ? (
        <PublishModal
          publishForm={publishForm}
          onClose={() => setIsPublishModalOpen(false)}
          onSubmit={(event) => void handlePublishSubmit(event)}
          onChange={setPublishForm}
        />
      ) : null}

      {isReportModalOpen ? (
        <ReportModal
          reportForm={reportForm}
          onClose={() => setIsReportModalOpen(false)}
          onSubmit={(event) => void handleReportSubmit(event)}
          onChange={setReportForm}
        />
      ) : null}

      {isRideModalOpen ? (
        <RideModal
          rideForm={rideForm}
          mode={editingRideId ? 'edit' : 'create'}
          onClose={() => {
            setIsRideModalOpen(false)
            setEditingRideId(null)
          }}
          onSubmit={(event) => void handleRideSubmit(event)}
          onChange={setRideForm}
        />
      ) : null}

      {isLostItemModalOpen ? (
        <LostItemModal
          lostItemForm={lostItemForm}
          onClose={() => setIsLostItemModalOpen(false)}
          onSubmit={(event) => void handleLostItemSubmit(event)}
          onChange={setLostItemForm}
        />
      ) : null}

      {/* NOSSO MODAL DE EXCLUSÃO DE PUBLICAÇÕES */}
      {itemParaExcluir ? (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-content delete-confirm-modal" style={{ background: 'white', padding: '30px', borderRadius: '12px', maxWidth: '400px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <div className="modal-icon-warning" style={{ fontSize: '50px', marginBottom: '15px' }}>⚠️</div>
            <h3 style={{ margin: '0 0 10px 0' }}>Excluir publicacao?</h3>
            <p style={{ margin: '0 0 24px 0', color: '#4b5563' }}>
              Voce esta prestes a remover permanentemente <strong>"{itemParaExcluir.title}"</strong> do mural. Esta acao nao pode ser desfeita.
            </p>
            
            <div className="modal-actions" style={{ display: 'flex', gap: '16px', justifyContent: 'center', alignItems: 'center' }}>
              <button 
                type="button"
                className="ghost-button" 
                onClick={() => setItemParaExcluir(null)}
                style={{ margin: 0 }}
              >
                Cancelar
              </button>
              <button 
                type="button"
                className="primary-button" 
                style={{ backgroundColor: '#dc2626', color: 'white', border: 'none', margin: 0 }} 
                onClick={() => void handleConfirmDelete()}
              >
                Excluir agora
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* NOSSO MODAL UNIFICADO DE CARONAS (OFERTAS E PEDIDOS) */}
      {rideItemParaExcluir ? (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-content delete-confirm-modal" style={{ background: 'white', padding: '30px', borderRadius: '12px', maxWidth: '400px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <div className="modal-icon-warning" style={{ fontSize: '50px', marginBottom: '15px' }}>⚠️</div>
            <h3 style={{ margin: '0 0 10px 0' }}>Excluir {rideItemParaExcluir.type.toLowerCase()}?</h3>
            <p style={{ margin: '0 0 24px 0', color: '#4b5563' }}>
              Voce esta prestes a remover permanentemente a {rideItemParaExcluir.type.toLowerCase()} <strong>"{rideItemParaExcluir.title}"</strong>. Esta acao nao pode ser desfeita.
            </p>
            
            <div className="modal-actions" style={{ display: 'flex', gap: '16px', justifyContent: 'center', alignItems: 'center' }}>
              <button type="button" className="ghost-button" onClick={() => setRideItemParaExcluir(null)} style={{ margin: 0 }}>
                Cancelar
              </button>
              <button type="button" className="primary-button" style={{ backgroundColor: '#dc2626', color: 'white', border: 'none', margin: 0 }} onClick={() => void handleConfirmDeleteRideItem()}>
                Excluir agora
              </button>
            </div>
          </div>
        </div>
      ) : null}

    </>
  )
}

export default App