import type { ComponentType, ReactNode, RefObject } from 'react'
import {
  BellIcon,
  MenuIcon,
  UserCircleIcon,
} from '../icons'
import type { AppUser, PageView } from '../../types/app'
import { getPageTitle } from '../../lib/navigation'

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
  profileMenuRef: RefObject<HTMLDivElement | null>
  menuItems: MenuItem[]
  children: ReactNode
  onToggleSidebar: () => void
  onChangeView: (view: PageView) => void
  onRefresh: () => void
  onToggleProfileMenu: () => void
  onLogout: () => void
}

export function AuthenticatedLayout({
  sessionUser,
  currentView,
  isSidebarOpen,
  isProfileMenuOpen,
  profileMenuRef,
  menuItems,
  children,
  onToggleSidebar,
  onChangeView,
  onRefresh,
  onToggleProfileMenu,
  onLogout,
}: AuthenticatedLayoutProps) {
  return (
    <div className={`app-shell${isSidebarOpen ? '' : ' sidebar-collapsed'}`}>
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="brand-name">{sessionUser.role === 'admin' ? 'Painel UTP' : 'Portal Tuiuti'}</span>
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
            <h1>{getPageTitle(currentView)}</h1>
          </div>
          <div className="topbar-actions">
            <button className="icon-button notification-button" type="button" aria-label="Notificacoes" onClick={onRefresh}>
              <BellIcon />
              <span className="notification-dot" aria-hidden="true" />
            </button>
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
