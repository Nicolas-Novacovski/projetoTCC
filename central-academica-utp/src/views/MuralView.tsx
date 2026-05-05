import { BriefcaseIcon, CalendarIcon, ClockIcon } from '../components/icons'
import type { Deadline, MuralPost, UserRole } from '../types/app'

type MuralViewProps = {
  userRole: UserRole
  muralPosts: MuralPost[]
  importantDeadlines: Deadline[]
  onApply: (title: string) => void
  onOpenPublishModal: () => void
}

export function MuralView({
  userRole,
  muralPosts,
  importantDeadlines,
  onApply,
  onOpenPublishModal,
}: MuralViewProps) {
  return (
    <section className="page-section">
      <div className="page-heading">
        <div>
          <h2>Mural Academico</h2>
          <p>
            {userRole === 'admin'
              ? 'Acompanhe o que esta publicado e navegue ate a moderacao quando precisar revisar conteudos.'
              : 'Vagas, eventos e comunicados oficiais aprovados pela moderacao.'}
          </p>
        </div>
        <button className="secondary-button" type="button" onClick={onOpenPublishModal}>
          Postar no Mural
        </button>
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
