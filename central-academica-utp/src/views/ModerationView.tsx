import Swal from 'sweetalert2'
import type { CSSProperties } from 'react'
import { showFeatureAlert } from '../lib/alerts'
import { slugifyStatus } from '../lib/navigation'
import type { DashboardStats, LostItem, ModerationPost, PostStatus, Report, RideOffer, RideRequest } from '../types/app'
import { requestJson } from '../lib/http'
import { CheckIcon, EyeIcon, TrashIcon } from '../components/icons'

type ModerationViewProps = {
  moderationQueue: ModerationPost[]
  reports: Report[]
  dashboard: DashboardStats
  lostItems: LostItem[]
  rides: RideOffer[]
  rideRequests: RideRequest[]
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
  const reviewCount = moderationQueue.filter((item) => item.status === 'Revisao').length
  const pendingCount = moderationQueue.filter((item) => item.status === 'Pendente').length
  const openReportsCount = reports.filter((report) => report.status === 'Aberta').length
  const resolvedReportsCount = reports.filter((report) => report.status === 'Resolvida').length
  const activeRidesCount = rides.filter((ride) => ride.status === 'Ativa').length
  const openRideRequestsCount = rideRequests.filter((request) => request.status === 'Aberto').length
  const acceptedRideRequestsCount = rideRequests.filter((request) => request.status === 'Aceito').length
  const emailDeliveryRate = dashboard.jobInterestsCount > 0
    ? Math.round((dashboard.sentEmailsCount / dashboard.jobInterestsCount) * 100)
    : 0
  const moderationTotal = Math.max(moderationQueue.length, 1)
  const approvedPercentage = Math.round((approvedCount / moderationTotal) * 100)
  const reviewPercentage = Math.round((reviewCount / moderationTotal) * 100)
  const pendingPercentage = moderationQueue.length > 0
    ? Math.max(100 - approvedPercentage - reviewPercentage, 0)
    : 0
  const approvedAngle = (approvedCount / moderationTotal) * 360
  const reviewAngle = approvedAngle + (reviewCount / moderationTotal) * 360
  const operationalBacklog = pendingCount + reviewCount + openReportsCount
  const operationRows = [
    { label: 'Publicacoes no mural', value: moderationQueue.length, tone: 'blue' },
    { label: 'Ofertas de carona', value: activeRidesCount, tone: 'green' },
    { label: 'Pedidos de carona', value: openRideRequestsCount, tone: 'amber' },
    { label: 'Achados e perdidos', value: lostItems.length, tone: 'cyan' },
  ]
  const operationMax = Math.max(...operationRows.map((item) => item.value), 1)
  const categoryCounts = moderationQueue.reduce<Record<string, number>>((counts, item) => {
    counts[item.category] = (counts[item.category] ?? 0) + 1
    return counts
  }, {})
  const topCategories = Object.entries(categoryCounts)
    .sort(([, left], [, right]) => right - left)
    .slice(0, 4)

  const combinedRides = [
    ...rides.map((r) => ({
      id: r.id,
      type: 'Oferta' as const,
      title: r.title,
      zone: r.zone,
      author: (r as any).driverName || (r as any).driver || 'Aluno',
      time: r.time,
      raw: r,
    })),
    ...rideRequests.map((r) => ({
      id: r.id,
      type: 'Pedido' as const,
      title: 'Buscando carona',
      zone: r.zone,
      author: (r as any).requesterName || 'Aluno',
      time: '-',
      raw: r,
    })),
  ]

  async function handleConsultarItem(item: LostItem) {
    await Swal.fire({
      title: 'Detalhes do Item Perdido',
      width: 650,
      customClass: { popup: 'application-popup', confirmButton: 'primary-button' },
      buttonsStyling: false,
      html: `
        <div style="text-align: left;">
          <span class="detail-tag" style="margin-bottom: 8px; display: inline-block;">${item.category}</span>
          <h2 style="margin: 0 0 20px 0; color: #163a54; font-size: 24px;">${item.title}</h2>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
            <div style="background: #f7fafc; padding: 12px; border-radius: 8px;">
              <span style="display: block; font-size: 11px; color: #708d9f; font-weight: bold; text-transform: uppercase;">Local Encontrado</span>
              <strong style="color: #163a54; font-size: 14px; display: block; margin-top: 4px;">${item.place}</strong>
            </div>
            <div style="background: #f7fafc; padding: 12px; border-radius: 8px;">
              <span style="display: block; font-size: 11px; color: #708d9f; font-weight: bold; text-transform: uppercase;">Data do Registro</span>
              <strong style="color: #163a54; font-size: 14px; display: block; margin-top: 4px;">${item.date}</strong>
            </div>
            <div style="background: #f7fafc; padding: 12px; border-radius: 8px;">
              <span style="display: block; font-size: 11px; color: #708d9f; font-weight: bold; text-transform: uppercase;">Quem Encontrou</span>
              <strong style="color: #163a54; font-size: 14px; display: block; margin-top: 4px;">${item.foundBy || 'Não informado'}</strong>
            </div>
            <div style="background: #f7fafc; padding: 12px; border-radius: 8px;">
              <span style="display: block; font-size: 11px; color: #708d9f; font-weight: bold; text-transform: uppercase;">Contato / Detalhes</span>
              <strong style="color: #163a54; font-size: 14px; display: block; margin-top: 4px;">${item.contact || 'Ver na recepção'}</strong>
            </div>
          </div>

          <div style="background: #f7fafc; padding: 16px; border-radius: 8px; margin-bottom: 16px; border: 1px solid #e3edf3;">
            <span style="display: block; font-size: 11px; color: #708d9f; font-weight: bold; text-transform: uppercase; margin-bottom: 8px;">Descrição do Objeto</span>
            <p style="color: #466579; font-size: 14px; margin: 0; line-height: 1.6; white-space: pre-wrap;">${item.description || 'Nenhuma descrição detalhada.'}</p>
          </div>
          
          <div style="background: #f7fafc; padding: 12px; border-radius: 8px;">
            <span style="display: block; font-size: 11px; color: #708d9f; font-weight: bold; text-transform: uppercase;">Status Atual</span>
            <strong style="color: #15803d; font-size: 14px; display: block; margin-top: 4px;">${item.status || 'Aguardando Retirada'}</strong>
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
        title: 'Detalhes Completo da Oferta',
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
                <strong style="color: #163a54; font-size: 14px; display: block; margin-top: 4px;">${ride.driver || 'Não informado'}</strong>
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
                <span style="display: block; font-size: 11px; color: #708d9f; font-weight: bold; text-transform: uppercase;">Horário de Saída</span>
                <strong style="color: #163a54; font-size: 14px; display: block; margin-top: 4px;">${ride.time}</strong>
              </div>
              <div style="background: #f7fafc; padding: 12px; border-radius: 8px;">
                <span style="display: block; font-size: 11px; color: #708d9f; font-weight: bold; text-transform: uppercase;">WhatsApp</span>
                <strong style="color: #163a54; font-size: 14px; display: block; margin-top: 4px;">${ride.whatsapp}</strong>
              </div>
            </div>

            <div style="background: #f7fafc; padding: 16px; border-radius: 8px; margin-bottom: 16px; border: 1px solid #e3edf3;">
              <span style="display: block; font-size: 11px; color: #708d9f; font-weight: bold; text-transform: uppercase; margin-bottom: 8px;">Ponto de Encontro</span>
              <p style="color: #466579; font-size: 14px; margin: 0; line-height: 1.5;">${ride.meeting}</p>
            </div>

            <div style="background: #f7fafc; padding: 16px; border-radius: 8px;">
              <span style="display: block; font-size: 11px; color: #708d9f; font-weight: bold; text-transform: uppercase; margin-bottom: 8px;">Dias de Circulação</span>
              <p style="color: #466579; font-size: 14px; margin: 0; line-height: 1.5;">${ride.weekdays || 'Não informado'}</p>
            </div>
          </div>
        `,
        confirmButtonText: 'Fechar',
      })
    } else {
      const req = item.raw;
      await Swal.fire({
        title: 'Detalhes Completo do Pedido de Carona',
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
                <span style="display: block; font-size: 11px; color: #708d9f; font-weight: bold; text-transform: uppercase;">WhatsApp do Passageiro</span>
                <strong style="color: #163a54; font-size: 14px; display: block; margin-top: 4px;">${req.requesterWhatsapp}</strong>
              </div>
              <div style="background: #f7fafc; padding: 12px; border-radius: 8px;">
                <span style="display: block; font-size: 11px; color: #708d9f; font-weight: bold; text-transform: uppercase;">Data de Solicitação</span>
                <strong style="color: #163a54; font-size: 14px; display: block; margin-top: 4px;">${req.createdAt || 'Não informada'}</strong>
              </div>
              <div style="background: #f7fafc; padding: 12px; border-radius: 8px;">
                <span style="display: block; font-size: 11px; color: #708d9f; font-weight: bold; text-transform: uppercase;">Status do Pedido</span>
                <strong style="color: #163a54; font-size: 14px; display: block; margin-top: 4px;">${req.status}</strong>
              </div>
            </div>

            <div style="background: #f7fafc; padding: 16px; border-radius: 8px; margin-bottom: 16px; border: 1px solid #e3edf3;">
              <span style="display: block; font-size: 11px; color: #708d9f; font-weight: bold; text-transform: uppercase; margin-bottom: 8px;">Endereço de Embarque</span>
              <p style="color: #466579; font-size: 14px; margin: 0; line-height: 1.5;">${req.pickupAddress}</p>
            </div>

            <div style="background: #f7fafc; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
              <span style="display: block; font-size: 11px; color: #708d9f; font-weight: bold; text-transform: uppercase; margin-bottom: 8px;">Dias Necessários</span>
              <p style="color: #466579; font-size: 14px; margin: 0; line-height: 1.5;">${req.weekdays || 'Não informado'}</p>
            </div>
            
            ${req.notes ? `
            <div style="background: #f7fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <span style="display: block; font-size: 11px; color: #708d9f; font-weight: bold; text-transform: uppercase; margin-bottom: 8px;">Observações Complementares</span>
              <p style="color: #466579; font-size: 14px; margin: 0; line-height: 1.5;">${req.notes}</p>
            </div>
            ` : ''}
          </div>
        `,
        confirmButtonText: 'Fechar',
      })
    }
  }

  async function handleReviewReport(report: Report) {
    const isClosed = String(report.status) === 'Resolvida' || String(report.status) === 'Encerrada'; 
    const statusColor = isClosed ? '#15803d' : '#b45309';
    const statusBg = isClosed ? '#dcfce7' : '#fef3c7';
    const statusText = isClosed ? 'Encerrada' : 'Em Análise';

    await Swal.fire({
      title: 'Detalhes da Denúncia',
      width: 650,
      customClass: { popup: 'application-popup', confirmButton: 'primary-button' },
      buttonsStyling: false,
      html: `
        <div style="text-align: left;">
          <span class="detail-tag" style="margin-bottom: 8px; display: inline-block; background: ${statusBg}; color: ${statusColor};">
            ${statusText}
          </span>
          <h2 style="margin: 0 0 20px 0; color: #163a54; font-size: 24px;">${report.title}</h2>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
             <div style="background: #f7fafc; padding: 12px; border-radius: 8px;">
              <span style="display: block; font-size: 11px; color: #708d9f; font-weight: bold; text-transform: uppercase;">Data de Registro</span>
              <strong style="color: #163a54; font-size: 14px; display: block; margin-top: 4px;">${report.createdAt || 'Não informada'}</strong>
            </div>
            <div style="background: #f7fafc; padding: 12px; border-radius: 8px;">
              <span style="display: block; font-size: 11px; color: #708d9f; font-weight: bold; text-transform: uppercase;">Status</span>
              <strong style="color: ${statusColor}; font-size: 14px; display: block; margin-top: 4px;">${statusText}</strong>
            </div>
          </div>

          <div style="background: #f7fafc; padding: 16px; border-radius: 8px; border: 1px solid #e3edf3;">
            <span style="display: block; font-size: 11px; color: #708d9f; font-weight: bold; text-transform: uppercase; margin-bottom: 8px;">Detalhes e Evidências</span>
            <p style="color: #466579; font-size: 14px; margin: 0; line-height: 1.6; white-space: pre-wrap;">${report.detail || 'Nenhum detalhe fornecido.'}</p>
          </div>
        </div>
      `,
      confirmButtonText: 'Fechar',
    })
  }

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

  async function handleDeleteReport(report: Report) {
    const user = JSON.parse(localStorage.getItem('central-academica-utp:session-user') || '{}');
    if (!user.id) return;
    
    const result = await Swal.fire({
      width: 400,
      padding: '30px',
      showConfirmButton: false,
      showCancelButton: false,
      customClass: { popup: 'application-popup' },
      html: `
        <div style="text-align: center;">
          <div style="font-size: 50px; margin-bottom: 15px;">⚠️</div>
          <h3 style="margin: 0 0 10px 0; color: #1e293b; font-size: 22px; font-weight: bold;">Excluir denúncia?</h3>
          <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 15px; line-height: 1.5;">
            Você está prestes a remover permanentemente a denúncia <strong>"${report.title}"</strong>. Esta ação não pode ser desfeita.
          </p>
          <div style="display: flex; gap: 16px; justify-content: center; align-items: center;">
            <button id="custom-cancel-btn" class="ghost-button" style="margin: 0; cursor: pointer;">
              Cancelar
            </button>
            <button id="custom-confirm-btn" class="primary-button" style="background-color: #dc2626; color: white; border: none; margin: 0; cursor: pointer;">
              Excluir agora
            </button>
          </div>
        </div>
      `,
      didOpen: () => {
        document.getElementById('custom-confirm-btn')?.addEventListener('click', () => {
          Swal.clickConfirm();
        });
        document.getElementById('custom-cancel-btn')?.addEventListener('click', () => {
          Swal.clickCancel();
        });
      }
    });

    if (result.isConfirmed) {
      try {
        await requestJson(`/api/reports/${report.id}?userId=${user.id}&role=${user.role}`, { method: 'DELETE' });
        onRefresh();
      } catch (error) {
        Swal.fire('Erro!', 'Ocorreu um problema ao tentar apagar a denúncia.', 'error');
      }
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
      
      <section className="admin-dashboard" aria-label="Resumo operacional da administracao">
        <div className="admin-kpi-grid">
          <article className="admin-kpi">
            <span>Pendencias operacionais</span>
            <strong>{operationalBacklog}</strong>
            <p>{pendingCount + reviewCount} no mural e {openReportsCount} denuncia(s) aberta(s).</p>
          </article>
          <article className="admin-kpi">
            <span>Mobilidade ativa</span>
            <strong>{activeRidesCount + openRideRequestsCount}</strong>
            <p>{activeRidesCount} oferta(s) e {openRideRequestsCount} pedido(s) aguardando atendimento.</p>
          </article>
          <article className="admin-kpi">
            <span>Interesses em vagas</span>
            <strong>{dashboard.jobInterestsCount}</strong>
            <p>{dashboard.sentEmailsCount} e-mail(s) encaminhado(s) aos estudantes.</p>
          </article>
          <article className="admin-kpi">
            <span>Itens recuperados</span>
            <strong>{dashboard.recoveredLostItemsCount}</strong>
            <p>{lostItems.length} registro(s) ainda ativos em achados e perdidos.</p>
          </article>
        </div>

        <div className="admin-dashboard-grid">
          <article className="admin-dashboard-panel">
            <div className="admin-dashboard-heading">
              <div>
                <span>Moderacao do mural</span>
                <h3>Situacao das publicacoes</h3>
              </div>
            </div>
            <div className="admin-publication-chart">
              <div
                className={`admin-donut-chart${moderationQueue.length === 0 ? ' is-empty' : ''}`}
                style={{
                  '--approved-angle': `${approvedAngle}deg`,
                  '--review-angle': `${reviewAngle}deg`,
                } as CSSProperties}
                role="img"
                aria-label={`${approvedCount} aprovadas, ${reviewCount} em revisao e ${pendingCount} pendentes`}
              >
                <div className="admin-donut-center">
                  <strong>{moderationQueue.length}</strong>
                  <span>publicacoes</span>
                </div>
              </div>
              <div className="admin-chart-legend">
                <div>
                  <span className="admin-status-dot is-approved" />
                  <div><span>Aprovadas</span><small>{approvedPercentage}% do total</small></div>
                  <strong>{approvedCount}</strong>
                </div>
                <div>
                  <span className="admin-status-dot is-review" />
                  <div><span>Em revisao</span><small>{reviewPercentage}% do total</small></div>
                  <strong>{reviewCount}</strong>
                </div>
                <div>
                  <span className="admin-status-dot is-pending" />
                  <div><span>Pendentes</span><small>{pendingPercentage}% do total</small></div>
                  <strong>{pendingCount}</strong>
                </div>
              </div>
            </div>
          </article>

          <article className="admin-dashboard-panel">
            <div className="admin-dashboard-heading">
              <div>
                <span>Volume por area</span>
                <h3>Operacao do portal</h3>
              </div>
            </div>
            <div className="admin-volume-list">
              {operationRows.map((item) => (
                <div key={item.label} className="admin-volume-row">
                  <div><span>{item.label}</span><strong>{item.value}</strong></div>
                  <div className="admin-volume-track">
                    <span className={`is-${item.tone}`} style={{ width: `${(item.value / operationMax) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="admin-dashboard-panel admin-email-panel">
            <div className="admin-dashboard-heading">
              <div>
                <span>Oportunidades</span>
                <h3>Entrega de e-mails</h3>
              </div>
            </div>
            <div className="admin-email-content">
              <div
                className="admin-rate-ring"
                style={{ '--rate': `${emailDeliveryRate * 3.6}deg` } as CSSProperties}
                aria-label={`${emailDeliveryRate}% dos interesses tiveram e-mail enviado`}
              >
                <div><strong>{emailDeliveryRate}%</strong><span>entregues</span></div>
              </div>
              <div className="admin-email-summary">
                <div><span>Interesses registrados</span><strong>{dashboard.jobInterestsCount}</strong></div>
                <div><span>E-mails enviados</span><strong>{dashboard.sentEmailsCount}</strong></div>
                <div><span>Pendentes ou com falha</span><strong>{Math.max(dashboard.jobInterestsCount - dashboard.sentEmailsCount, 0)}</strong></div>
              </div>
            </div>
          </article>

          <article className="admin-dashboard-panel">
            <div className="admin-dashboard-heading">
              <div>
                <span>Leitura rapida</span>
                <h3>Atencao administrativa</h3>
              </div>
            </div>
            <div className="admin-attention-list">
              <div><span>Denuncias abertas</span><strong>{openReportsCount}</strong><small>{resolvedReportsCount} resolvida(s)</small></div>
              <div><span>Pedidos aceitos</span><strong>{acceptedRideRequestsCount}</strong><small>de {rideRequests.length} pedido(s)</small></div>
              <div><span>Caronas encerradas</span><strong>{dashboard.closedRidesCount}</strong><small>historico operacional</small></div>
              <div><span>Categoria em destaque</span><strong>{topCategories[0]?.[0] ?? 'Sem dados'}</strong><small>{topCategories[0]?.[1] ?? 0} publicacao(oes)</small></div>
            </div>
          </article>
        </div>
      </section>
      
      <div className="moderation-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <section className="moderation-card moderation-table-card">
            <div className="moderation-card-header"><div><h3>Fila de Aprovação do Mural</h3></div></div>
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
                    {item.status !== 'Aprovado' && (
                      <button type="button" title="Aprovar" style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#15803d' }} onClick={() => onModerate('Aprovado', item)}>
                        <CheckIcon />
                      </button>
                    )}
                    <button type="button" title="Revisar" style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0369a1' }} onClick={() => onModerate('Revisao', item)}>
                      <EyeIcon />
                    </button>
                    <button type="button" title="Excluir" style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }} onClick={() => onDelete(item)}>
                      <TrashIcon />
                    </button>
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
                  
                  <div className="row-actions" style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', gap: '8px', justifyContent: 'center' }}>
                    <button type="button" title="Revisar" style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0369a1' }} onClick={() => void handleReviewRide(item)}>
                      <EyeIcon />
                    </button>
                    <button type="button" title="Excluir" style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }} onClick={() => onDeleteRideItem(item.id, item.type, item.title)}>
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="moderation-side">
          <section className="moderation-card">
            <div className="moderation-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><h3 style={{ margin: 0 }}>Achados e Perdidos</h3></div>
             <button 
                type="button" 
                className="primary-button" 
                style={{ 
                  padding: '6px 0', 
                  fontSize: '13px', 
                  width: '140px', 
                  margin: '0 14px 0 0', 
                  display: 'flex', 
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: 'fit-content'
                }} 
                onClick={onOpenLostItemModal}
              >
                Registrar Item
              </button>
            </div>
            <div className="lost-admin-list">
              {lostItems.map((item) => (
                <article key={item.id} className="lost-admin-item">
                  <div><strong>{item.title}</strong><small>{item.date}</small></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                    
              
                    <button 
                      type="button" 
                      className="status-pill status-success" 
                      style={{ 
                        cursor: 'pointer', 
                        border: '1px solid #15803d', 
                        margin: 0, 
                        width: '140px',
                        padding: '4px 0', 
                        display: 'flex', 
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: 'fit-content'
                      }} 
                      onClick={() => onMarkLostItemRecovered(item)}
                    >
                      Marcar recuperado
                    </button>

                    <button 
                      type="button" 
                      style={{ 
                        margin: 0, 
                        padding: '4px 0', 
                        fontSize: '13px', 
                        cursor: 'pointer', 
                        backgroundColor: '#ffffff', 
                        border: '1px solid #cbd5e1', 
                        borderRadius: '6px', 
                        color: '#475569',
                        width: '140px',
                        display: 'flex', 
                        justifyContent: 'center',
                        alignItems: 'center',
                        fontWeight: 'bold',
                        height: 'fit-content'
                      }} 
                      onClick={() => void handleConsultarItem(item)}
                    >
                      Ver detalhes
                    </button>

                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="moderation-card">
            <div className="moderation-card-header"><h3>Alertas de Segurança</h3></div>
            <div className="report-list">
              {reports.map((report) => (
                <article key={report.id} style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <strong style={{ fontSize: '14px', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '60%' }}>{report.title}</strong>
                    <span className="status-pill" style={{ backgroundColor: String(report.status) === 'Aberta' ? '#fef3c7' : '#dcfce7', color: String(report.status) === 'Aberta' ? '#b45309' : '#15803d', fontSize: '11px', fontWeight: 'bold', margin: 0 }}>
                      {String(report.status) === 'Aberta' ? 'Em Análise' : 'Encerrada'}
                    </span>
                  </div>
                  <p style={{ color: '#475569', fontSize: '13px', marginBottom: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{report.detail}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <small style={{ color: '#94a3b8' }}>{report.createdAt}</small>
                    
                    <div className="row-actions" style={{ display: 'flex', gap: '8px' }}>
                      <button type="button" title="Revisar" style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0369a1' }} onClick={() => void handleReviewReport(report)}>
                        <EyeIcon />
                      </button>
                      
                      {String(report.status) === 'Aberta' && (
                        <button type="button" title="Encerrar" style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#15803d' }} onClick={() => handleResolveReport(report.id)}>
                          <CheckIcon />
                        </button>
                      )}
                      
                      <button type="button" title="Excluir" style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }} onClick={() => void handleDeleteReport(report)}>
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </section>
  )
}


