import { useEffect, useRef, useState } from 'react'
import type { Dispatch, FormEvent, SetStateAction } from 'react'
import Swal from 'sweetalert2'
import './App.css'

type UserRole = 'student' | 'admin'
type PageView = 'home' | 'rides' | 'lostFound' | 'career' | 'mural' | 'moderation' | 'database'
type LoginMode = 'student' | 'admin'
type PostStatus = 'Pendente' | 'Aprovado' | 'Revisao'

type AppUser = { id: number; role: UserRole; name: string }
type DashboardStats = {
  ridesCount: number
  lostItemsCount: number
  muralCount: number
  pendingModerationCount: number
  reportsCount: number
}
type Deadline = { title: string; detail: string }
type ModerationPost = {
  id: number
  title: string
  category: string
  author: string
  status: PostStatus
  submittedAt: string
}
type RideOffer = {
  id: number
  driverId: number
  zone: string
  title: string
  driver: string
  time: string
  seats: string
  meeting: string
  vehicle: string
  status: string
  whatsapp: string
  requestCount: number
}
type RideHotspot = { id: string; name: string; detail: string }
type LostItem = {
  id: number
  title: string
  place: string
  date: string
  status: string
  category: string
  description: string
  foundBy: string
  contact: string
}
type LostItemForm = {
  title: string
  place: string
  date: string
  status: string
  category: string
  description: string
  foundBy: string
  contact: string
}
type PublishForm = { category: string; title: string; location: string; description: string }
type RideForm = {
  zone: string
  title: string
  departureTime: string
  seats: string
  meetingPoint: string
  vehicle: string
  whatsapp: string
}
type RideRequestForm = { whatsapp: string; pickupAddress: string }
type CareerProfile = {
  course: string
  semester: string
  resumeFileName: string
  desiredArea: string
  salaryExpectation: string
  workModel: string
  preferredCity: string
}
type MuralPost = {
  id: number
  category: string
  title: string
  subtitle: string
  tag: string
  description: string
  status: PostStatus
  submittedAt: string
  author: string
  button: string | null
  meta: string[] | null
}
type Report = { id: number; title: string; detail: string; status: string; createdAt: string }
type RideRequest = {
  id: number
  requesterId: number
  requesterName: string
  zone: string
  requesterWhatsapp: string
  pickupAddress: string
  notes: string | null
  status: string
  acceptedByUserId: number | null
  acceptedByName: string | null
  acceptedByWhatsapp: string | null
  createdAt: string
}
type RideInterest = {
  id: number
  rideId: number
  requesterId: number
  requesterName: string
  requesterWhatsapp: string
  pickupAddress: string
  status: string
  createdAt: string
}
type AppData = {
  user: AppUser
  dashboard: DashboardStats
  rides: RideOffer[]
  rideHotspots: RideHotspot[]
  lostItems: LostItem[]
  muralPosts: MuralPost[]
  moderationQueue: ModerationPost[]
  reports: Report[]
  rideRequestsInbox: RideRequest[]
  rideInterestsInbox: RideInterest[]
  importantDeadlines: Deadline[]
  careerProfile: CareerProfile
}

type AdminDatabaseSnapshot = {
  totals: Record<string, number>
  tables: {
    usuarios: Array<Record<string, unknown>>
    publicacoes_mural: Array<Record<string, unknown>>
    caronas: Array<Record<string, unknown>>
    solicitacoes_caronas: Array<Record<string, unknown>>
    pedidos_caronas: Array<Record<string, unknown>>
    achados_perdidos: Array<Record<string, unknown>>
    perfis_profissionais: Array<Record<string, unknown>>
    denuncias: Array<Record<string, unknown>>
  }
}

const studentCredentials = { ra: '2024193227', birthDate: '2004-05-18' }
const adminCredentials = { login: 'admin.utp', password: 'moderacao123' }
const emptyCareerProfile: CareerProfile = {
  course: '',
  semester: '',
  resumeFileName: '',
  desiredArea: '',
  salaryExpectation: '',
  workModel: 'Hibrido',
  preferredCity: '',
}
const emptyLostItemForm: LostItemForm = {
  title: '',
  place: '',
  date: '',
  status: 'Aguardando retirada',
  category: 'Documentos',
  description: '',
  foundBy: '',
  contact: '',
}

const toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 2400,
  timerProgressBar: true,
})

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response

  try {
    response = await fetch(path, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    })
  } catch {
    throw new Error('Nao foi possivel conectar ao servidor. Verifique se o back-end esta rodando.')
  }

  const rawBody = await response.text()
  const contentType = response.headers.get('content-type') ?? ''

  let data: (T & { message?: string }) | null = null

  if (rawBody.trim()) {
    if (contentType.includes('application/json')) {
      try {
        data = JSON.parse(rawBody) as T & { message?: string }
      } catch {
        throw new Error('O servidor respondeu com um JSON invalido.')
      }
    } else {
      if (rawBody.includes('<!doctype html') || rawBody.includes('<html')) {
        throw new Error(
          'A API respondeu com HTML em vez de JSON. Reinicie o back-end com npm run dev:server e tente novamente.',
        )
      }

      throw new Error('O servidor respondeu em um formato inesperado.')
    }
  }

  if (!response.ok) {
    if (!data && [502, 503, 504].includes(response.status)) {
      throw new Error('O back-end nao respondeu. Verifique se o servidor foi iniciado com npm run dev:server.')
    }

    throw new Error(
      data?.message ||
        `A requisicao falhou com status ${response.status}. Verifique se o back-end esta rodando.`,
    )
  }

  if (!data) {
    throw new Error('O servidor retornou uma resposta vazia.')
  }

  return data
}

function showFeatureAlert(title: string, text: string) {
  return Swal.fire({ icon: 'info', title, text, confirmButtonText: 'Entendi' })
}

