import Swal from 'sweetalert2'
import { showFeatureAlert } from '../lib/alerts'
import { slugifyStatus } from '../lib/navigation'
import type { DashboardStats, LostItem, ModerationPost, PostStatus, Report, RideOffer } from '../types/app'

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
  onOpenLostItemModal: () => void // <-- Adicionado aqui
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
  onOpenLostItemModal, // <-- Adicionado aqui
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

  async function handleConsultarItem(item: LostItem) {
    await Swal.fire({
      title: 'Detalhes do Item',
      width: 600,
      customClass: { popup: 'application-popup', confirmButton: 'primary-button' },
      buttonsStyling: false,
      html: `
        <div style="text-align: left;">
          <span class="detail-tag" style="margin-bottom: 8px; display: inline-block;">${item.category}</span>
          <h2 style="margin: 0 0 20px 0; color: #163a54; font-size: 24px;">${item.title}</h2>
          <div style="background: #f7fafc; padding: 16px; border-radius: 8px;">
            <span style="display: block; font-size: 11px; color: #708d9f; font-weight: bold; text-transform: uppercase; margin-bottom: 8px;">Descrição</span>
            <p style="color: #466579; font-size: 14px; margin: 0; line-height: 1.5;">${item.description || 'Nenhuma descrição fornecida.'}</p>
          </div>
        </div>
      `,
      confirmButtonText: 'Fechar',
    })
  }

  async function handleReviewRide(item: any) {
    if (item.type === 'Oferta') {
      const ride = item.raw;
      await Swal.fire({
        title: 'Detalhes da Oferta',
        width: 700,
        customClass: { popup: 'application-popup', confirmButton: 'primary-button' },
        buttonsStyling: false,
        html: `
          <div style="text-align: left;">
            <span class="detail-tag" style="margin-bottom: 8px; display: inline-block; background: #e0f2fe; color: #0369a1;">OFERTA DE CARONA</span>
            <h2 style="margin: 0 0 20px 0; color: #163a54; font-size: 24px;">${ride.title}</h2>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
              <div style="background: #f7fafc; padding: 12px; border-radius: 8px;">
                <span style="display: block; font-size: 11px; color: #708d9f; font-weight: bold; text-transform: uppercase;">Motorista</span>
                <strong style="color: #163a54; font-size: 14px; display: block; margin-top: 4px;">${ride.driverName || ride.driver || 'Não informado'}</strong>
              </div>
              <div style="background: #f7fafc; padding: 12px; border-radius: 8px;">
                <span style="display: block; font-size: 11px; color: #708d9f; font-weight: bold; text-transform: uppercase;">Região / Destino</span>
                <strong style="color: #163a54; font-size: 14px; display: block; margin-top: 4px;">${ride.zone}</strong>
              </div>
              <div style="background: #f7fafc; padding: 12px; border-radius: 8px;">
                <span style="display: block; font-size: 11px; color: #708d9f; font-weight: bold; text-transform: uppercase;">Veículo</span>
                <strong style="color: #163a54; font-size: 14px; display: block; margin-top: 4px;">${ride.vehicle || 'Não informado'}</strong>
              </div>
              <div style="background: #f7fafc; padding: 12px; border-radius: 8px;">
                <span style="display: block; font-size: 11px; color: #708d9f; font-weight: bold; text-transform: uppercase;">Vagas Disponíveis</span>
                <strong style="color: #163a54; font-size: 14px; display: block; margin-top: 4px;">${ride.seats}</strong>
              </div>
              <div style="background: #f7fafc; padding: 12px; border-radius: 8px;">
                <span style="display: block; font-size: 11px; color: #708d9f; font-weight: bold; text-transform: uppercase;">Horário</span>
                <strong style="color: #163a54; font-size: 14px; display: block; margin-top: 4px;">${ride.time}</strong>
              </div>
              <div style="background: #f7fafc; padding: 12px; border-radius: 8px;">
                <span style="display: block; font-size: 11px; color: #708d9f; font-weight: bold; text-transform: uppercase;">WhatsApp</span>
                <strong style="color: #163a54; font-size: 14px; display: block; margin-top: 4px;">${ride.whatsapp}</strong>
              </div>
            </div>

            <div style="background: #f7fafc; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
              <span style="display: block; font-size: 11px; color: #708d9f; font-weight: bold; text-transform: uppercase; margin-bottom: 8px;">Ponto de Encontro</span>
              <p style="color: #466579; font-size: 14px; margin: 0; line-height: 1.5;">${ride.meeting}</p>
            </div>

            <div style="background: #f7fafc; padding: 16px; border-radius: 8px;">
              <span style="display: block; font-size: 11px; color: #708d9f; font-weight: bold; text-transform: uppercase; margin-bottom: 8px;">Dias da Semana</span>
              <p style="color: #466579; font-size: 14px; margin: 0; line-height: 1.5;">${ride.weekdays || 'Não informado'}</p>
            </div>
          </div>
        `,
        confirmButtonText: 'Fechar',
      })
    } else {
      const req = item.raw;
      await Swal.fire({
        title: 'Detalhes do Pedido',
        width: 700,
        customClass: { popup: 'application-popup', confirmButton: 'primary-button' },
        buttonsStyling: false,
        html: `
          <div style="text-align: left;">
            <span class="detail-tag" style="margin-bottom: 8px; display: inline-block; background: #fef3c7; color: #b45309;">PEDIDO DE CARONA</span>
            <h2 style="margin: 0 0 20px 0; color: #163a54; font-size: 24px;">Destino: ${req.zone}</h2>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
              <div style="background: #f7fafc; padding: 12px; border-radius: 8px;">
                <span style="display: block; font-size: 11px; color: #708d9f; font-weight: bold; text-transform: uppercase;">Solicitante</span>
                <strong style="color: #163a54; font-size: 14px; display: block; margin-top: 4px;">${req.requesterName || 'Aluno'}</strong>
              </div>
              <div style="background: #f7fafc; padding: 12px; border-radius: 8px;">
                <span style="display: block; font-size: 11px; color: #708d9f; font-weight: bold; text-transform: uppercase;">Data do Pedido</span>
                <strong style="color: #163a54; font-size: 14px; display: block; margin-top: 4px;">${req.createdAt || 'Não informada'}</strong>
              </div>
              <div style="background: #f7fafc; padding: 12px; border-radius: 8px;">
                <span style="display: block; font-size: 11px; color: #708d9f; font-weight: bold; text-transform: uppercase;">Status</span>
                <strong style="color: #163a54; font-size: 14px; display: block; margin-top: 4px;">${req.status}</strong>
              </div>
              <div style="background: #f7fafc; padding: 12px; border-radius: 8px;">
                <span style="display: block; font-size: 11px; color: #708d9f; font-weight: bold; text-transform: uppercase;">WhatsApp</span>
                <strong style="color: #163a54; font-size: 14px; display: block; margin-top: 4px;">${req.requesterWhatsapp}</strong>
              </div>
            </div>

            <div style="background: #f7fafc; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
              <span style="display: block; font-size: 11px; color: #708d9f; font-weight: bold; text-transform: uppercase; margin-bottom: 8px;">Endereço de Embarque</span>
              <p style="color: #466579; font-size: 14px; margin: 0; line-height: 1.5;">${req.pickupAddress}</p>
            </div>

            <div style="background: #f7fafc; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
              <span style="display: block; font-size: 11px; color: #708d9f; font-weight: bold; text-transform: uppercase; margin-bottom: 8px;">Dias da Semana</span>
              <p style="color: #466579; font-size: 14px; margin: 0; line-height: 1.5;">${req.weekdays || 'Não informado'}</p>
            </div>
            
            ${req.notes ? `
            <div style="background: #f7fafc; padding: 16px; border-radius: 8px;">
              <span style="display: block; font-size: 11px; color: #708d9f; font-weight: bold; text-transform: uppercase; margin-bottom: 8px;">Observações do Aluno</span>
              <p style="color: #466579; font-size: 14px; margin: 0; line-height: 1.5;">${req.notes}</p>
            </div>
            ` : ''}
          </div>
        `,
        confirmButtonText: 'Fechar',
      })
    }
  }

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <section className="moderation-card moderation-table-card">
            <div className="moderation-card-header"><div><h3>Fila de aprovacao</h3><p>Itens recebidos pelo mural academico.</p></div></div>
            <div className="moderation-table">
              <div className="moderation-table-head">
                <span>Titulo</span>
                <span>Categoria</span>
                <span>Autor</span>
                <span>Status</span>
                <span style={{ textAlign: 'center' }}>Acoes</span>
              </div>
              {moderationQueue.map((item) => (
                <div key={item.id} className="moderation-row">
                  <div><strong>{item.title}</strong><small>{item.submittedAt}</small></div>
                  <span>{item.category}</span>
                  <span>{item.author}</span>
                  <span className={`status-pill status-${slugifyStatus(item.status)}`}>{item.status}</span>
                  <div className="row-actions" style={{ display: 'flex', gap: '8px', justifyContent: 'center', width: '100%' }}>
                    <button type="button" onClick={() => onModerate('Aprovado', item)}>Aprovar</button>
                    <button type="button" onClick={() => onModerate('Revisao', item)}>Revisar</button>
                    <button type="button" style={{ color: '#dc2626', fontWeight: 'bold', whiteSpace: 'nowrap' }} onClick={() => onDelete(item)}>Excluir</button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="moderation-card moderation-table-card">
            <div className="moderation-card-header"><div><h3>Gerenciamento de Caronas</h3><p>Rotas e pedidos ativos na plataforma.</p></div></div>
            <div className="moderation-table">
              <div className="moderation-table-head">
                <span>Titulo / Destino</span>
                <span>Regiao</span>
                <span>Autor</span>
                <span>Vagas</span>
                <span style={{ textAlign: 'center' }}>Acoes</span>
              </div>
              {combinedRides.map((item) => (
                <div key={`${item.type}-${item.id}`} className="moderation-row">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                    <span style={{ 
                      fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', 
                      backgroundColor: item.type === 'Oferta' ? '#e0f2fe' : '#fef3c7', 
                      color: item.type === 'Oferta' ? '#0369a1' : '#b45309', width: 'fit-content'
                    }}>
                      {item.type.toUpperCase()}
                    </span>
                    <strong>{item.title}</strong>
                  </div>
                  <span>{item.zone}</span>
                  <span>{item.author}</span>
                  <span className="status-pill status-aprovado" style={item.seats === '-' ? { background: 'transparent', color: '#94a3b8' } : {}}>{item.seats}</span>
                  <div className="row-actions" style={{ display: 'flex', gap: '8px', justifyContent: 'center', width: '100%' }}>
                    <button type="button" onClick={() => void handleReviewRide(item)}>Revisar</button>
                    <button type="button" style={{ color: '#dc2626', fontWeight: 'bold', whiteSpace: 'nowrap' }} onClick={() => onDeleteRideItem(item.id, item.type, item.title)}>Excluir</button>
                  </div>
                </div>
              ))}
              {combinedRides.length === 0 && (
                <p style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>Nenhum item registrado no momento.</p>
              )}
            </div>
          </section>
        </div>

        <aside className="moderation-side">
          <section className="moderation-card">
            {/* === CABEÇALHO DO CARD COM O NOVO BOTÃO === */}
            <div className="moderation-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3>Achados e Perdidos</h3>
                <p>Marque itens retirados pelo dono como recuperados.</p>
              </div>
              <button 
                type="button" 
                className="primary-button" 
                style={{ padding: '6px 12px', fontSize: '13px', whiteSpace: 'nowrap' }} 
                onClick={onOpenLostItemModal}
              >
                Registrar Item
              </button>
            </div>
            
            <div className="lost-admin-list">
              {lostItems.map((item) => (
                <article key={item.id} className="lost-admin-item">
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.category} - {item.place}</p>
                    <small>{item.date}</small>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                    <button type="button" className="status-pill status-success" style={{ cursor: 'pointer', border: 'none', margin: 0 }} onClick={() => onMarkLostItemRecovered(item)}>
                      Marcar recuperado
                    </button>
                    <button type="button" style={{ margin: 0, padding: '4px 12px', fontSize: '13px', cursor: 'pointer', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#475569' }} onClick={() => void handleConsultarItem(item)}>
                      Ver detalhes
                    </button>
                  </div>
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
        </aside>
      </div>
    </section>
  )
}