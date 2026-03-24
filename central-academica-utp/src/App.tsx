import { useState } from 'react'
import type { FormEvent } from 'react'
import Swal from 'sweetalert2'
import './App.css'

type UserRole = 'student' | 'admin'
type PageView = 'home' | 'rides' | 'lostFound' | 'mural' | 'moderation'
type LoginMode = 'student' | 'admin'
type PostStatus = 'Pendente' | 'Aprovado' | 'Revisao'
type RideZone = 'Centro' | 'Boqueirao' | 'Pinheirinho' | 'CIC'

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
  zone: RideZone
  title: string
  driver: string
  time: string
  seats: string
  meeting: string
  vehicle: string
}

type RideHotspot = {
  id: RideZone
  name: RideZone
  detail: string
  top: string
  left: string
}

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

const studentCredentials = { ra: '2024193227', birthDate: '2004-05-18' }
const adminCredentials = { login: 'admin.utp', password: 'moderacao123' }

const muralCards = [
  {
    icon: BriefcaseIcon,
    title: 'Estagio em Desenvolvimento Web',
    subtitle: 'TechSolutions Curitiba - Hibrido',
    tag: 'Vaga de Estagio',
    description:
      'Estamos buscando estagiarios apaixonados por React e Node.js. Otima oportunidade de aprendizado e efetivacao. Requisitos: conhecimento basico em HTML, CSS e JS.',
    meta: ['6h diarias', 'R$ 1.500,00 + VT + VR'],
    button: 'Candidatar-se',
  },
  {
    icon: CalendarIcon,
    title: 'Semana Academica de Tecnologia',
    subtitle: 'Auditorio Principal - 15/04/2026',
    tag: 'Evento',
    description:
      'Venha participar de palestras com profissionais do mercado, workshops praticos e muito networking. Certificado de 20 horas complementares.',
  },
]

const studyGroups = [
  { title: 'Calculo I', schedule: 'Sabados, 14h' },
  { title: 'Algoritmos', schedule: 'Tercas, 18h' },
]

const rides: RideOffer[] = [
  { id: 1, zone: 'Boqueirao', title: 'Boqueirao -> Campus UTP', driver: 'Ana Paula', time: 'Saida 18:10', seats: '2 vagas', meeting: 'Terminal do Boqueirao', vehicle: 'Onix prata' },
  { id: 2, zone: 'Pinheirinho', title: 'Pinheirinho -> Campus UTP', driver: 'Lucas Henrique', time: 'Saida 18:25', seats: '3 vagas', meeting: 'Rua Winston Churchill', vehicle: 'HB20 branco' },
  { id: 3, zone: 'Centro', title: 'Centro -> Campus UTP', driver: 'Mariana Costa', time: 'Saida 19:00', seats: '1 vaga', meeting: 'Praca Rui Barbosa', vehicle: 'Sandero vermelho' },
  { id: 4, zone: 'CIC', title: 'CIC -> Campus UTP', driver: 'Fernando Lima', time: 'Saida 18:40', seats: '2 vagas', meeting: 'Terminal CIC', vehicle: 'Argo cinza' },
]

const rideHotspots: RideHotspot[] = [
  { id: 'Centro', name: 'Centro', detail: '3 caronas ativas', top: '34%', left: '46%' },
  { id: 'Boqueirao', name: 'Boqueirao', detail: '2 caronas ativas', top: '60%', left: '64%' },
  { id: 'Pinheirinho', name: 'Pinheirinho', detail: '4 caronas ativas', top: '73%', left: '42%' },
  { id: 'CIC', name: 'CIC', detail: '1 carona ativa', top: '49%', left: '21%' },
]

const lostItems: LostItem[] = [
  { id: 1, title: 'Mochila preta com caderno azul', place: 'Bloco C - Laboratorio 2', date: 'Hoje, 11:40', status: 'Encontrado na recepcao', category: 'Mochilas', description: 'Mochila preta de tecido com um caderno universitario azul e estojo pequeno no bolso frontal.', foundBy: 'Recepcao do bloco C', contact: 'apoio.academico@utp.br' },
  { id: 2, title: 'Carteirinha de estudante', place: 'Patio principal', date: 'Hoje, 09:20', status: 'Aguardando retirada', category: 'Documentos', description: 'Carteirinha em nome de Beatriz Souza, encontrada proxima aos bancos centrais do patio.', foundBy: 'Equipe de apoio ao aluno', contact: 'secretaria@utp.br' },
  { id: 3, title: 'Estojo com lapiseira e canetas', place: 'Sala 104', date: 'Ontem, 20:15', status: 'Entregue ao apoio academico', category: 'Acessorios', description: 'Estojo azul-marinho contendo lapiseira preta, duas canetas azuis e um marca-texto amarelo.', foundBy: 'Prof. Henrique Ramos', contact: 'atendimento.campus@utp.br' },
]

