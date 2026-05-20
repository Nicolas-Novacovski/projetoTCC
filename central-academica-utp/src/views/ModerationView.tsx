import { showFeatureAlert } from '../lib/alerts'
import { slugifyStatus } from '../lib/navigation'
import type { DashboardStats, LostItem, ModerationPost, PostStatus, Report } from '../types/app'

type ModerationViewProps = {
  moderationQueue: ModerationPost[]
  reports: Report[]
  dashboard: DashboardStats
  lostItems: LostItem[]
  onRefresh: () => void
  onModerate: (status: Extract<PostStatus, 'Aprovado' | 'Revisao'>, item: ModerationPost) => void
  onMarkLostItemRecovered: (item: LostItem) => void
}

export function ModerationView({
  moderationQueue,
  reports,
  dashboard,
  lostItems,
  onRefresh,
  onModerate,
  onMarkLostItemRecovered,
}: ModerationViewProps) {
  const approvedCount = moderationQueue.filter((item) => item.status === 'Aprovado').length

  return (
    <section className="page-section moderation-section">
      <div className="page-heading">
        <div><h2>Central de Moderacao</h2><p>Revise publicacoes, acompanhe denuncias e aprove o que vai para o mural.</p></div>
        <button className="primary-button" type="button" onClick={() => void showFeatureAlert('Exportacao de relatorio', 'A fila de moderacao e as denuncias ja estao no banco. Se quiser, o proximo passo pode ser gerar CSV ou PDF.')}>
  Exportar relatorio
</button>
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
                <span className={`status-pill status-${slugifyStatus(item.status)}`}>{item.status}</span>
                <div className="row-actions"><button type="button" onClick={() => onModerate('Aprovado', item)}>Aprovar</button><button type="button" onClick={() => onModerate('Revisao', item)}>Revisar</button></div>
              </div>
            ))}
          </div>
        </section>
        <aside className="moderation-side">
          <section className="moderation-card">
            <div className="moderation-card-header">
              <div><h3>Achados e Perdidos</h3><p>Marque itens retirados pelo dono como recuperados.</p></div>
            </div>
            <div className="lost-admin-list">
              {lostItems.map((item) => (
                <article key={item.id} className="lost-admin-item">
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.category} - {item.place}</p>
                    <small>{item.date}</small>
                  </div>
                  <button type="button" onClick={() => onMarkLostItemRecovered(item)}>
                    Marcar recuperado
                  </button>
                </article>
              ))}
              {lostItems.length === 0 ? <p className="empty-state-text">Nenhum item aguardando retirada.</p> : null}
            </div>
          </section>
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
