import type { ComponentType, ReactNode, RefObject } from 'react'
import {
  AccessibilityIcon,
  BellIcon,
  MenuIcon,
  UserCircleIcon,
} from '../icons'
import type { AppUser, PageView } from '../../types/app'

type AccessibilitySettings = {
  largeFont: boolean
  highContrast: boolean
  wordSpacing: boolean
}

type MenuItem = {
  label: string
  icon: ComponentType
  view: PageView
}

type AuthenticatedLayoutProps = {
  sessionUser: AppUser
  currentView: PageView
  isSidebarOpen: boolean
  isProfileMenuOpen: boolean
  isAccessibilityMenuOpen: boolean
  isNotificationsOpen: boolean
  profileMenuRef: RefObject<HTMLDivElement | null>
  accessibilityMenuRef: RefObject<HTMLDivElement | null>
  notificationsMenuRef: RefObject<HTMLDivElement | null>
  accessibilitySettings: AccessibilitySettings
  notifications: Array<{ id: string; title: string; detail: string; tone: 'info' | 'warning' | 'success' }>
  menuItems: MenuItem[]
  children: ReactNode
  onToggleSidebar: () => void
  onChangeView: (view: PageView) => void
  onRefresh: () => void
  onToggleProfileMenu: () => void
  onToggleAccessibilityMenu: () => void
  onToggleNotifications: () => void
  onToggleAccessibilitySetting: (setting: keyof AccessibilitySettings) => void
  onLogout: () => void
}

export function AuthenticatedLayout({
  sessionUser,
  currentView,
  isSidebarOpen,
  isProfileMenuOpen,
  isAccessibilityMenuOpen,
  isNotificationsOpen,
  profileMenuRef,
  accessibilityMenuRef,
  notificationsMenuRef,
  accessibilitySettings,
  notifications,
  menuItems,
  children,
  onToggleSidebar,
  onChangeView,
  onRefresh,
  onToggleProfileMenu,
  onToggleAccessibilityMenu,
  onToggleNotifications,
  onToggleAccessibilitySetting,
  onLogout,
}: AuthenticatedLayoutProps) {
  const shellClasses = [
    'app-shell',
    isSidebarOpen ? '' : 'sidebar-collapsed',
    accessibilitySettings.largeFont ? 'accessibility-large-font' : '',
    accessibilitySettings.highContrast ? 'accessibility-high-contrast' : '',
    accessibilitySettings.wordSpacing ? 'accessibility-word-spacing' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={shellClasses}>
      <aside className="sidebar">
        <div className="sidebar-header">
          <img className="brand-logo" src="/utp-logo-transparent.png" alt="Universidade Tuiuti do Parana" />
        </div>
        <nav className="sidebar-nav" aria-label="Menu lateral">
          {menuItems.map(({ label, icon: Icon, view }) => (
            <button
              key={label}
              className={`sidebar-link${currentView === view ? ' is-active' : ''}`}
              type="button"
              title={label}
              onClick={() => onChangeView(view)}
            >
              <Icon />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <div className="topbar-title">
            <button
              className="icon-button menu-toggle"
              type="button"
              aria-label={isSidebarOpen ? 'Recolher menu lateral' : 'Expandir menu lateral'}
              aria-expanded={isSidebarOpen}
              onClick={onToggleSidebar}
            >
              <MenuIcon />
            </button>
            <img className="topbar-logo" src="/utp-logo-transparent.png" alt="Universidade Tuiuti do Parana" />
          </div>
          <div className="topbar-actions">
            <div className="accessibility-menu" ref={accessibilityMenuRef}>
              <button
                className="icon-button accessibility-toggle"
                type="button"
                aria-label="Abrir opcoes de acessibilidade"
                aria-expanded={isAccessibilityMenuOpen}
                onClick={onToggleAccessibilityMenu}
              >
                <AccessibilityIcon />
              </button>
              {isAccessibilityMenuOpen ? (
                <div className="accessibility-dropdown">
                  <div className="accessibility-dropdown-header">
                    <strong>Acessibilidade</strong>
                    <span>Ajustes visuais</span>
                  </div>
                  <button
                    className={`accessibility-option${accessibilitySettings.largeFont ? ' is-active' : ''}`}
                    type="button"
                    aria-pressed={accessibilitySettings.largeFont}
                    onClick={() => onToggleAccessibilitySetting('largeFont')}
                  >
                    <span>Texto maior</span>
                    <strong>{accessibilitySettings.largeFont ? 'Ativo' : 'Inativo'}</strong>
                  </button>
                  <button
                    className={`accessibility-option${accessibilitySettings.highContrast ? ' is-active' : ''}`}
                    type="button"
                    aria-pressed={accessibilitySettings.highContrast}
                    onClick={() => onToggleAccessibilitySetting('highContrast')}
                  >
                    <span>Alto contraste</span>
                    <strong>{accessibilitySettings.highContrast ? 'Ativo' : 'Inativo'}</strong>
                  </button>
                  <button
                    className={`accessibility-option${accessibilitySettings.wordSpacing ? ' is-active' : ''}`}
                    type="button"
                    aria-pressed={accessibilitySettings.wordSpacing}
                    onClick={() => onToggleAccessibilitySetting('wordSpacing')}
                  >
                    <span>Espacamento maior</span>
                    <strong>{accessibilitySettings.wordSpacing ? 'Ativo' : 'Inativo'}</strong>
                  </button>
                </div>
              ) : null}
            </div>
            <div className="notifications-menu" ref={notificationsMenuRef}>
              <button
                className="icon-button notification-button"
                type="button"
                aria-label="Abrir notificacoes"
                aria-expanded={isNotificationsOpen}
                onClick={onToggleNotifications}
              >
                <BellIcon />
                {notifications.length > 0 ? <span className="notification-dot" aria-hidden="true" /> : null}
              </button>
              {isNotificationsOpen ? (
                <div className="notifications-dropdown">
                  <div className="notifications-dropdown-header">
                    <div>
                      <strong>Notificacoes</strong>
                      <span>{notifications.length} atualizacao(es)</span>
                    </div>
                    <button type="button" onClick={onRefresh}>Atualizar</button>
                  </div>
                  <div className="notifications-list">
                    {notifications.length > 0 ? notifications.map((notification) => (
                      <article key={notification.id} className={`notification-item notification-${notification.tone}`}>
                        <strong>{notification.title}</strong>
                        <p>{notification.detail}</p>
                      </article>
                    )) : (
                      <article className="notification-item notification-info">
                        <strong>Tudo em dia</strong>
                        <p>Nenhuma pendencia importante encontrada agora.</p>
                      </article>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
            <div className="profile-menu" ref={profileMenuRef}>
              <button
                className="profile-button"
                type="button"
                aria-label="Abrir menu do usuario"
                aria-expanded={isProfileMenuOpen}
                onClick={onToggleProfileMenu}
              >
                <span className="profile-button-name">{sessionUser.name}</span>
                <span className="profile-avatar">
                  <UserCircleIcon />
                </span>
              </button>
              {isProfileMenuOpen ? (
                <div className="profile-dropdown">
                  <div className="profile-dropdown-header">
                    <strong>{sessionUser.name}</strong>
                    <span>{sessionUser.role === 'admin' ? 'Administrador' : 'Aluno'}</span>
                  </div>
                  <button className="profile-dropdown-action" type="button" onClick={onLogout}>
                    Sair
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>
        {children}
      </main>
    </div>
  )
}