function buildWhatsAppLink(phone: string, message: string) {
  const digitsOnly = phone.replace(/\D/g, '')

  if (!digitsOnly) {
    return null
  }

  const normalizedPhone =
    digitsOnly.length === 10 || digitsOnly.length === 11
      ? `55${digitsOnly}`
      : digitsOnly

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`
}

function renderWhatsAppIconMarkup() {
  return `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 4a8 8 0 0 0-6.9 12l-1.1 4 4.1-1A8 8 0 1 0 12 4Z" />
      <path d="M9.3 8.9c.2-.4.4-.4.7-.4h.6c.2 0 .4 0 .5.4l.5 1.5c.1.3 0 .5-.1.7l-.4.5c-.1.1-.2.3-.1.5.3.7 1 1.8 2.2 2.4.2.1.4.1.5 0l.6-.7c.2-.2.4-.2.6-.1l1.4.7c.2.1.4.2.4.5v.5c0 .3-.2.5-.4.7-.4.3-1 .5-1.7.3-1-.2-2.4-.8-3.7-2.2-1.6-1.5-2.3-3.1-2.5-4.2-.1-.7.1-1.3.4-1.6Z" />
    </svg>
  `
}

function showWhatsAppContactModal({
  title,
  personName,
  phone,
  detail,
  buttonLabel,
  message,
}: {
  title: string
  personName: string
  phone: string
  detail: string
  buttonLabel: string
  message: string
}) {
  const whatsappLink = buildWhatsAppLink(phone, message)

  return Swal.fire({
    confirmButtonText: 'Fechar',
    buttonsStyling: false,
    customClass: {
      popup: 'whatsapp-popup',
      confirmButton: 'whatsapp-popup-confirm',
    },
    html: `
      <div class="whatsapp-modal-shell">
        <span class="whatsapp-modal-badge">Contato rapido</span>
        <h2 class="whatsapp-modal-heading">${title}</h2>
        <div class="whatsapp-modal-card">
          <div class="whatsapp-modal-hero">
            <span class="whatsapp-modal-hero-icon">${renderWhatsAppIconMarkup()}</span>
            <div>
              <strong>${personName}</strong>
              <span>${phone}</span>
            </article>
          </div>
          <div class="whatsapp-modal-detail">${detail}</div>
          ${
            whatsappLink
              ? `<a class="whatsapp-shortcut whatsapp-shortcut-large" href="${whatsappLink}" target="_blank" rel="noopener noreferrer" aria-label="${buttonLabel}">
                  <span class="whatsapp-shortcut-icon">${renderWhatsAppIconMarkup()}</span>
                  <span>${buttonLabel}</span>
                </a>`
              : '<p class="whatsapp-modal-warning">Numero de WhatsApp invalido para redirecionamento.</p>'
          }
        </div>
      </div>
    `,
  })
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
  const [isLoading, setIsLoading] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false)
  const [isRideModalOpen, setIsRideModalOpen] = useState(false)
  const [isLostItemModalOpen, setIsLostItemModalOpen] = useState(false)
  const [adminSnapshot, setAdminSnapshot] = useState<AdminDatabaseSnapshot | null>(null)
  const [isLoadingSnapshot, setIsLoadingSnapshot] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement | null>(null)
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
  })
  const [careerProfile, setCareerProfile] = useState<CareerProfile>(emptyCareerProfile)
  const [lostItemForm, setLostItemForm] = useState<LostItemForm>(emptyLostItemForm)

  useEffect(() => {
    if (appData) setCareerProfile(appData.careerProfile)
  }, [appData])

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
      !rideForm.whatsapp.trim()
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
      const response = await requestJson<{ data: AppData }>('/api/rides', {
        method: 'POST',
        body: JSON.stringify({
          userId: sessionUser.id,
          ...rideForm,
        }),
      })

      setAppData(response.data)
      setIsRideModalOpen(false)
      setRideForm({
        zone: '',
        title: '',
        departureTime: '',
        seats: '',
        meetingPoint: '',
        vehicle: '',
        whatsapp: '',
      })

      await toast.fire({
        icon: 'success',
        title: 'Carona publicada com sucesso.',
      })
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Falha ao publicar carona',
        text: error instanceof Error ? error.message : 'Nao foi possivel salvar a carona.',
        confirmButtonText: 'Fechar',
      })
    }
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
        body: JSON.stringify({
          userId: sessionUser.id,
          ...lostItemForm,
        }),
      })

      setAppData(response.data)
      setIsLostItemModalOpen(false)
      setLostItemForm({
        ...emptyLostItemForm,
        foundBy: sessionUser.name,
      })

      await toast.fire({
        icon: 'success',
        title: 'Item registrado com sucesso.',
      })
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

  if (!sessionUser || !appData) {
    return (
      <div className="login-page">
        <div className="login-panel">
          <div className="login-hero">
            <span className="login-eyebrow">Central Academica UTP</span>
            <h1>{loginMode === 'student' ? 'Acesse com seu RA' : 'Acesso administrativo'}</h1>
            <p>
              {loginMode === 'student'
                ? 'Entre com o Registro do Aluno e sua data de nascimento para abrir o portal conectado ao Neon.'
                : 'Entre com as credenciais da moderacao para revisar publicacoes e denuncias em tempo real.'}
            </p>
            <div className="login-demo-card">
              <span className="login-demo-label">{loginMode === 'student' ? 'Credencial de aluno' : 'Credencial administrativa'}</span>
              <strong>{loginMode === 'student' ? studentCredentials.ra : adminCredentials.login}</strong>
              <small>{loginMode === 'student' ? `Data de nascimento: ${studentCredentials.birthDate}` : `Senha de teste: ${adminCredentials.password}`}</small>
            </div>
          </div>
          <form className="login-card" onSubmit={(event) => void handleLogin(event)}>
            <div className="login-card-header">
              <h2>{loginMode === 'student' ? 'Login do aluno' : 'Login do administrador'}</h2>
              <p>Preencha os dados para entrar no sistema.</p>
            </div>
            <div className="login-mode-switch" role="tablist" aria-label="Tipo de acesso">
              <button className={`login-mode-button${loginMode === 'student' ? ' is-active' : ''}`} type="button" onClick={() => { setLoginMode('student'); setErrorMessage('') }}>Aluno</button>
              <button className={`login-mode-button${loginMode === 'admin' ? ' is-active' : ''}`} type="button" onClick={() => { setLoginMode('admin'); setErrorMessage('') }}>Administrador</button>
            </div>
            {loginMode === 'student' ? (
              <>
                <label className="form-field"><span>RA</span><input type="text" inputMode="numeric" maxLength={10} placeholder="2024193227" value={ra} onChange={(event) => setRa(event.target.value.replace(/\D/g, '').slice(0, 10))} /></label>
                <label className="form-field"><span>Data de nascimento</span><input type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} /></label>
              </>
            ) : (
              <>
                <label className="form-field"><span>Login</span><input type="text" placeholder="admin.utp" value={adminLogin} onChange={(event) => setAdminLogin(event.target.value)} /></label>
                <label className="form-field"><span>Senha</span><input type="password" placeholder="moderacao123" value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} /></label>
              </>
            )}
            {errorMessage ? <p className="login-error">{errorMessage}</p> : null}
            <button className="login-submit" type="submit" disabled={isLoading}>{isLoading ? 'Entrando...' : loginMode === 'student' ? 'Entrar no sistema' : 'Entrar na moderacao'}</button>
            <div className="login-help">
              <span>Credenciais de teste</span>
              {loginMode === 'student' ? <><p>RA: {studentCredentials.ra}</p><p>Data: {studentCredentials.birthDate}</p></> : <><p>Login: {adminCredentials.login}</p><p>Senha: {adminCredentials.password}</p></>}
            </div>
          </form>
        </div>
      </div>
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
    <div className={`app-shell${isSidebarOpen ? '' : ' sidebar-collapsed'}`}>
      <aside className="sidebar">
        <div className="sidebar-header"><span className="brand-name">{sessionUser.role === 'admin' ? 'Painel UTP' : 'Portal Tuiuti'}</span></div>
        <nav className="sidebar-nav" aria-label="Menu lateral">
          {menuItems.map(({ label, icon: Icon, view }) => (
            <button key={label} className={`sidebar-link${currentView === view ? ' is-active' : ''}`} type="button" title={label} onClick={() => setCurrentView(view)}>
              <Icon />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <div className="topbar-title">
            <button className="icon-button menu-toggle" type="button" aria-label={isSidebarOpen ? 'Recolher menu lateral' : 'Expandir menu lateral'} aria-expanded={isSidebarOpen} onClick={() => setIsSidebarOpen((current) => !current)}>
              <MenuIcon />
            </button>
            <h1>{getPageTitle(currentView)}</h1>
          </div>
          <div className="topbar-actions">
            <button className="icon-button notification-button" type="button" aria-label="Notificacoes" onClick={() => void refreshAppData()}>
              <BellIcon />
              <span className="notification-dot" aria-hidden="true" />
            </button>
            <div className="profile-menu" ref={profileMenuRef}>
              <button
                className="profile-button"
                type="button"
                aria-label="Abrir menu do usuario"
                aria-expanded={isProfileMenuOpen}
                onClick={() => setIsProfileMenuOpen((current) => !current)}
              >
                <span className="profile-button-name">{sessionUser.name}</span>
                <span className="profile-avatar"><UserCircleIcon /></span>
              </button>
              {isProfileMenuOpen ? (
                <div className="profile-dropdown">
                  <div className="profile-dropdown-header">
                    <strong>{sessionUser.name}</strong>
                    <span>{sessionUser.role === 'admin' ? 'Administrador' : 'Aluno'}</span>
                  </div>
                  <button className="profile-dropdown-action" type="button" onClick={() => void handleLogout()}>
                    Sair
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>
        {currentView === 'home' ? <HomeView dashboard={appData.dashboard} /> : null}
        {currentView === 'rides' ? <RidesView currentUserId={sessionUser.id} rides={appData.rides ?? []} rideHotspots={appData.rideHotspots ?? []} rideRequestsInbox={appData.rideRequestsInbox ?? []} rideInterestsInbox={appData.rideInterestsInbox ?? []} onOpenRideModal={() => setIsRideModalOpen(true)} onCreateRideRequest={async (zone, payload) => {
          const response = await requestJson<{ data: AppData }>(`/api/ride-requests`, {
            method: 'POST',
            body: JSON.stringify({
              userId: sessionUser.id,
              zone,
              whatsapp: payload.whatsapp,
              pickupAddress: payload.pickupAddress,
            }),
          })
          setAppData(response.data)
        }} onCloseRide={async (rideId) => {
          const response = await requestJson<{ data: AppData }>(`/api/rides/${rideId}/close`, {
            method: 'PATCH',
            body: JSON.stringify({ userId: sessionUser.id }),
          })
          setAppData(response.data)
        }} onDeclareRideInterest={async (rideId, payload) => {
          const response = await requestJson<{ data: AppData }>(`/api/rides/${rideId}/interests`, {
            method: 'POST',
            body: JSON.stringify({
              userId: sessionUser.id,
              whatsapp: payload.whatsapp,
              pickupAddress: payload.pickupAddress,
            }),
          })
          setAppData(response.data)
        }} onAcceptRideRequest={async (requestId) => {
          const response = await requestJson<{ data: AppData }>(`/api/ride-requests/${requestId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ userId: sessionUser.id, status: 'Aceito' }),
          })
          setAppData(response.data)
        }} /> : null}
        {currentView === 'lostFound' ? <LostFoundView lostItems={appData.lostItems} onOpenRegisterModal={() => {
          setLostItemForm((current) => ({
            ...current,
            foundBy: current.foundBy || sessionUser.name,
          }))
          setIsLostItemModalOpen(true)
        }} /> : null}
        {currentView === 'career' ? <CareerView careerProfile={careerProfile} isSaving={isSavingProfile} onCareerChange={setCareerProfile} onSave={() => void handleSaveProfile()} /> : null}
        {currentView === 'mural' ? <MuralView userRole={sessionUser.role} muralPosts={appData.muralPosts} importantDeadlines={appData.importantDeadlines} onApply={(title) => void handleApply(title)} onOpenPublishModal={() => setIsPublishModalOpen(true)} /> : null}
        {currentView === 'moderation' ? <ModerationView moderationQueue={appData.moderationQueue} reports={appData.reports} dashboard={appData.dashboard} onRefresh={() => void refreshAppData()} onModerate={(status, item) => void handleModerationAction(status, item)} /> : null}
        {currentView === 'database' ? <DatabaseView snapshot={adminSnapshot} isLoading={isLoadingSnapshot} onLoad={() => void loadAdminSnapshot()} /> : null}
      </main>
      {isPublishModalOpen ? (
        <div className="details-modal-backdrop" onClick={() => setIsPublishModalOpen(false)}>
          <div className="details-modal publish-modal" onClick={(event) => event.stopPropagation()}>
            <div className="details-modal-header">
              <div><span className="detail-tag">Novo post</span><h3>Publicar no mural</h3></div>
              <button className="ghost-button" type="button" onClick={() => setIsPublishModalOpen(false)}>Fechar</button>
            </div>
            <form className="publish-form" onSubmit={(event) => void handlePublishSubmit(event)}>
              <div className="publish-grid">
                <label className="form-field"><span>Categoria</span><select value={publishForm.category} onChange={(event) => setPublishForm((current) => ({ ...current, category: event.target.value }))}><option>Vaga</option><option>Evento</option><option>Comunicado</option><option>Grupo de estudo</option></select></label>
                <label className="form-field"><span>Local ou empresa</span><input type="text" placeholder="Ex.: Curitiba ou Empresa XPTO" value={publishForm.location} onChange={(event) => setPublishForm((current) => ({ ...current, location: event.target.value }))} /></label>
              </div>
              <label className="form-field"><span>Titulo</span><input type="text" placeholder="Ex.: Estagio em Desenvolvimento Web" value={publishForm.title} onChange={(event) => setPublishForm((current) => ({ ...current, title: event.target.value }))} /></label>
              <label className="form-field"><span>Descricao</span><textarea rows={6} placeholder="Descreva a oportunidade, evento ou comunicado." value={publishForm.description} onChange={(event) => setPublishForm((current) => ({ ...current, description: event.target.value }))} /></label>
              <div className="details-modal-footer">
                <div><span className="detail-label">Fluxo</span><strong>O post sera enviado para moderacao antes de aparecer no mural.</strong></div>
                <button className="primary-button" type="submit">Enviar publicacao</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
      {isRideModalOpen ? (
        <div className="details-modal-backdrop" onClick={() => setIsRideModalOpen(false)}>
          <div className="details-modal publish-modal" onClick={(event) => event.stopPropagation()}>
            <div className="details-modal-header">
              <div><span className="detail-tag">Nova carona</span><h3>Oferecer carona</h3></div>
              <button className="ghost-button" type="button" onClick={() => setIsRideModalOpen(false)}>Fechar</button>
            </div>
            <form className="publish-form" onSubmit={(event) => void handleRideSubmit(event)}>
              <div className="publish-grid">
                <label className="form-field">
                  <span>Bairro / zona</span>
                  <input
                    type="text"
                    placeholder="Ex.: Santa Felicidade"
                    value={rideForm.zone}
                    onChange={(event) => setRideForm((current) => ({ ...current, zone: event.target.value }))}
                  />
                </label>
                <label className="form-field">
                  <span>Horario de saida</span>
                  <input type="time" value={rideForm.departureTime} onChange={(event) => setRideForm((current) => ({ ...current, departureTime: event.target.value }))} />
                </label>
              </div>
              <label className="form-field">
                <span>Titulo da rota</span>
                <input type="text" placeholder="Ex.: Boqueirao -> Campus UTP" value={rideForm.title} onChange={(event) => setRideForm((current) => ({ ...current, title: event.target.value }))} />
              </label>
              <div className="publish-grid">
                <label className="form-field">
                  <span>Vagas</span>
                  <input type="text" placeholder="Ex.: 3 vagas" value={rideForm.seats} onChange={(event) => setRideForm((current) => ({ ...current, seats: event.target.value }))} />
                </label>
                <label className="form-field">
                  <span>Endereco</span>
                  <input type="text" placeholder="Ex.: Rua Joao Negrrao, 120" value={rideForm.meetingPoint} onChange={(event) => setRideForm((current) => ({ ...current, meetingPoint: event.target.value }))} />
                </label>
              </div>
              <label className="form-field">
                <span>WhatsApp do motorista</span>
                <input type="text" placeholder="Ex.: (41) 99999-1234" value={rideForm.whatsapp} onChange={(event) => setRideForm((current) => ({ ...current, whatsapp: event.target.value }))} />
              </label>
              <label className="form-field">
                <span>Veiculo</span>
                <input type="text" placeholder="Ex.: Onix prata" value={rideForm.vehicle} onChange={(event) => setRideForm((current) => ({ ...current, vehicle: event.target.value }))} />
              </label>
              <div className="details-modal-footer">
                <div><span className="detail-label">Destino</span><strong>Campus UTP</strong></div>
                <button className="primary-button" type="submit">Publicar carona</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
      {isLostItemModalOpen ? (
        <div className="details-modal-backdrop" onClick={() => setIsLostItemModalOpen(false)}>
          <div className="details-modal publish-modal" onClick={(event) => event.stopPropagation()}>
            <div className="details-modal-header">
              <div><span className="detail-tag">Achados e Perdidos</span><h3>Registrar item</h3></div>
              <button className="ghost-button" type="button" onClick={() => setIsLostItemModalOpen(false)}>Fechar</button>
            </div>
            <form className="publish-form" onSubmit={(event) => void handleLostItemSubmit(event)}>
              <div className="publish-grid">
                <label className="form-field">
                  <span>Categoria</span>
                  <select value={lostItemForm.category} onChange={(event) => setLostItemForm((current) => ({ ...current, category: event.target.value }))}>
                    <option>Documentos</option>
                    <option>Eletronicos</option>
                    <option>Mochilas</option>
                    <option>Acessorios</option>
                    <option>Outros</option>
                  </select>
                </label>
                <label className="form-field">
                  <span>Status</span>
                  <select value={lostItemForm.status} onChange={(event) => setLostItemForm((current) => ({ ...current, status: event.target.value }))}>
                    <option>Aguardando retirada</option>
                    <option>Encontrado na recepcao</option>
                    <option>Encaminhado ao apoio</option>
                  </select>
                </label>
              </div>
              <label className="form-field"><span>Titulo</span><input type="text" placeholder="Ex.: Carteira preta com documentos" value={lostItemForm.title} onChange={(event) => setLostItemForm((current) => ({ ...current, title: event.target.value }))} /></label>
              <div className="publish-grid">
                <label className="form-field"><span>Local encontrado</span><input type="text" placeholder="Ex.: Bloco B - Sala 12" value={lostItemForm.place} onChange={(event) => setLostItemForm((current) => ({ ...current, place: event.target.value }))} /></label>
                <label className="form-field"><span>Data ou horario</span><input type="text" placeholder="Ex.: Hoje, 18:20" value={lostItemForm.date} onChange={(event) => setLostItemForm((current) => ({ ...current, date: event.target.value }))} /></label>
              </div>
              <label className="form-field"><span>Descricao</span><textarea rows={5} placeholder="Descreva o item, caracteristicas e qualquer detalhe util para identificacao." value={lostItemForm.description} onChange={(event) => setLostItemForm((current) => ({ ...current, description: event.target.value }))} /></label>
              <div className="publish-grid">
                <label className="form-field"><span>Registrado por</span><input type="text" value={lostItemForm.foundBy} onChange={(event) => setLostItemForm((current) => ({ ...current, foundBy: event.target.value }))} /></label>
                <label className="form-field"><span>Contato para retirada</span><input type="text" placeholder="Ex.: secretaria@utp.br ou (41) 99999-1234" value={lostItemForm.contact} onChange={(event) => setLostItemForm((current) => ({ ...current, contact: event.target.value }))} /></label>
              </div>
              <div className="details-modal-footer">
                <div><span className="detail-label">Fluxo</span><strong>O item sera exibido imediatamente na lista de achados e perdidos.</strong></div>
                <button className="primary-button" type="submit">Registrar item</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function HomeView({ dashboard }: { dashboard: DashboardStats }) {
  return (
    <section className="page-section home-section">
      <div className="page-heading"><div><h2>Inicio</h2><p>Acesse rapidamente os servicos mais usados da central academica.</p></div></div>
      <div className="home-grid">
        <article className="home-card"><h3>Caronas para hoje</h3><strong>{dashboard.ridesCount} rotas ativas</strong><p>Confira pontos de encontro em Curitiba e reserve sua vaga.</p></article>
        <article className="home-card"><h3>Achados e perdidos</h3><strong>{dashboard.lostItemsCount} itens registrados</strong><p>Veja rapidamente o que foi encontrado no campus nas ultimas 48h.</p></article>
        <article className="home-card"><h3>Mural academico</h3><strong>{dashboard.muralCount} publicacoes visiveis</strong><p>Eventos, vagas e comunicados oficiais publicados pela comunidade.</p></article>
      </div>
    </section>
  )
}

function RidesView({
  currentUserId,
  rides,
  rideHotspots,
  rideRequestsInbox,
  rideInterestsInbox,
  onOpenRideModal,
  onCreateRideRequest,
  onCloseRide,
  onDeclareRideInterest,
  onAcceptRideRequest,
}: {
  currentUserId: number
  rides: RideOffer[]
  rideHotspots: RideHotspot[]
  rideRequestsInbox: RideRequest[]
  rideInterestsInbox: RideInterest[]
  onOpenRideModal: () => void
  onCreateRideRequest: (zone: string, payload: RideRequestForm) => Promise<void>
  onCloseRide: (rideId: number) => Promise<void>
  onDeclareRideInterest: (rideId: number, payload: RideRequestForm) => Promise<void>
  onAcceptRideRequest: (requestId: number) => Promise<void>
}) {
  const safeRides = rides ?? []
  const safeRideRequestsInbox = rideRequestsInbox ?? []
  const safeRideInterestsInbox = rideInterestsInbox ?? []
  const availableZones = [...new Set((rideHotspots ?? []).map((spot) => spot.id).filter(Boolean))]
  const [selectedZone, setSelectedZone] = useState<string>(availableZones[0] ?? 'Centro')
  const [rideSearch, setRideSearch] = useState('')
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)
  const [requestForm, setRequestForm] = useState<RideRequestForm>({ whatsapp: '', pickupAddress: '' })

  useEffect(() => {
    if (!availableZones.includes(selectedZone) && availableZones[0]) {
      setSelectedZone(availableZones[0])
    }
  }, [availableZones, selectedZone])

  const normalizedSearch = rideSearch.trim().toLowerCase()
  const filteredRides = safeRides.filter((ride) => {
    if (!normalizedSearch) {
      return true
    }

    return [ride.zone, ride.title, ride.driver, ride.vehicle]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(normalizedSearch))
  })
  const openRideRequests = safeRideRequestsInbox.filter((request) => request.status === 'Aberto')
  const myRideRequests = safeRideRequestsInbox.filter((request) => request.requesterId === currentUserId)

  async function handleTalkToDriver(ride: RideOffer) {
    await showWhatsAppContactModal({
      title: 'Contato do motorista',
      personName: ride.driver,
      phone: `WhatsApp: ${ride.whatsapp}`,
      detail: `Endereco informado: ${ride.meeting}`,
      buttonLabel: 'Abrir conversa no WhatsApp',
      message: `Oi, ${ride.driver}! Vi sua carona "${ride.title}" no portal da UTP e gostaria de combinar.`,
    })
  }

  async function handleSubmitRideRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!requestForm.whatsapp.trim() || !requestForm.pickupAddress.trim()) {
      await Swal.fire({
        icon: 'warning',
        title: 'Campos obrigatorios',
        text: 'Informe seu WhatsApp e endereco para solicitar a carona.',
        confirmButtonText: 'Corrigir',
      })
      return
    }

    try {
      await onCreateRideRequest(selectedZone, requestForm)
      setIsRequestModalOpen(false)
      setRequestForm({ whatsapp: '', pickupAddress: '' })
      await Swal.fire({
        icon: 'success',
        title: 'Pedido de carona publicado',
        html: `Seu pedido ficou visivel para todos os usuarios na zona <strong>${selectedZone}</strong>.`,
        confirmButtonText: 'Fechar',
      })
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Falha ao solicitar carona',
        text: error instanceof Error ? error.message : 'Nao foi possivel enviar a solicitacao.',
        confirmButtonText: 'Fechar',
      })
    }
  }

  async function handleCloseRide(ride: RideOffer) {
    const result = await Swal.fire({
      icon: 'question',
      title: 'Encerrar vaga?',
      text: `A carona "${ride.title}" sera marcada como encerrada.`,
      showCancelButton: true,
      confirmButtonText: 'Encerrar',
      cancelButtonText: 'Cancelar',
    })

    if (!result.isConfirmed) return

    await onCloseRide(ride.id)
    await toast.fire({ icon: 'success', title: 'Vaga encerrada.' })
  }

  async function handleAcceptRideRequest(request: RideRequest) {
    await onAcceptRideRequest(request.id)

    await showWhatsAppContactModal({
      title: 'Pedido de carona aceito',
      personName: request.requesterName,
      phone: `WhatsApp do solicitante: ${request.requesterWhatsapp}`,
      detail: `Endereco informado: ${request.pickupAddress}`,
      buttonLabel: 'Conversar no WhatsApp',
      message: `Oi, ${request.requesterName}! Vi seu pedido de carona para ${request.zone} no portal da UTP e posso atender.`,
    })
  }

  async function handleDeclareRideInterest(ride: RideOffer) {
    const result = await Swal.fire({
      title: 'Declarar interesse na vaga',
      html: `
        <div class="swal-inline-form">
          <input id="ride-interest-whatsapp" class="swal2-input" placeholder="Seu WhatsApp" />
          <textarea id="ride-interest-address" class="swal2-textarea" placeholder="Seu endereco ou ponto de embarque"></textarea>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Enviar interesse',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const whatsapp = (document.getElementById('ride-interest-whatsapp') as HTMLInputElement | null)?.value.trim() ?? ''
        const pickupAddress = (document.getElementById('ride-interest-address') as HTMLTextAreaElement | null)?.value.trim() ?? ''

        if (!whatsapp || !pickupAddress) {
          Swal.showValidationMessage('Preencha seu WhatsApp e endereco para registrar o interesse.')
          return null
        }

        return { whatsapp, pickupAddress }
      },
    })

    if (!result.isConfirmed || !result.value) {
      return
    }

    await onDeclareRideInterest(ride.id, result.value)
    await toast.fire({ icon: 'success', title: 'Interesse enviado ao motorista.' })
  }

  async function handleContactAcceptedDriver(request: RideRequest) {
    if (!request.acceptedByWhatsapp || !request.acceptedByName) {
      await Swal.fire({
        icon: 'info',
        title: 'Contato ainda indisponivel',
        text: 'O motorista ainda nao informou um numero de WhatsApp para essa carona.',
        confirmButtonText: 'Fechar',
      })
      return
    }

    await showWhatsAppContactModal({
      title: 'Motorista que aceitou',
      personName: request.acceptedByName,
      phone: `WhatsApp do motorista: ${request.acceptedByWhatsapp}`,
      detail: `Zona solicitada: ${request.zone} • Embarque: ${request.pickupAddress}`,
      buttonLabel: 'Falar com o motorista',
      message: `Oi, ${request.acceptedByName}! Vi que voce aceitou meu pedido de carona para ${request.zone} no portal da UTP.`,
    })
  }

  return (
    <section className="page-section rides-section">
      <div className="page-heading">
        <div>
          <h2>Caronas</h2>
          <p>Consulte todas as caronas abertas e use a busca para encontrar bairros, motoristas ou rotas.</p>
        </div>
        <div className="row-actions">
          <button className="secondary-button" type="button" onClick={() => setIsRequestModalOpen(true)}>Solicitar carona</button>
          <button className="secondary-button" type="button" onClick={onOpenRideModal}>Oferecer carona</button>
        </div>
      </div>
      <article className="rides-disclaimer" role="note" aria-label="Aviso importante sobre caronas">
        <div className="rides-disclaimer-icon"><InfoIcon /></div>
        <div className="rides-disclaimer-content">
          <strong>Aviso importante</strong>
          <p>
            A plataforma de caronas existe para aproximar alunos que oferecem e procuram trajetos.
            Horarios, valores, pontos de encontro e demais combinacoes sao definidos diretamente entre
            os participantes, sem intermediacao ou responsabilidade da instituicao.
          </p>
        </div>
      </article>
      <div className="rides-hero">
        <div className="rides-summary-card"><span>Rotas abertas</span><strong>{safeRides.filter((ride) => ride.status === 'Ativa').length}</strong><p>Caronas disponiveis no sistema neste momento.</p></div>
        <div className="rides-summary-card"><span>Destino padrao</span><strong>Campus UTP</strong><p>Rotas focadas no periodo noturno com ponto de encontro definido.</p></div>
        <div className="rides-summary-card"><span>Pedidos publicos</span><strong>{openRideRequests.length}</strong><p>Solicitacoes visiveis para todos os usuarios.</p></div>
      </div>
      <div className="rides-grid">
        <div className="map-card map-card-enhanced">
          <div className="map-card-header">
            <div><h3>Mapa de Curitiba</h3><p>Visualizacao de referencia da cidade para orientar os trajetos e bairros atendidos.</p></div>
            <span className="map-legend">Busca atual: {rideSearch || 'Todas as caronas'}</span>
          </div>
          <div className="real-map-frame">
            <iframe title="Mapa de Curitiba" src="https://www.openstreetmap.org/export/embed.html?bbox=-49.42%2C-25.62%2C-49.17%2C-25.35&layer=mapnik&marker=-25.44%2C-49.27" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          </div>
          <div className="rides-search-bar">
            <input
              type="text"
              placeholder="Buscar por bairro, motorista, rota ou veiculo"
              value={rideSearch}
              onChange={(event) => setRideSearch(event.target.value)}
            />
            <span>{filteredRides.length} resultado(s)</span>
          </div>
        </div>
        <div className="rides-list-panel">
          <div className="rides-list-header"><h3>Rotas disponiveis</h3><p>{normalizedSearch ? `Resultados para "${rideSearch}"` : 'Todas as caronas abertas e cadastradas'}</p></div>
          <div className="rides-list">
            {filteredRides.map((ride) => (
              <article key={ride.id} className="ride-card ride-card-enhanced">
                <div className="ride-card-header">
                  <div><h3>{ride.title}</h3><p>{ride.driver}</p></div>
                  <span className="ride-badge">{ride.status === 'Ativa' ? ride.seats : ride.status}</span>
                </div>
                <div className="ride-meta-grid">
                  <div><span className="ride-meta-label">Saida</span><strong>{ride.time}</strong></div>
                  <div><span className="ride-meta-label">Endereco</span><strong>{ride.meeting}</strong></div>
                  <div><span className="ride-meta-label">Veiculo</span><strong>{ride.vehicle}</strong></div>
                </div>
                <div className="ride-meta-grid">
                  <div><span className="ride-meta-label">WhatsApp</span><strong>{ride.whatsapp}</strong></div>
                  <div><span className="ride-meta-label">Solicitacoes</span><strong>{ride.requestCount}</strong></div>
                  <div><span className="ride-meta-label">Status</span><strong>{ride.status}</strong></div>
                </div>
                {ride.driverId === currentUserId ? (
                  <div className="row-actions">
                    <button type="button" onClick={() => void handleCloseRide(ride)}>Encerrar vaga</button>
                  </div>
                ) : (
                  <div className="ride-contact-actions">
                    <button className="primary-button" type="button" disabled={ride.status !== 'Ativa'} onClick={() => void handleTalkToDriver(ride)}>Entrar em contato com motorista</button>
                    <button className="interest-button" type="button" disabled={ride.status !== 'Ativa'} onClick={() => void handleDeclareRideInterest(ride)}>Declarar interesse</button>
                  </div>
                )}
                {ride.driverId === currentUserId ? (
                  <div className="ride-interest-list">
                    <span className="ride-meta-label">Interessados</span>
                    {safeRideInterestsInbox.filter((interest) => interest.rideId === ride.id).length > 0 ? (
                      safeRideInterestsInbox
                        .filter((interest) => interest.rideId === ride.id)
                        .map((interest) => (
                          <div key={interest.id} className="ride-interest-item">
                            <strong>{interest.requesterName}</strong>
                            <span>{interest.requesterWhatsapp}</span>
                            <span>{interest.pickupAddress}</span>
                          </div>
                        ))
                    ) : (
                      <p>Ninguem declarou interesse nessa vaga ainda.</p>
                    )}
                  </div>
                ) : null}
              </article>
            ))}
            {filteredRides.length === 0 ? <article className="ride-card ride-card-enhanced"><h3>Nenhuma carona encontrada</h3><p>Tente buscar por outro bairro, motorista ou veiculo.</p></article> : null}
          </div>
        </div>
      </div>
      <section className="rides-list-panel ride-requests-panel">
        <div className="moderation-card-header">
          <div><h3>Pedidos publicos de carona</h3><p>Solicitacoes abertas para todos os usuarios visualizarem e atenderem.</p></div>
        </div>
        <div className="ride-requests-list">
          {safeRideRequestsInbox.map((request) => (
            <article key={request.id} className="ride-request-card">
              <div className="ride-request-card-header">
                <div>
                  <strong>{request.zone}</strong>
                  <p>{request.createdAt}</p>
                </div>
                <span className={`status-pill ${request.status === 'Aceito' ? 'status-approved' : 'status-pending'}`}>
                  {request.status}
                </span>
              </div>
              <div className="ride-request-meta">
                <div><span className="ride-meta-label">Solicitante</span><strong>{request.requesterName}</strong></div>
                <div><span className="ride-meta-label">WhatsApp</span><strong>{request.requesterWhatsapp}</strong></div>
                <div><span className="ride-meta-label">Endereco</span><strong>{request.pickupAddress}</strong></div>
                <div><span className="ride-meta-label">Atendido por</span><strong>{request.acceptedByName ?? 'Aguardando motorista'}</strong></div>
              </div>
              <div className="row-actions">
                {request.status === 'Aberto' && request.requesterId !== currentUserId ? (
                  <div className="ride-contact-actions">
                    <button type="button" onClick={() => void handleAcceptRideRequest(request)}>Aceitar carona</button>
                  </div>
                ) : request.requesterId === currentUserId ? (
                  <span>Seu pedido</span>
                ) : (
                  <span>Atendido</span>
                )}
              </div>
            </article>
          ))}
          {safeRideRequestsInbox.length === 0 ? <article className="ride-request-card"><strong>Nenhum pedido aberto</strong><p>Assim que um aluno publicar uma solicitacao, ela aparecera aqui.</p></article> : null}
        </div>
      </section>
      {myRideRequests.length > 0 ? (
        <section className="moderation-card">
          <div className="moderation-card-header">
            <div><h3>Meus pedidos de carona</h3><p>Acompanhe seus pedidos e veja o contato de quem aceitou atender.</p></div>
          </div>
          <div className="my-ride-requests-list">
            {myRideRequests.map((request) => (
              <article key={request.id} className="my-ride-request-card">
                <div className="my-ride-request-header">
                  <strong>{request.zone}</strong>
                  <span className={`status-pill ${request.status === 'Aceito' ? 'status-approved' : 'status-pending'}`}>
                    {request.status}
                  </span>
                </div>
                <p>{request.pickupAddress}</p>
                <p>Seu WhatsApp: {request.requesterWhatsapp}</p>
                {request.acceptedByName ? <p>Motorista: {request.acceptedByName}</p> : <p>Aguardando alguem aceitar.</p>}
                {request.acceptedByWhatsapp ? <p>WhatsApp do motorista: {request.acceptedByWhatsapp}</p> : null}
                {request.acceptedByWhatsapp ? (
                  <div className="ride-contact-actions">
                    <button className="primary-button" type="button" onClick={() => void handleContactAcceptedDriver(request)}>
                      Falar com o motorista
                    </button>
                    <button
                      className="whatsapp-icon-button"
                      type="button"
                      aria-label="Abrir o WhatsApp do motorista que aceitou"
                      onClick={() => void handleContactAcceptedDriver(request)}
                    >
                      <WhatsAppIcon />
                    </button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}
      {isRequestModalOpen ? (
        <div className="details-modal-backdrop" onClick={() => setIsRequestModalOpen(false)}>
          <div className="details-modal publish-modal" onClick={(event) => event.stopPropagation()}>
            <div className="details-modal-header">
              <div><span className="detail-tag">Pedir carona</span><h3>Solicitar carona para a zona {selectedZone}</h3></div>
              <button className="ghost-button" type="button" onClick={() => setIsRequestModalOpen(false)}>Fechar</button>
            </div>
            <form className="publish-form" onSubmit={(event) => void handleSubmitRideRequest(event)}>
              <div className="lost-details-grid">
                <div><span className="detail-label">Zona desejada</span><strong>{selectedZone}</strong></div>
                <div><span className="detail-label">Fluxo</span><strong>Seu pedido ficara visivel para todos os usuarios.</strong></div>
              </div>
              <label className="form-field">
                <span>Bairro de interesse</span>
                <input type="text" value={selectedZone} onChange={(event) => setSelectedZone(event.target.value)} />
              </label>
              <label className="form-field">
                <span>Seu WhatsApp</span>
                <input type="text" placeholder="Ex.: (41) 99999-1234" value={requestForm.whatsapp} onChange={(event) => setRequestForm((current) => ({ ...current, whatsapp: event.target.value }))} />
              </label>
              <label className="form-field">
                <span>Seu endereco de embarque</span>
                <textarea rows={4} placeholder="Ex.: Rua X, numero Y, bairro Z" value={requestForm.pickupAddress} onChange={(event) => setRequestForm((current) => ({ ...current, pickupAddress: event.target.value }))} />
              </label>
              <div className="details-modal-footer">
                <div><span className="detail-label">Fluxo</span><strong>Quem puder ajudar vai ver seu endereco e seu WhatsApp para combinar a carona.</strong></div>
                <button className="primary-button" type="submit">Publicar pedido</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  )
}

function LostFoundView({
  lostItems,
  onOpenRegisterModal,
}: {
  lostItems: LostItem[]
  onOpenRegisterModal: () => void
}) {
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null)
  const [previewItemId, setPreviewItemId] = useState<number>(lostItems[0]?.id ?? 0)

  useEffect(() => {
    if (lostItems[0] && !lostItems.some((item) => item.id === previewItemId)) {
      setPreviewItemId(lostItems[0].id)
    }
  }, [lostItems, previewItemId])

  const previewItem = lostItems.find((item) => item.id === previewItemId) ?? lostItems[0] ?? null
  const selectedItem = lostItems.find((item) => item.id === selectedItemId) ?? null

  async function handleReturnRequest(item: LostItem) {
    await Swal.fire({
      icon: 'success',
      title: 'Solicitacao registrada',
      html: `<strong>${item.title}</strong><br />Entre em contato com: ${item.contact}`,
      confirmButtonText: 'Ok',
    })
  }

  return (
    <section className="page-section lost-found-section">
      <div className="page-heading">
        <div><h2>Achados e Perdidos</h2><p>Itens localizados no campus e registrados para retirada.</p></div>
        <button className="secondary-button" type="button" onClick={onOpenRegisterModal}>Registrar item</button>
      </div>
      <div className="lost-found-toolbar"><span className="filter-chip is-active">Todos</span><span className="filter-chip">Documentos</span><span className="filter-chip">Eletronicos</span><span className="filter-chip">Mochilas</span></div>
      {previewItem ? (
        <div className="lost-found-layout">
          <div className="lost-found-grid">
            {lostItems.map((item) => (
              <button key={item.id} type="button" className={`lost-card${previewItemId === item.id ? ' is-active' : ''}`} onClick={() => setPreviewItemId(item.id)}>
                <div className="lost-card-icon"><SearchIcon /></div>
                <div className="lost-card-body">
                  <h3>{item.title}</h3>
                  <p>{item.place}</p>
                  <div className="lost-card-meta"><span>{item.date}</span><span>{item.status}</span></div>
                </div>
                <span className="lost-card-action" onClick={(event) => { event.stopPropagation(); setPreviewItemId(item.id); setSelectedItemId(item.id) }}>Ver detalhes</span>
              </button>
            ))}
          </div>
          <aside className="lost-details-card">
            <div className="lost-details-header"><span className="detail-tag">{previewItem.category}</span><h3>{previewItem.title}</h3><p>{previewItem.description}</p></div>
            <div className="lost-details-grid">
              <div><span className="detail-label">Local</span><strong>{previewItem.place}</strong></div>
              <div><span className="detail-label">Data</span><strong>{previewItem.date}</strong></div>
              <div><span className="detail-label">Status</span><strong>{previewItem.status}</strong></div>
              <div><span className="detail-label">Registrado por</span><strong>{previewItem.foundBy}</strong></div>
            </div>
            <div className="lost-details-footer">
              <div><span className="detail-label">Contato para retirada</span><strong>{previewItem.contact}</strong></div>
              <button className="primary-button" type="button" onClick={() => setSelectedItemId(previewItem.id)}>Abrir detalhe completo</button>
            </div>
          </aside>
        </div>
      ) : (
        <article className="lost-details-card"><h3>Nenhum item registrado</h3><p>Assim que novos registros forem adicionados ao banco, eles vao aparecer aqui.</p></article>
      )}
      {selectedItem ? (
        <div className="details-modal-backdrop" onClick={() => setSelectedItemId(null)}>
          <div className="details-modal" onClick={(event) => event.stopPropagation()}>
            <div className="details-modal-header">
              <div><span className="detail-tag">{selectedItem.category}</span><h3>{selectedItem.title}</h3></div>
              <button className="ghost-button" type="button" onClick={() => setSelectedItemId(null)}>Fechar</button>
            </div>
            <p className="details-modal-description">{selectedItem.description}</p>
            <div className="lost-details-grid">
              <div><span className="detail-label">Local encontrado</span><strong>{selectedItem.place}</strong></div>
              <div><span className="detail-label">Data do registro</span><strong>{selectedItem.date}</strong></div>
              <div><span className="detail-label">Status atual</span><strong>{selectedItem.status}</strong></div>
              <div><span className="detail-label">Registrado por</span><strong>{selectedItem.foundBy}</strong></div>
            </div>
            <div className="details-modal-footer">
              <div><span className="detail-label">Contato</span><strong>{selectedItem.contact}</strong></div>
              <button className="primary-button" type="button" onClick={() => void handleReturnRequest(selectedItem)}>Solicitar devolucao</button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

function CareerView({
  careerProfile,
  isSaving,
  onCareerChange,
  onSave,
}: {
  careerProfile: CareerProfile
  isSaving: boolean
  onCareerChange: Dispatch<SetStateAction<CareerProfile>>
  onSave: () => void
}) {
  return (
    <section className="page-section career-section">
      <div className="page-heading">
        <div><h2>Perfil Profissional</h2><p>Cadastre seu curriculo e defina preferencias para receber vagas mais alinhadas.</p></div>
        <button className="secondary-button" type="button" onClick={onSave} disabled={isSaving}>{isSaving ? 'Salvando...' : 'Salvar preferencias'}</button>
      </div>
      <div className="career-layout">
        <section className="career-card">
          <div className="career-card-header"><h3>Curriculo</h3><p>Suba seu arquivo e mantenha seus dados academicos atualizados.</p></div>
          <div className="resume-upload-card">
            <span className="detail-label">Arquivo atual</span>
            <strong>{careerProfile.resumeFileName || 'Nenhum curriculo informado'}</strong>
            <label className="ghost-upload-button">
              Trocar curriculo
              <input type="file" accept=".pdf,.doc,.docx" onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) onCareerChange((current) => ({ ...current, resumeFileName: file.name }))
              }} />
            </label>
          </div>
          <div className="publish-grid">
            <label className="form-field"><span>Curso</span><input type="text" value={careerProfile.course} onChange={(event) => onCareerChange((current) => ({ ...current, course: event.target.value }))} /></label>
            <label className="form-field"><span>Semestre</span><input type="text" value={careerProfile.semester} onChange={(event) => onCareerChange((current) => ({ ...current, semester: event.target.value }))} /></label>
          </div>
        </section>
        <section className="career-card">
          <div className="career-card-header"><h3>Preferencias de vaga</h3><p>Essas informacoes ajudam a priorizar oportunidades no mural.</p></div>
          <div className="publish-grid">
            <label className="form-field"><span>Area desejada</span><input type="text" value={careerProfile.desiredArea} onChange={(event) => onCareerChange((current) => ({ ...current, desiredArea: event.target.value }))} /></label>
            <label className="form-field"><span>Pretensao salarial</span><input type="text" value={careerProfile.salaryExpectation} onChange={(event) => onCareerChange((current) => ({ ...current, salaryExpectation: event.target.value }))} /></label>
            <label className="form-field"><span>Modelo de trabalho</span><select value={careerProfile.workModel} onChange={(event) => onCareerChange((current) => ({ ...current, workModel: event.target.value }))}><option>Presencial</option><option>Hibrido</option><option>Remoto</option></select></label>
            <label className="form-field"><span>Cidade de preferencia</span><input type="text" value={careerProfile.preferredCity} onChange={(event) => onCareerChange((current) => ({ ...current, preferredCity: event.target.value }))} /></label>
          </div>
        </section>
      </div>
    </section>
  )
}

function MuralView({
  userRole,
  muralPosts,
  importantDeadlines,
  onApply,
  onOpenPublishModal,
}: {
  userRole: UserRole
  muralPosts: MuralPost[]
  importantDeadlines: Deadline[]
  onApply: (title: string) => void
  onOpenPublishModal: () => void
}) {
  return (
    <section className="page-section">
      <div className="page-heading">
        <div>
          <h2>Mural Academico</h2>
          <p>{userRole === 'admin' ? 'Acompanhe o que esta publicado e navegue ate a moderacao quando precisar revisar conteudos.' : 'Vagas, eventos e comunicados oficiais aprovados pela moderacao.'}</p>
        </div>
        <button className="secondary-button" type="button" onClick={onOpenPublishModal}>Postar no Mural</button>
      </div>
      <div className="content-grid">
        <div className="mural-list">
          {muralPosts.map((post) => (
            <article key={post.id} className="feature-card">
              <div className="card-header">
                <div className="card-title-row">
                  <div className="card-icon">{post.category === 'Evento' ? <CalendarIcon /> : <BriefcaseIcon />}</div>
                  <div><h3>{post.title}</h3><p className="card-subtitle">{post.subtitle}</p></div>
                </div>
                <span className="card-tag">{post.tag}</span>
              </div>
              <p className="card-description">{post.description}</p>
              {post.meta ? <div className="card-meta" aria-label="Informacoes adicionais"><span><ClockIcon />{post.meta[0]}</span><span>{post.meta[1]}</span></div> : null}
              <div className="card-meta" aria-label="Informacoes do autor"><span>Autor: {post.author}</span><span>Status: {post.status}</span></div>
              {post.button ? <button className="primary-button" type="button" onClick={() => onApply(post.title)}>{post.button}</button> : null}
            </article>
          ))}
          {muralPosts.length === 0 ? <article className="feature-card"><h3>Nenhuma publicacao aprovada ainda</h3><p className="card-description">Assim que a moderacao aprovar novos posts, eles aparecerao aqui.</p></article> : null}
        </div>
        <aside className="side-panel">
          <div className="study-card">
            <div className="study-heading"><div className="study-title"><CalendarIcon /><h3>Prazos Importantes</h3></div></div>
            <div className="study-list">
              {importantDeadlines.map((item) => (
                <div key={item.title} className="study-item">
                  <div><h4>{item.title}</h4><p>{item.detail}</p></div>
                  <button type="button">Ver</button>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}

function ModerationView({
  moderationQueue,
  reports,
  dashboard,
  onRefresh,
  onModerate,
}: {
  moderationQueue: ModerationPost[]
  reports: Report[]
  dashboard: DashboardStats
  onRefresh: () => void
  onModerate: (status: Extract<PostStatus, 'Aprovado' | 'Revisao'>, item: ModerationPost) => void
}) {
  const approvedCount = moderationQueue.filter((item) => item.status === 'Aprovado').length

  return (
    <section className="page-section moderation-section">
      <div className="page-heading">
        <div><h2>Central de Moderacao</h2><p>Revise publicacoes, acompanhe denuncias e aprove o que vai para o mural.</p></div>
        <button className="secondary-button" type="button" onClick={() => void showFeatureAlert('Exportacao de relatorio', 'A fila de moderacao e as denuncias ja estao no banco. Se quiser, o proximo passo pode ser gerar CSV ou PDF.')}>Exportar relatorio</button>
      </div>
      <div className="moderation-overview">
        <article className="overview-card"><span>Em analise</span><strong>{dashboard.pendingModerationCount}</strong><p>Publicacoes aguardando revisao manual.</p></article>
        <article className="overview-card"><span>Denuncias</span><strong>{dashboard.reportsCount}</strong><p>Ocorrencias abertas que precisam de resposta.</p></article>
        <article className="overview-card"><span>Aprovadas</span><strong>{approvedCount}</strong><p>Itens liberados e visiveis no mural.</p></article>
      </div>
      <div className="moderation-grid">
        <section className="moderation-card moderation-table-card">
          <div className="moderation-card-header"><div><h3>Fila de aprovacao</h3><p>Itens recebidos pelo mural academico.</p></div><button className="ghost-button" type="button" onClick={onRefresh}>Atualizar</button></div>
          <div className="moderation-table">
            <div className="moderation-table-head"><span>Titulo</span><span>Categoria</span><span>Autor</span><span>Status</span><span>Acoes</span></div>
            {moderationQueue.map((item) => (
              <div key={item.id} className="moderation-row">
                <div><strong>{item.title}</strong><small>{item.submittedAt}</small></div>
                <span>{item.category}</span>
                <span>{item.author}</span>
                <span className={`status-pill status-${slugify(item.status)}`}>{item.status}</span>
                <div className="row-actions"><button type="button" onClick={() => onModerate('Aprovado', item)}>Aprovar</button><button type="button" onClick={() => onModerate('Revisao', item)}>Revisar</button></div>
              </div>
            ))}
          </div>
        </section>
        <aside className="moderation-side">
          <section className="moderation-card">
            <div className="moderation-card-header"><div><h3>Alertas</h3><p>Ocorrencias recentes sinalizadas no sistema.</p></div></div>
            <div className="report-list">
              {reports.map((report) => (
                <article key={report.id} className="report-item"><strong>{report.title}</strong><p>{report.detail}</p><p>{report.status} · {report.createdAt}</p></article>
              ))}
            </div>
          </section>
          <section className="moderation-card">
            <div className="moderation-card-header"><div><h3>Checklist rapido</h3><p>Passos recomendados antes de publicar.</p></div></div>
            <ul className="checklist">
              <li>Validar se o autor esta vinculado a UTP.</li>
              <li>Revisar ortografia e links anexados.</li>
              <li>Confirmar categoria correta da postagem.</li>
              <li>Registrar decisao em historico interno.</li>
            </ul>
          </section>
        </aside>
      </div>
    </section>
  )
}

function DatabaseView({
  snapshot,
  isLoading,
  onLoad,
}: {
  snapshot: AdminDatabaseSnapshot | null
  isLoading: boolean
  onLoad: () => void
}) {
  const tableEntries = snapshot ? Object.entries(snapshot.tables) : []
  const rideRows = snapshot?.tables.caronas ?? []

  return (
    <section className="page-section database-section">
      <div className="page-heading">
        <div>
          <h2>Visualizacao de Tabelas</h2>
          <p>Ambiente de teste para o administrador inspecionar os registros atuais do banco.</p>
        </div>
        <button className="secondary-button" type="button" onClick={onLoad} disabled={isLoading}>
          {isLoading ? 'Carregando...' : 'Atualizar tabelas'}
        </button>
      </div>

      {!snapshot ? (
        <article className="moderation-card database-empty-card">
          <h3>Carregar dados do banco</h3>
          <p>Clique em "Atualizar tabelas" para buscar os registros reais das tabelas do PostgreSQL.</p>
        </article>
      ) : (
        <>
          <div className="database-overview">
            {Object.entries(snapshot.totals).map(([tableName, total]) => (
              <article key={tableName} className="overview-card">
                <span>{tableName.replace('_', ' ')}</span>
                <strong>{total}</strong>
                <p>Registros encontrados na tabela {tableName}.</p>
              </article>
            ))}
          </div>

          <section className="moderation-card database-focus-card">
            <div className="moderation-card-header">
              <div>
                <h3>Moderacao de Caronas</h3>
                <p>Visualizacao rapida dos registros da tabela `caronas` para testes e validacoes.</p>
              </div>
            </div>
            <div className="database-table">
              <div className="database-table-head">
                <span>ID</span>
                <span>Zona</span>
                <span>Titulo</span>
                <span>Horario</span>
                <span>Vagas</span>
                <span>Status</span>
              </div>
              {rideRows.map((ride) => (
                <div key={String(ride.id_carona)} className="database-table-row">
                  <span>{String(ride.id_carona)}</span>
                  <span>{String(ride.zona_destino)}</span>
                  <span>{String(ride.titulo)}</span>
                  <span>{String(ride.horario_saida)}</span>
                  <span>{String(ride.vagas)}</span>
                  <span>{String(ride.status_carona)}</span>
                </div>
              ))}
            </div>
          </section>

          <div className="database-grid">
            {tableEntries.map(([tableName, rows]) => (
              <section key={tableName} className="moderation-card database-card">
                <div className="moderation-card-header">
                  <div>
                    <h3>{tableName}</h3>
                    <p>{rows.length} registros carregados para teste.</p>
                  </div>
                </div>
                <div className="database-json-preview">
                  <pre>{JSON.stringify(rows, null, 2)}</pre>
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </section>
  )
}

function getPageTitle(view: PageView) {
  if (view === 'home') return 'Inicio'
  if (view === 'rides') return 'Caronas'
  if (view === 'lostFound') return 'Achados e Perdidos'
  if (view === 'career') return 'Perfil Profissional'
  if (view === 'moderation') return 'Moderacao'
  if (view === 'database') return 'Banco'
  return 'Mural'
}

function slugify(status: PostStatus) {
  if (status === 'Aprovado') return 'approved'
  if (status === 'Revisao') return 'review'
  return 'pending'
}

function GridIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>
}

function CarIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 16l1.2-4.2A2 2 0 0 1 8.1 10h7.8a2 2 0 0 1 1.9 1.4L19 16" /><path d="M4 16h16v2a1 1 0 0 1-1 1h-1a2 2 0 1 1-4 0H10a2 2 0 1 1-4 0H5a1 1 0 0 1-1-1v-2Z" /><circle cx="7.5" cy="18" r="1.5" fill="currentColor" stroke="none" /><circle cx="16.5" cy="18" r="1.5" fill="currentColor" stroke="none" /></svg>
}

function SearchIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
}

function BriefcaseIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" /><path d="M3 12h18" /></svg>
}

function ShieldIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3 5 6v6c0 4.5 2.9 7.8 7 9 4.1-1.2 7-4.5 7-9V6l-7-3Z" /><path d="m9.5 12 1.7 1.7L14.8 10" /></svg>
}

function MenuIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
}

function BellIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 18h6" /><path d="M6 17h12l-1.4-1.6a2 2 0 0 1-.5-1.3V11a4 4 0 1 0-8 0v3.1c0 .5-.2 1-.5 1.3L6 17Z" /><path d="M10 18a2 2 0 0 0 4 0" /></svg>
}

function CalendarIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16" /></svg>
}

function ClockIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></svg>
}

function InfoIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 10v6M12 7h.01" /></svg>
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 4a8 8 0 0 0-6.9 12l-1.1 4 4.1-1A8 8 0 1 0 12 4Z" />
      <path d="M9.3 8.9c.2-.4.4-.4.7-.4h.6c.2 0 .4 0 .5.4l.5 1.5c.1.3 0 .5-.1.7l-.4.5c-.1.1-.2.3-.1.5.3.7 1 1.8 2.2 2.4.2.1.4.1.5 0l.6-.7c.2-.2.4-.2.6-.1l1.4.7c.2.1.4.2.4.5v.5c0 .3-.2.5-.4.7-.4.3-1 .5-1.7.3-1-.2-2.4-.8-3.7-2.2-1.6-1.5-2.3-3.1-2.5-4.2-.1-.7.1-1.3.4-1.6Z" />
    </svg>
  )
}

function UserCardIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M8.5 11a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" /><path d="M6 17a4 4 0 0 1 5 0" /><path d="M14 8h4M14 12h4M14 16h3" /></svg>
}

function UserCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M7 18a5.5 5.5 0 0 1 10 0" />
    </svg>
  )
}

export default App