const moderationQueue: ModerationPost[] = [
  { id: 1, title: 'Monitoria de Banco de Dados', category: 'Vaga', author: 'Coordenacao de ADS', status: 'Pendente', submittedAt: 'Hoje, 09:10' },
  { id: 2, title: 'Feira de Estagios 2026', category: 'Evento', author: 'Central Academica', status: 'Revisao', submittedAt: 'Hoje, 10:45' },
  { id: 3, title: 'Grupo de estudos de IA aplicada', category: 'Grupo', author: 'Prof. Marina Lopes', status: 'Aprovado', submittedAt: 'Ontem, 18:20' },
]

const reports = [
  { title: 'Denuncia por conteudo duplicado', detail: 'Publicacao "Semana Academica de Tecnologia" reportada 2 vezes.' },
  { title: 'Comentario aguardando revisao', detail: 'Mensagem sinalizada automaticamente por linguagem inadequada.' },
]

const toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 2400,
  timerProgressBar: true,
})

function showFeatureAlert(title: string, text: string) {
  return Swal.fire({
    icon: 'info',
    title,
    text,
    confirmButtonText: 'Entendi',
  })
}

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loginMode, setLoginMode] = useState<LoginMode>('student')
  const [userRole, setUserRole] = useState<UserRole>('student')
  const [currentView, setCurrentView] = useState<PageView>('mural')
  const [ra, setRa] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [adminLogin, setAdminLogin] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const menuItems = [
    { label: 'Inicio', icon: GridIcon, view: 'home' as PageView, visible: userRole === 'student' },
    { label: 'Caronas', icon: CarIcon, view: 'rides' as PageView, visible: userRole === 'student' },
    { label: 'Achados e Perdidos', icon: SearchIcon, view: 'lostFound' as PageView, visible: userRole === 'student' },
    { label: 'Mural', icon: BriefcaseIcon, view: 'mural' as PageView, visible: true },
    { label: 'Moderacao', icon: ShieldIcon, view: 'moderation' as PageView, visible: userRole === 'admin' },
  ].filter((item) => item.visible)

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (loginMode === 'student') {
      const normalizedRa = ra.replace(/\D/g, '')
      if (normalizedRa.length !== 10) {
        setErrorMessage('O RA deve conter 10 digitos.')
        await Swal.fire({
          icon: 'warning',
          title: 'RA incompleto',
          text: 'Informe os 10 digitos do RA para continuar.',
          confirmButtonText: 'Corrigir',
        })
        return
      }

      if (!birthDate) {
        setErrorMessage('Informe a data de nascimento para continuar.')
        await Swal.fire({
          icon: 'warning',
          title: 'Data obrigatoria',
          text: 'Preencha sua data de nascimento antes de entrar.',
          confirmButtonText: 'Preencher',
        })
        return
      }

      if (normalizedRa !== studentCredentials.ra || birthDate !== studentCredentials.birthDate) {
        setErrorMessage('RA ou data de nascimento invalidos.')
        await Swal.fire({
          icon: 'error',
          title: 'Acesso negado',
          text: 'RA ou data de nascimento invalidos.',
          confirmButtonText: 'Tentar novamente',
        })
        return
      }
      setUserRole('student')
      setCurrentView('home')
    } else {
      if (!adminLogin.trim() || !adminPassword.trim()) {
        setErrorMessage('Preencha login e senha do administrador.')
        await Swal.fire({
          icon: 'warning',
          title: 'Campos obrigatorios',
          text: 'Preencha login e senha do administrador.',
          confirmButtonText: 'Preencher',
        })
        return
      }

      if (adminLogin !== adminCredentials.login || adminPassword !== adminCredentials.password) {
        setErrorMessage('Login de administrador invalido.')
        await Swal.fire({
          icon: 'error',
          title: 'Credenciais invalidas',
          text: 'Login de administrador invalido.',
          confirmButtonText: 'Tentar novamente',
        })
        return
      }
      setUserRole('admin')
      setCurrentView('moderation')
    }
    setErrorMessage('')
    setIsAuthenticated(true)
    await toast.fire({
      icon: 'success',
      title: loginMode === 'student' ? 'Login realizado com sucesso.' : 'Moderacao liberada.',
    })
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

    if (!result.isConfirmed) {
      return
    }

    setIsAuthenticated(false)
    setIsSidebarOpen(true)
    setCurrentView('mural')
    setUserRole('student')
    setLoginMode('student')
    setRa('')
    setBirthDate('')
    setAdminLogin('')
    setAdminPassword('')
    setErrorMessage('')
    await toast.fire({
      icon: 'success',
      title: 'Sessao encerrada.',
    })
  }

  if (!isAuthenticated) {
    return (
      <div className="login-page">
        <div className="login-panel">
          <div className="login-hero">
            <span className="login-eyebrow">Central Academica UTP</span>
            <h1>{loginMode === 'student' ? 'Acesse com seu RA' : 'Acesso administrativo'}</h1>
            <p>
              {loginMode === 'student'
                ? 'Entre com o Registro do Aluno e sua data de nascimento para abrir o portal.'
                : 'Entre com as credenciais da equipe de moderacao para revisar publicacoes e denuncias.'}
            </p>
            <div className="login-demo-card">
              <span className="login-demo-label">{loginMode === 'student' ? 'Modelo de RA' : 'Acesso administrador'}</span>
              <strong>{loginMode === 'student' ? studentCredentials.ra : adminCredentials.login}</strong>
              <small>{loginMode === 'student' ? 'Use apenas numeros no campo de acesso.' : 'Senha de teste: moderacao123'}</small>
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
            <button className="login-submit" type="submit">{loginMode === 'student' ? 'Entrar no sistema' : 'Entrar na moderacao'}</button>
            <div className="login-help">
              <span>Credenciais de teste</span>
              {loginMode === 'student' ? <><p>RA: 2024193227</p><p>Data: 2004-05-18</p></> : <><p>Login: admin.utp</p><p>Senha: moderacao123</p></>}
            </div>
          </form>
        </div>
      </div>
    )
  }

  const pageTitle = getPageTitle(currentView)

  return (
    <div className={`app-shell${isSidebarOpen ? '' : ' sidebar-collapsed'}`}>
      <aside className="sidebar">
        <div className="sidebar-header"><span className="brand-name">{userRole === 'admin' ? 'Painel UTP' : 'Portal Tuiuti'}</span></div>
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
            <h1>{pageTitle}</h1>
          </div>
          <div className="topbar-actions">
            <button className="icon-button notification-button" type="button" aria-label="Notificacoes"><BellIcon /><span className="notification-dot" aria-hidden="true" /></button>
            <button className="session-button" type="button" onClick={() => void handleLogout()}>Sair</button>
          </div>
        </header>
        {currentView === 'home' ? <HomeView /> : null}
        {currentView === 'rides' ? <RidesView /> : null}
        {currentView === 'lostFound' ? <LostFoundView /> : null}
        {currentView === 'mural' ? <MuralView userRole={userRole} /> : null}
        {currentView === 'moderation' ? <ModerationView /> : null}
      </main>
    </div>
  )
}

