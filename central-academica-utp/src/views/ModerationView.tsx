import Swal from 'sweetalert2'
import { showFeatureAlert } from '../lib/alerts'
import { slugifyStatus } from '../lib/navigation'
import type { DashboardStats, LostItem, ModerationPost, PostStatus, Report, RideOffer } from '../types/app'
import { requestJson } from '../lib/http'

type ModerationViewProps = {
  moderationQueue: ModerationPost[]
  reports: Report[]
  dashboard: DashboardStats
  lostItems: LostItem[]
  rides: RideOffer[]
  rideRequests: any[] 
  onRefresh: () => void
  onModerate: (status: Extract<PostStatus, 'Aprovado' | 'Revisao'>, item: ModerationPost) => void
  onMarkLostItemRecovered: (item: LostItem) => void
  onDelete: (item: ModerationPost) => void
  onDeleteRideItem: (id: number, type: 'Oferta' | 'Pedido', title: string) => void
  onOpenLostItemModal: () => void
}

export function ModerationView({
  moderationQueue,
  reports,
  dashboard,
  lostItems,
  rides,
  rideRequests,
  onRefresh,
  onModerate,
  onMarkLostItemRecovered,
  onDelete,
  onDeleteRideItem,
  onOpenLostItemModal,
}: ModerationViewProps) {
  const approvedCount = moderationQueue.filter((item) => item.status === 'Aprovado').length

  const combinedRides = [
    ...rides.map((r) => ({
      id: r.id,
      type: 'Oferta' as const,
      title: r.title,
      zone: r.zone,
      author: (r as any).driverName || (r as any).driver || 'Aluno',
      seats: r.seats,
      time: r.time,
      raw: r,
    })),
    ...rideRequests.map((r) => ({
      id: r.id,
      type: 'Pedido' as const,
      title: 'Buscando carona',
      zone: r.zone,
      author: (r as any).requesterName || 'Aluno',
      seats: '-',
      time: '-',
      raw: r,
    })),
  ]

  async function handleResolveReport(reportId: number) {
    const user = JSON.parse(localStorage.getItem('central-academica-utp:session-user') || '{}');
    if (!user.id) return;

    try {
      await requestJson(`/api/reports/${reportId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'Resolvida', userId: user.id, role: user.role }),
      });
      onRefresh();
    } catch (error) {
      alert('Erro ao marcar denúncia como resolvida.');
    }
  }

  async function handleDeleteReport(reportId: number) {
    const user = JSON.parse(localStorage.getItem('central-academica-utp:session-user') || '{}');
    if (!user.id) return;

    const conf = confirm('Tem certeza que deseja apagar essa denúncia?');
    if (!conf) return;

    try {
      await requestJson(`/api/reports/${reportId}?userId=${user.id}&role=${user.role}`, { method: 'DELETE' });
      onRefresh();
    } catch (error) {
      alert('Erro ao apagar denúncia.');
    }
  }

  return (
    <section className="page-section moderation-section">
      <div className="page-heading">
        <div><h2>Central de Moderacao</h2><p>Revise publicacoes, acompanhe denuncias e aprove o que vai para o mural.</p></div>
        <button className="primary-button" type="button" onClick={() => void showFeatureAlert('Exportacao', 'Funcionalidade em breve.')}>
          Exportar relatorio
        </button>
      </div>
      
      <div className="moderation-overview">
        <article className="overview-card"><span>Em analise</span><strong>{dashboard.pendingModerationCount}</strong><p>Publicacoes aguardando revisao.</p></article>
        <article className="overview-card"><span>Denuncias</span><strong>{dashboard.reportsCount}</strong><p>Ocorrencias abertas.</p></article>
        <article className="overview-card"><span>Aprovadas</span><strong>{approvedCount}</strong><p>Itens liberados.</p></article>
      </div>
      
      <div className="moderation-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <section className="moderation-card moderation-table-card">
            <div className="moderation-card-header"><div><h3>Fila de aprovacao</h3></div></div>
            <div className="moderation-table">
              <div className="moderation-table-head">
                <span>Titulo</span><span>Categoria</span><span>Autor</span><span>Status</span><span style={{ textAlign: 'center' }}>Acoes</span>
              </div>
              {moderationQueue.map((item) => (
                <div key={item.id} className="moderation-row">
                  <div><strong>{item.title}</strong><small>{item.submittedAt}</small></div>
                  <span>{item.category}</span>
                  <span>{item.author}</span>
                  <span className={`status-pill status-${slugifyStatus(item.status)}`}>{item.status}</span>
                  <div className="row-actions" style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button type="button" onClick={() => onModerate('Aprovado', item)}>Aprovar</button>
                    <button type="button" style={{ color: '#dc2626' }} onClick={() => onDelete(item)}>Excluir</button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="moderation-card moderation-table-card">
            <div className="moderation-card-header"><div><h3>Gerenciamento de Caronas</h3></div></div>
            <div className="moderation-table">
              <div className="moderation-table-head">
                <span>Titulo / Destino</span><span>Regiao</span><span>Autor</span><span style={{ textAlign: 'center' }}>Acoes</span>
              </div>
              {combinedRides.map((item) => (
                <div key={`${item.type}-${item.id}`} className="moderation-row">
                  <div><strong>{item.title}</strong></div>
                  <span>{item.zone}</span>
                  <span>{item.author}</span>
                  <div className="row-actions" style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button type="button" style={{ color: '#dc2626' }} onClick={() => onDeleteRideItem(item.id, item.type, item.title)}>Excluir</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="moderation-side">
          <section className="moderation-card">
            <div className="moderation-card-header"><h3>Alertas de Segurança</h3></div>
            <div className="report-list">
              {reports.map((report) => (
                <article key={report.id} style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <strong style={{ fontSize: '14px', color: '#1e293b' }}>{report.title}</strong>
                    
                    {/* Status padronizado */}
                    <span 
                      className="status-pill" 
                      style={{ 
                        backgroundColor: report.status === 'Aberta' ? '#fef3c7' : '#dcfce7',
                        color: report.status === 'Aberta' ? '#b45309' : '#15803d',
                        fontSize: '11px', fontWeight: 'bold', margin: 0 
                      }}
                    >
                      {report.status === 'Aberta' ? 'Em Análise' : 'Encerrada'}
                    </span>
                  </div>
                  <p style={{ color: '#475569', fontSize: '13px', marginBottom: '12px' }}>{report.detail}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <small style={{ color: '#94a3b8' }}>{report.createdAt}</small>
                    
                    {/* Botões padronizados */}
                    <div className="row-actions" style={{ display: 'flex', gap: '12px' }}>
                      {report.status === 'Aberta' && (
                        <button type="button" onClick={() => handleResolveReport(report.id)}>Resolver</button>
                      )}
                      <button type="button" style={{ color: '#dc2626', fontWeight: 'bold' }} onClick={() => handleDeleteReport(report.id)}>Excluir</button>
                    </div>
                  </div>
                </article>
              ))}
              {reports.length === 0 && <p style={{ fontSize: '13px', color: '#64748b' }}>Nenhuma denúncia.</p>}
            </div>
          </section>
        </aside>
      </div>
    </section>
  )
}