import { useMemo, useState } from 'react'
import { BriefcaseIcon, CalendarIcon, ClockIcon } from '../components/icons'
import type { ApplicationStatus, CareerProfile, Deadline, JobInterest, MuralPost, UserRole } from '../types/app'

type MuralViewProps = {
  userRole: UserRole
  muralPosts: MuralPost[]
  importantDeadlines: Deadline[]
  careerProfile: CareerProfile
  appliedPostIds: number[]
  jobInterests: JobInterest[]
  onApply: (post: MuralPost) => void
  onOpenPublishModal: () => void
  onOpenReportModal: () => void // <-- Propriedade necessária
}

export function MuralView({
  userRole,
  muralPosts,
  importantDeadlines,
  careerProfile,
  appliedPostIds,
  jobInterests = [],
  onApply,
  onOpenPublishModal,
  onOpenReportModal, // <-- Recebendo a função
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
        <div className="card-meta"><span>Autor: {post.author}</span><span>Status: {post.status}</span></div>
        
        {post.button ? (
          <div className="application-action-row">
            <span>{applicationStatus === 'submitted' ? 'As informacoes da vaga foram encaminhadas para seu e-mail.' : `Contato da vaga: ${post.contactEmail || 'secretaria@utp.br'}`}</span>
            {applicationStatus === 'available' ? (
              <button className="primary-button" type="button" onClick={() => onApply(post)}>
                {post.button}
              </button>
            ) : null}
          </div>
        ) : null}
        {interest ? (
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
      <div className="page-heading">
        <div>
          <h2>Mural Academico</h2>
          <p>Vagas, eventos e comunicados oficiais aprovados pela moderacao.</p>
        </div>
        
        {/* BOTÕES NO TOPO LADO A LADO */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="primary-button" 
            type="button" 
            style={{ backgroundColor: '#dc2626', color: 'white', border: 'none' }} 
            onClick={onOpenReportModal}
          >
            Registrar Denuncia
          </button>
          <button className="primary-button" type="button" onClick={onOpenPublishModal}>
            Postar no Mural
          </button>
        </div>
      </div>

      <div className="mural-filter-bar">
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
          <section className="mural-post-group">
            <div className="mural-group-heading">
              <div><h3>Disponiveis no mural</h3></div>
              <span>{availablePosts.length} item(ns)</span>
            </div>
            {availablePosts.map(renderPost)}
          </section>
          
          {interestedPosts.length > 0 && (
            <section className="mural-post-group mural-interested-group">
              <div className="mural-group-heading"><div><h3>Interesses declarados</h3></div></div>
              {interestedPosts.map(renderPost)}
            </section>
          )}
        </div>

        <aside className="side-panel">
          {userRole === 'student' && (
            <div className="study-card application-profile-card">
              <div className="study-heading"><h3>Meu interesse</h3></div>
              <div className="application-profile-summary">
                <div><span>Area</span><strong>{careerProfile.desiredArea || 'Pendente'}</strong></div>
                <div><span>Curriculo</span><strong>{careerProfile.resumeFileName || 'Pendente'}</strong></div>
              </div>
            </div>
          )}
          <div className="study-card">
            <div className="study-heading"><h3>Prazos Importantes</h3></div>
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
      {/* ... (resto do modal de deadlines continua igual) ... */}
    </section>
  )
}