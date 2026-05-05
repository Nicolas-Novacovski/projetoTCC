import { useEffect, useRef, useState } from 'react'
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
  LostItemForm,
  ModerationPost,
  PageView,
  PostStatus,
  PublishForm,
  RideForm,
  RideOffer,
} from './types/app'

const SESSION_STORAGE_KEY = 'central-academica-utp:session-user'
const VIEW_STORAGE_KEY = 'central-academica-utp:current-view'
const APP_DATA_STORAGE_KEY = 'central-academica-utp:app-data'

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
  const [editingRideId, setEditingRideId] = useState<number | null>(null)
  const [adminSnapshot, setAdminSnapshot] = useState<AdminDatabaseSnapshot | null>(null)
  const [isLoadingSnapshot, setIsLoadingSnapshot] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [publishForm, setPublishForm] = useState<PublishForm>({
    category: 'Vaga',
    title: '',
    location: '',
    description: '',
  })
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

  useEffect(() => {
    if (appData) {
      setCareerProfile(appData.careerProfile)
    }
  }, [appData])

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
      } catch {
        window.localStorage.removeItem(APP_DATA_STORAGE_KEY)
      }
    }

    void refreshAppData(parsedSession)
      .catch((error) => {
        console.warn('Nao foi possivel atualizar a sessao restaurada.', error)
      })
      .finally(() => {
        setIsRestoringSession(false)
      })
  }, [])

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
    }

    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isProfileMenuOpen])

  async function refreshAppData(user = sessionUser) {
    if (!user) return
    const data = await requestJson<AppData>(`/api/app-data?userId=${user.id}&role=${user.role}`)
    setAppData(data)
    setCareerProfile(data.careerProfile)
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
        body: JSON.stringify({ userId: sessionUser.id, ...publishForm }),
      })

      setAppData(response.data)
      setCareerProfile(response.data.careerProfile)
      setIsPublishModalOpen(false)
      setPublishForm({ category: 'Vaga', title: '', location: '', description: '' })

      await toast.fire({ icon: 'success', title: 'Publicacao enviada para moderacao.' })
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Falha ao publicar',
        text: error instanceof Error ? error.message : 'Nao foi possivel salvar a publicacao.',
        confirmButtonText: 'Fechar',
      })
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
      await Swal.fire({
        icon: status === 'Aprovado' ? 'success' : 'info',
        title: `${status} publicacao`,
        html: `<strong>${item.title}</strong><br />Autor: ${item.author}<br />Categoria: ${item.category}`,
        confirmButtonText: 'Fechar',
      })
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Falha na moderacao',
        text: error instanceof Error ? error.message : 'Nao foi possivel atualizar a publicacao.',
        confirmButtonText: 'Fechar',
      })
    }
  }

  async function handleApply(postTitle: string) {
    await toast.fire({ icon: 'success', title: `Interesse registrado em "${postTitle}".` })
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
      !lostItemForm.foundBy.trim() ||
      !lostItemForm.contact.trim()
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
        body: JSON.stringify({ userId: sessionUser.id, ...lostItemForm }),
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

  return (
    <>
      <AuthenticatedLayout
        sessionUser={sessionUser}
        currentView={currentView}
        isSidebarOpen={isSidebarOpen}
        isProfileMenuOpen={isProfileMenuOpen}
        profileMenuRef={profileMenuRef}
        menuItems={menuItems}
        onToggleSidebar={() => setIsSidebarOpen((current) => !current)}
        onChangeView={setCurrentView}
        onRefresh={() => void refreshAppData()}
        onToggleProfileMenu={() => setIsProfileMenuOpen((current) => !current)}
        onLogout={() => void handleLogout()}
      >
        {currentView === 'home' ? <HomeView dashboard={appData.dashboard} /> : null}
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
            onApply={(title) => void handleApply(title)}
            onOpenPublishModal={() => setIsPublishModalOpen(true)}
          />
        ) : null}
        {currentView === 'moderation' ? (
          <ModerationView
            moderationQueue={appData.moderationQueue}
            reports={appData.reports}
            dashboard={appData.dashboard}
            onRefresh={() => void refreshAppData()}
            onModerate={(status, item) => void handleModerationAction(status, item)}
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

      {isPublishModalOpen ? (
        <PublishModal
          publishForm={publishForm}
          onClose={() => setIsPublishModalOpen(false)}
          onSubmit={(event) => void handlePublishSubmit(event)}
          onChange={setPublishForm}
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
    </>
  )
}

export default App
