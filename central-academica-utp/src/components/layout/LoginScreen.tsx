import type { FormEvent } from 'react'
import type { LoginMode } from '../../types/app'

type LoginScreenProps = {
  loginMode: LoginMode
  isLoading: boolean
  ra: string
  birthDate: string
  adminLogin: string
  adminPassword: string
  errorMessage: string
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onChangeLoginMode: (mode: LoginMode) => void
  onRaChange: (value: string) => void
  onBirthDateChange: (value: string) => void
  onAdminLoginChange: (value: string) => void
  onAdminPasswordChange: (value: string) => void
}

export function LoginScreen({
  loginMode,
  isLoading,
  ra,
  birthDate,
  adminLogin,
  adminPassword,
  errorMessage,
  onSubmit,
  onChangeLoginMode,
  onRaChange,
  onBirthDateChange,
  onAdminLoginChange,
  onAdminPasswordChange,
}: LoginScreenProps) {
  return (
    <div className="login-page">
      <div className="login-panel">
        <div className="login-hero">
          <img className="login-logo" src="/utp-logo-transparent.png" alt="Universidade Tuiuti do Parana" />
          <span className="login-eyebrow">Central Academica UTP</span>
          <h1>{loginMode === 'student' ? 'Acesse com seu RA' : 'Acesso administrativo'}</h1>
          <p>
            {loginMode === 'student'
              ? 'Entre com o Registro do Aluno e sua data de nascimento para abrir o portal conectado ao Neon.'
              : 'Entre com as credenciais da moderacao para revisar publicacoes e denuncias em tempo real.'}
          </p>
        </div>
        <form className="login-card" onSubmit={onSubmit}>
          <div className="login-card-header">
            <h2>{loginMode === 'student' ? 'Login do aluno' : 'Login do administrador'}</h2>
            <p>Preencha os dados para entrar no sistema.</p>
          </div>
          <div className="login-mode-switch" role="tablist" aria-label="Tipo de acesso">
            <button
              className={`login-mode-button${loginMode === 'student' ? ' is-active' : ''}`}
              type="button"
              onClick={() => onChangeLoginMode('student')}
            >
              Aluno
            </button>
            <button
              className={`login-mode-button${loginMode === 'admin' ? ' is-active' : ''}`}
              type="button"
              onClick={() => onChangeLoginMode('admin')}
            >
              Administrador
            </button>
          </div>
          {loginMode === 'student' ? (
            <>
              <label className="form-field">
                <span>RA</span>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="Digite seu RA"
                  value={ra}
                  onChange={(event) => onRaChange(event.target.value)}
                />
              </label>
              <label className="form-field">
                <span>Data de nascimento</span>
                <input type="date" value={birthDate} onChange={(event) => onBirthDateChange(event.target.value)} />
              </label>
            </>
          ) : (
            <>
              <label className="form-field">
                <span>Login</span>
                <input
                  type="text"
                  placeholder="Login institucional"
                  value={adminLogin}
                  onChange={(event) => onAdminLoginChange(event.target.value)}
                />
              </label>
              <label className="form-field">
                <span>Senha</span>
                <input
                  type="password"
                  placeholder="Digite sua senha"
                  value={adminPassword}
                  onChange={(event) => onAdminPasswordChange(event.target.value)}
                />
              </label>
            </>
          )}
          {errorMessage ? <p className="login-error">{errorMessage}</p> : null}
          <button className="login-submit" type="submit" disabled={isLoading}>
            {isLoading ? 'Entrando...' : loginMode === 'student' ? 'Entrar no sistema' : 'Entrar na moderacao'}
          </button>
        </form>
      </div>
    </div>
  )
}
