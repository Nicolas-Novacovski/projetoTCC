import { useMemo, useState } from 'react'
import { BriefcaseIcon, CalendarIcon, ClockIcon, TrashIcon } from '../components/icons'
import type { ApplicationStatus, CareerProfile, Deadline, JobInterest, MuralPost, UserRole } from '../types/app'

type MuralViewProps = {
  userRole: UserRole
  currentUserName: string 
  muralPosts: MuralPost[]
  importantDeadlines: Deadline[]
  careerProfile: CareerProfile
  appliedPostIds: number[]
  jobInterests: JobInterest[]
  onApply: (post: MuralPost) => void
  onOpenPublishModal: () => void
  onOpenReportModal: () => void
  onDeleteMyPost: (post: MuralPost) => void 
}

export function MuralView({
  userRole,
  currentUserName,
  muralPosts,
  importantDeadlines,
  careerProfile,
  appliedPostIds,
  jobInterests = [],
  onApply,
  onOpenPublishModal,
  onOpenReportModal,
  onDeleteMyPost,
}: MuralViewProps) {
  const [selectedDeadline, setSelectedDeadline] = useState<Deadline | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('Todos')

  const categoryFilters = useMemo(
    () => ['Todos', ...Array.from(new Set(muralPosts.map((post) => post.category))).sort()],
    [muralPosts],
  )

  const filteredPosts = useMemo(
    () => selectedCategory === 'Todos'
      ? muralPosts
      : muralPosts.filter((post) => post.category === selectedCategory),
    [muralPosts, selectedCategory],
  )

  const interestedPosts = filteredPosts.filter((post) => appliedPostIds.includes(post.id))
  const availablePosts = filteredPosts.filter((post) => !appliedPostIds.includes(post.id))

  function getApplicationStatus(post: MuralPost): ApplicationStatus {
    return appliedPostIds.includes(post.id) ? 'submitted' : 'available'
  }

  function getMatchLabel(post: MuralPost) {
    if (post.category !== 'Vaga') return null
    const profileArea = (careerProfile.desiredArea || '').trim().toLowerCase()
    const profileCity = (careerProfile.preferredCity || '').trim().toLowerCase()
    const searchablePost = `${post.title} ${post.subtitle} ${post.description}`.toLowerCase()
    const matches = [
      profileArea && searchablePost.includes(profileArea),
      profileCity && searchablePost.includes(profileCity),
      careerProfile.resumeFileName,
    ].filter(Boolean).length
    if (matches >= 2) return 'Alta aderencia'
    if (matches === 1) return 'Aderencia media'
    return 'Analise recomendada'
  }

  function renderPost(post: MuralPost) {
    const applicationStatus = getApplicationStatus(post)
    const interest = jobInterests.find((item) => item.postId === post.id)
    
   
    const isMyPost = Boolean(
      post.author && 
      currentUserName && 
      post.author.trim().toLowerCase() === currentUserName.trim().toLowerCase()
    )

    return (
      <article key={post.id} className={`mural-card${applicationStatus === 'submitted' ? ' application-sent-card' : ''}`}>
        <div className="card-header">
          <div className="card-title-row">
            <div className="card-icon">{post.category === 'Evento' ? <CalendarIcon /> : <BriefcaseIcon />}</div>
            <div className="mural-card-title-copy"><h3>{post.title}</h3><p className="card-subtitle">{post.subtitle}</p></div>
          </div>
          <div className="mural-card-tags">
            {getMatchLabel(post) ? <span className="match-tag">{getMatchLabel(post)}</span> : null}
            <span className="card-tag">{post.tag}</span>
          </div>
        </div>
        <p className="card-description">{post.description}</p>
        {post.meta ? <div className="card-meta"><span><ClockIcon />{post.meta[0]}</span><span>{post.meta[1]}</span></div> : null}
        
        <div className="card-meta">
          <span>Autor: {isMyPost ? 'Você' : post.author}</span>
          <span>Status: {post.status}</span>
        </div>
        
        
        {(post.button || isMyPost) && userRole === 'student' ? (
          <div className="application-action-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
            <span style={{ fontSize: '14px', color: '#64748b' }}>
              {isMyPost 
                ? 'Esta publicação foi criada por você.' 
                : applicationStatus === 'submitted' 
                  ? 'As informacoes da vaga foram encaminhadas para seu e-mail.' 
                  : `Contato da vaga: ${post.contactEmail || 'secretaria@utp.br'}`}
            </span>
            
            {isMyPost ? (
               <button 
                type="button" 
                className="ghost-button"
                style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '6px' }} 
                onClick={() => onDeleteMyPost(post)}
              >
                <TrashIcon />
                Excluir postagem
              </button>
            ) : post.button && applicationStatus === 'available' ? (
              <button 
                className="primary-button" 
                type="button" 
                style={{ padding: '6px 16px', fontSize: '13px', margin: 0, height: 'auto', minWidth: '120px' }} 
                onClick={() => onApply(post)}
              >
                {post.button}
              </button>
            ) : null}
          </div>
        ) : null}

        {interest && userRole === 'student' ? (
          <div className="interest-history-strip">
            <span>Status do e-mail: <strong>{interest.emailStatus}</strong></span>
            <span>Declarado em: <strong>{interest.createdAt}</strong></span>
          </div>
        ) : null}
      </article>
    )
  }

  return (
    <section className="page-section mural-section">
      <div className="page-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Mural Academico</h2>
          <p>
            {userRole === 'admin'
              ? 'Acompanhe o que esta publicado e navegue ate a moderacao quando precisar revisar conteudos.'
              : 'Vagas, eventos e comunicados oficiais aprovados pela moderacao.'}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', height: 'fit-content' }}>
          {userRole === 'student' && (
            <button 
              className="primary-button" 
              type="button" 
              style={{ backgroundColor: '#dc2626', color: 'white', border: 'none', margin: 0, height: 'fit-content' }} 
              onClick={onOpenReportModal}
            >
              Registrar Denuncia
            </button>
          )}
          <button 
            className="primary-button" 
            type="button" 
            style={{ margin: 0, height: 'fit-content' }} 
            onClick={onOpenPublishModal}
          >
            Postar no Mural
          </button>
        </div>
      </div>

      <div className="mural-filter-bar" aria-label="Filtros do mural">
        {categoryFilters.map((category) => (
          <button
            key={category}
            className={`filter-chip${selectedCategory === category ? ' is-active' : ''}`}
            type="button"
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="mural-content-grid">
        <div className="mural-list">
          <section className="mural-post-group" aria-label="Publicacoes disponiveis">
            <div className="mural-group-heading">
              <div>
                <h3>Disponiveis no mural</h3>
                <p>{selectedCategory === 'Todos' ? 'Publicacoes que ainda nao foram movidas para seus interesses.' : `Filtro ativo: ${selectedCategory}.`}</p>
              </div>
              <span>{availablePosts.length} item(ns)</span>
            </div>
            {availablePosts.map(renderPost)}
            {availablePosts.length === 0 ? <article className="mural-card"><h3>Nenhuma publicacao disponivel</h3><p className="card-description">Tente outro filtro ou veja os interesses ja declarados abaixo.</p></article> : null}
          </section>
          
          {interestedPosts.length > 0 ? (
            <section className="mural-post-group mural-interested-group" aria-label="Vagas com interesse declarado">
              <div className="mural-group-heading">
                <div>
                  <h3>Interesses declarados</h3>
                  <p>Vagas que ja tiveram as informacoes encaminhadas para seu e-mail.</p>
                </div>
                <span>{interestedPosts.length} vaga(s)</span>
              </div>
              {interestedPosts.map(renderPost)}
            </section>
          ) : null}
        </div>

        <aside className="side-panel">
          {userRole === 'student' ? (
            <div className="study-card application-profile-card">
              <div className="study-heading"><div className="study-title"><BriefcaseIcon /><h3>Meu interesse</h3></div></div>
              <div className="application-profile-summary">
                <div><span>Area</span><strong>{careerProfile.desiredArea || 'Completar perfil'}</strong></div>
                <div><span>E-mail</span><strong>{careerProfile.contactEmail || 'Pendente'}</strong></div>
                <div><span>Curriculo</span><strong>{careerProfile.resumeFileName || 'Pendente'}</strong></div>
              </div>
            </div>
          ) : null}

          <div className="study-card">
            <div className="study-heading"><div className="study-title"><CalendarIcon /><h3>Prazos Importantes</h3></div></div>
            <div className="study-list">
              {importantDeadlines.map((item) => (
                <div key={item.title} className="study-item">
                  <div><h4>{item.title}</h4><p>{item.detail}</p></div>
                  <button type="button" onClick={() => setSelectedDeadline(item)}>Ver</button>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {selectedDeadline ? (
        <div className="details-modal-backdrop" onClick={() => setSelectedDeadline(null)}>
          <div className="details-modal deadline-modal" onClick={(event) => event.stopPropagation()}>
            <div className="details-modal-header">
              <div>
                <span className="detail-tag">Prazo importante</span>
                <h3>{selectedDeadline.title}</h3>
                <p>{selectedDeadline.detail}</p>
              </div>
              <button className="ghost-button" type="button" onClick={() => setSelectedDeadline(null)}>Fechar</button>
            </div>
            <div className="deadline-detail-grid">
              <div><span className="detail-label">O que significa</span><strong>{selectedDeadline.description}</strong></div>
              <div><span className="detail-label">Proximo passo</span><strong>{selectedDeadline.action}</strong></div>
              <div><span className="detail-label">Onde resolver</span><strong>{selectedDeadline.channel}</strong></div>
            </div>
            <div className="details-modal-footer deadline-modal-footer">
              <div>
                <span className="detail-label">Dica</span>
                <strong>Organize os documentos antes do prazo para evitar retrabalho na secretaria.</strong>
              </div>
              <button className="primary-button" type="button" onClick={() => setSelectedDeadline(null)}>
                Marcar como visto
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}