function HomeView() {
  return (
    <section className="page-section home-section">
      <div className="page-heading">
        <div>
          <h2>Inicio</h2>
          <p>Acesse rapidamente os servicos mais usados da central academica.</p>
        </div>
      </div>
      <div className="home-grid">
        <article className="home-card">
          <h3>Caronas para hoje</h3>
          <strong>7 rotas ativas</strong>
          <p>Confira pontos de encontro em Curitiba e reserve sua vaga.</p>
        </article>
        <article className="home-card">
          <h3>Achados e perdidos</h3>
          <strong>12 itens registrados</strong>
          <p>Veja rapidamente o que foi encontrado no campus nas ultimas 48h.</p>
        </article>
        <article className="home-card">
          <h3>Mural academico</h3>
          <strong>5 novos avisos</strong>
          <p>Eventos, vagas e recados oficiais publicados pela comunidade.</p>
        </article>
      </div>
    </section>
  )
}

function RidesView() {
  const [selectedZone, setSelectedZone] = useState<RideZone>('Centro')
  const filteredRides = rides.filter((ride) => ride.zone === selectedZone)
  const selectedSpot = rideHotspots.find((spot) => spot.id === selectedZone)

  async function handleRideRequest(ride: RideOffer) {
    await Swal.fire({
      icon: 'success',
      title: 'Solicitacao enviada',
      html: `<strong>${ride.driver}</strong><br />${ride.title}<br />Ponto de encontro: ${ride.meeting}`,
      confirmButtonText: 'Fechar',
    })
  }

  return (
    <section className="page-section rides-section">
      <div className="page-heading">
        <div>
          <h2>Caronas</h2>
          <p>Selecione um ponto de Curitiba no mapa para ver as caronas daquele bairro.</p>
        </div>
        <button className="secondary-button" type="button" onClick={() => void showFeatureAlert('Cadastro de carona', 'Aqui podemos abrir um formulario conectado ao backend para publicar novas rotas.')}>Oferecer carona</button>
      </div>
      <div className="rides-hero">
        <div className="rides-summary-card">
          <span>Bairro selecionado</span>
          <strong>{selectedZone}</strong>
          <p>{selectedSpot?.detail}</p>
        </div>
        <div className="rides-summary-card">
          <span>Destino padrao</span>
          <strong>Campus UTP</strong>
          <p>Rotas focadas no periodo noturno com ponto de encontro definido.</p>
        </div>
        <div className="rides-summary-card">
          <span>Disponibilidade</span>
          <strong>{filteredRides.length} rotas</strong>
          <p>Atualizadas em tempo real conforme a comunidade publica novas caronas.</p>
        </div>
      </div>
      <div className="rides-grid">
        <div className="map-card map-card-enhanced">
          <div className="map-card-header">
            <div>
              <h3>Mapa de Curitiba</h3>
              <p>Use os pontos abaixo para filtrar as caronas e visualizar a regiao no mapa.</p>
            </div>
            <span className="map-legend">Regiao atual: {selectedZone}</span>
          </div>
          <div className="real-map-frame">
            <iframe
              title="Mapa de Curitiba"
              src="https://www.openstreetmap.org/export/embed.html?bbox=-49.42%2C-25.62%2C-49.17%2C-25.35&layer=mapnik&marker=-25.44%2C-49.27"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <div className="hotspot-list hotspot-list-enhanced">
            {rideHotspots.map((spot) => (
              <button
                key={spot.id}
                type="button"
                className={`hotspot-item${selectedZone === spot.id ? ' is-active' : ''}`}
                onClick={() => setSelectedZone(spot.id)}
              >
                <strong>{spot.name}</strong>
                <span>{spot.detail}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="rides-list-panel">
          <div className="rides-list-header">
            <h3>Rotas disponiveis</h3>
            <p>{selectedZone} para Campus UTP</p>
          </div>
          <div className="rides-list">
            {filteredRides.map((ride) => (
              <article key={ride.id} className="ride-card ride-card-enhanced">
                <div className="ride-card-header">
                  <div>
                    <h3>{ride.title}</h3>
                    <p>{ride.driver}</p>
                  </div>
                  <span className="ride-badge">{ride.seats}</span>
                </div>
                <div className="ride-meta-grid">
                  <div><span className="ride-meta-label">Saida</span><strong>{ride.time}</strong></div>
                  <div><span className="ride-meta-label">Encontro</span><strong>{ride.meeting}</strong></div>
                  <div><span className="ride-meta-label">Veiculo</span><strong>{ride.vehicle}</strong></div>
                </div>
                <button className="primary-button" type="button" onClick={() => void handleRideRequest(ride)}>Solicitar vaga</button>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function LostFoundView() {
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null)
  const [previewItemId, setPreviewItemId] = useState<number>(lostItems[0].id)
  const previewItem = lostItems.find((item) => item.id === previewItemId) ?? lostItems[0]
  const selectedItem = lostItems.find((item) => item.id === selectedItemId) ?? null

  async function handleRegisterItem() {
    await showFeatureAlert(
      'Registro de item',
      'Esse botao pode abrir um formulario para cadastrar itens encontrados assim que o backend estiver recebendo dados.',
    )
  }

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
        <div>
          <h2>Achados e Perdidos</h2>
          <p>Itens localizados no campus e registrados para retirada.</p>
        </div>
        <button className="secondary-button" type="button" onClick={() => void handleRegisterItem()}>Registrar item</button>
      </div>
      <div className="lost-found-toolbar">
        <span className="filter-chip is-active">Todos</span>
        <span className="filter-chip">Documentos</span>
        <span className="filter-chip">Eletronicos</span>
        <span className="filter-chip">Mochilas</span>
      </div>
      <div className="lost-found-layout">
        <div className="lost-found-grid">
          {lostItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`lost-card${previewItemId === item.id ? ' is-active' : ''}`}
              onClick={() => setPreviewItemId(item.id)}
            >
              <div className="lost-card-icon"><SearchIcon /></div>
              <div className="lost-card-body">
                <h3>{item.title}</h3>
                <p>{item.place}</p>
                <div className="lost-card-meta">
                  <span>{item.date}</span>
                  <span>{item.status}</span>
                </div>
              </div>
              <span
                className="lost-card-action"
                onClick={(event) => {
                  event.stopPropagation()
                  setPreviewItemId(item.id)
                  setSelectedItemId(item.id)
                }}
              >
                Ver detalhes
              </span>
            </button>
          ))}
        </div>
        <aside className="lost-details-card">
          <div className="lost-details-header">
            <span className="detail-tag">{previewItem.category}</span>
            <h3>{previewItem.title}</h3>
            <p>{previewItem.description}</p>
          </div>
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

      {selectedItem ? (
        <div className="details-modal-backdrop" onClick={() => setSelectedItemId(null)}>
          <div className="details-modal" onClick={(event) => event.stopPropagation()}>
            <div className="details-modal-header">
              <div>
                <span className="detail-tag">{selectedItem.category}</span>
                <h3>{selectedItem.title}</h3>
              </div>
              <button className="ghost-button" type="button" onClick={() => setSelectedItemId(null)}>
                Fechar
              </button>
            </div>

            <p className="details-modal-description">{selectedItem.description}</p>

            <div className="lost-details-grid">
              <div><span className="detail-label">Local encontrado</span><strong>{selectedItem.place}</strong></div>
              <div><span className="detail-label">Data do registro</span><strong>{selectedItem.date}</strong></div>
              <div><span className="detail-label">Status atual</span><strong>{selectedItem.status}</strong></div>
              <div><span className="detail-label">Registrado por</span><strong>{selectedItem.foundBy}</strong></div>
            </div>

            <div className="details-modal-footer">
              <div>
                <span className="detail-label">Contato</span>
                <strong>{selectedItem.contact}</strong>
              </div>
              <button className="primary-button" type="button" onClick={() => void handleReturnRequest(selectedItem)}>Solicitar devolucao</button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

function MuralView({ userRole }: { userRole: UserRole }) {
  async function handleCreatePost() {
    await Swal.fire({
      icon: 'info',
      title: 'Nova publicacao',
      text: 'O proximo passo aqui e abrir um modal com formulario para enviar posts ao backend.',
      confirmButtonText: 'Perfeito',
    })
  }

  async function handleApply(cardTitle: string) {
    await toast.fire({
      icon: 'success',
      title: `Interesse registrado em "${cardTitle}".`,
    })
  }

  return (
    <section className="page-section">
      <div className="page-heading">
        <div>
          <h2>Mural Academico</h2>
          <p>
            {userRole === 'admin'
              ? 'Acompanhe o que esta publicado e navegue ate a moderacao quando precisar revisar conteudos.'
              : 'Vagas, eventos e comunicados oficiais.'}
          </p>
        </div>
        <button className="secondary-button" type="button" onClick={() => void handleCreatePost()}>Postar no Mural</button>
      </div>
      <div className="content-grid">
        <div className="mural-list">
          {muralCards.map((card) => {
            const Icon = card.icon
            return (
              <article key={card.title} className="feature-card">
                <div className="card-header">
                  <div className="card-title-row">
                    <div className="card-icon"><Icon /></div>
                    <div>
                      <h3>{card.title}</h3>
                      <p className="card-subtitle">{card.subtitle}</p>
                    </div>
                  </div>
                  <span className="card-tag">{card.tag}</span>
                </div>
                <p className="card-description">{card.description}</p>
                {card.meta ? (
                  <div className="card-meta" aria-label="Informacoes adicionais">
                    <span><ClockIcon />{card.meta[0]}</span>
                    <span>{card.meta[1]}</span>
                  </div>
                ) : null}
                {card.button ? <button className="primary-button" type="button" onClick={() => void handleApply(card.title)}>{card.button}</button> : null}
              </article>
            )
          })}
        </div>
        <aside className="side-panel">
          <div className="study-card">
            <div className="study-heading">
              <div className="study-title"><UsersIcon /><h3>Grupos de Estudo</h3></div>
            </div>
            <div className="study-list">
              {studyGroups.map((group) => (
                <div key={group.title} className="study-item">
                  <div><h4>{group.title}</h4><p>{group.schedule}</p></div>
                  <button type="button">Entrar</button>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}

function ModerationView() {
  async function handleModerationAction(action: 'Aprovar' | 'Revisar', item: ModerationPost) {
    await Swal.fire({
      icon: action === 'Aprovar' ? 'success' : 'info',
      title: `${action} publicacao`,
      html: `<strong>${item.title}</strong><br />Autor: ${item.author}<br />Categoria: ${item.category}`,
      confirmButtonText: 'Fechar',
    })
  }

  return (
    <section className="page-section moderation-section">
      <div className="page-heading">
        <div>
          <h2>Central de Moderacao</h2>
          <p>Revise publicacoes, acompanhe denuncias e aprove o que vai para o mural.</p>
        </div>
        <button className="secondary-button" type="button" onClick={() => void showFeatureAlert('Exportacao de relatorio', 'Quando o backend estiver completo, este botao pode gerar um CSV ou PDF com o historico da moderacao.')}>Exportar relatorio</button>
      </div>
      <div className="moderation-overview">
        <article className="overview-card"><span>Em analise</span><strong>12</strong><p>Publicacoes aguardando revisao manual.</p></article>
        <article className="overview-card"><span>Denuncias</span><strong>04</strong><p>Ocorrencias que precisam de resposta hoje.</p></article>
        <article className="overview-card"><span>Aprovadas</span><strong>28</strong><p>Itens liberados nas ultimas 24 horas.</p></article>
      </div>
      <div className="moderation-grid">
        <section className="moderation-card moderation-table-card">
          <div className="moderation-card-header">
            <div><h3>Fila de aprovacao</h3><p>Itens recebidos pelo mural academico.</p></div>
            <button className="ghost-button" type="button" onClick={() => void toast.fire({ icon: 'success', title: 'Fila de moderacao atualizada.' })}>Atualizar</button>
          </div>
          <div className="moderation-table">
            <div className="moderation-table-head">
              <span>Titulo</span><span>Categoria</span><span>Autor</span><span>Status</span><span>Acoes</span>
            </div>
            {moderationQueue.map((item) => (
              <div key={item.id} className="moderation-row">
                <div><strong>{item.title}</strong><small>{item.submittedAt}</small></div>
                <span>{item.category}</span>
                <span>{item.author}</span>
                <span className={`status-pill status-${slugify(item.status)}`}>{item.status}</span>
                <div className="row-actions"><button type="button" onClick={() => void handleModerationAction('Aprovar', item)}>Aprovar</button><button type="button" onClick={() => void handleModerationAction('Revisar', item)}>Revisar</button></div>
              </div>
            ))}
          </div>
        </section>
        <aside className="moderation-side">
          <section className="moderation-card">
            <div className="moderation-card-header"><div><h3>Alertas</h3><p>Ocorrencias recentes sinalizadas no sistema.</p></div></div>
            <div className="report-list">
              {reports.map((report) => (
                <article key={report.title} className="report-item"><strong>{report.title}</strong><p>{report.detail}</p></article>
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

function getPageTitle(view: PageView) {
  if (view === 'home') return 'Inicio'
  if (view === 'rides') return 'Caronas'
  if (view === 'lostFound') return 'Achados e Perdidos'
  if (view === 'moderation') return 'Moderacao'
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

function UsersIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" /><path d="M17 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" /><path d="M4 18a5 5 0 0 1 10 0" /><path d="M14 18a4 4 0 0 1 6 0" /></svg>
}

export default App
