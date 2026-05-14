import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import Swal from 'sweetalert2'
import { WhatsAppIcon, InfoIcon, PencilIcon, TrashIcon } from '../components/icons'
import { showWhatsAppContactModal, toast } from '../lib/alerts'
import { formatPhoneInput } from '../lib/phone'
import type {
  RideHotspot,
  RideInterest,
  RideOffer,
  RideRequest,
  RideRequestForm,
} from '../types/app'

type RidesViewProps = {
  currentUserId: number
  rides: RideOffer[]
  rideHotspots: RideHotspot[]
  rideRequestsInbox: RideRequest[]
  rideInterestsInbox: RideInterest[]
  onOpenRideModal: () => void
  onEditRide: (ride: RideOffer) => void
  onCreateRideRequest: (zone: string, payload: RideRequestForm) => Promise<void>
  onUpdateRideRequest: (requestId: number, zone: string, payload: RideRequestForm) => Promise<void>
  onCloseRide: (rideId: number) => Promise<void>
  onDeclareRideInterest: (rideId: number, payload: RideRequestForm) => Promise<void>
  onAcceptRideRequest: (requestId: number) => Promise<void>
  onDeleteRideRequest: (requestId: number) => Promise<void>
}

export function RidesView({
  currentUserId,
  rides,
  rideHotspots,
  rideRequestsInbox,
  rideInterestsInbox,
  onOpenRideModal,
  onEditRide,
  onCreateRideRequest,
  onUpdateRideRequest,
  onCloseRide,
  onDeclareRideInterest,
  onAcceptRideRequest,
  onDeleteRideRequest,
}: RidesViewProps) {
  const weekdayOptions = ['Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta']
  const safeRides = rides ?? []
  const safeRideRequestsInbox = rideRequestsInbox ?? []
  const safeRideInterestsInbox = rideInterestsInbox ?? []
  const availableZones = [
    ...new Set([...safeRides.map((ride) => ride.zone?.trim()), ...(rideHotspots ?? []).map((spot) => spot.id)].filter(Boolean)),
  ] as string[]
  const [selectedZone, setSelectedZone] = useState<string>(availableZones[0] ?? 'Centro')
  const [rideSearch, setRideSearch] = useState('')
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)
  const [requestForm, setRequestForm] = useState<RideRequestForm>({ whatsapp: '', pickupAddress: '' })
  const [selectedWeekdays, setSelectedWeekdays] = useState<string[]>([])
  const [editingRequestId, setEditingRequestId] = useState<number | null>(null)

  useEffect(() => {
    if (!selectedZone && availableZones[0]) {
      setSelectedZone(availableZones[0])
    }
  }, [availableZones, selectedZone])

  const normalizedSearch = rideSearch.trim().toLowerCase()
  const filteredRides = safeRides.filter((ride) => {
    if (ride.status !== 'Ativa') {
      return false
    }

    if (!normalizedSearch) {
      return true
    }

    return [ride.zone, ride.title, ride.driver, ride.vehicle]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(normalizedSearch))
  })
  const openRideRequests = safeRideRequestsInbox.filter((request) => request.status === 'Aberto')
  const myRideRequests = safeRideRequestsInbox.filter((request) => request.requesterId === currentUserId)
  const myActiveRideRequests = myRideRequests.filter((request) => ['Aberto', 'Aceito'].includes(request.status))
  const hasReachedRideRequestLimit = myActiveRideRequests.length >= 2

  function handleToggleWeekday(day: string) {
    setSelectedWeekdays((current) =>
      current.includes(day) ? current.filter((value) => value !== day) : [...current, day],
    )
  }

  function handleToggleAllWeekdays() {
    setSelectedWeekdays((current) => (current.length === weekdayOptions.length ? [] : [...weekdayOptions]))
  }

  function handleCloseRequestModal() {
    setIsRequestModalOpen(false)
    setEditingRequestId(null)
    setRequestForm({ whatsapp: '', pickupAddress: '' })
    setSelectedWeekdays([])
  }

  async function handleTalkToDriver(ride: RideOffer) {
    await showWhatsAppContactModal({
      title: 'Contato do motorista',
      personName: ride.driver,
      phone: `WhatsApp: ${ride.whatsapp}`,
      detail: `Endereco informado: ${ride.meeting}`,
      buttonLabel: 'Abrir conversa no WhatsApp',
      message: `Oi, ${ride.driver}! Vi sua carona "${ride.title}" no portal da UTP e gostaria de combinar.`,
    })
  }

  async function handleSubmitRideRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!requestForm.whatsapp.trim() || !requestForm.pickupAddress.trim()) {
      await Swal.fire({
        icon: 'warning',
        title: 'Campos obrigatorios',
        text: 'Informe seu WhatsApp e endereco para solicitar a carona.',
        confirmButtonText: 'Corrigir',
      })
      return
    }

    if (selectedWeekdays.length === 0) {
      await Swal.fire({
        icon: 'warning',
        title: 'Campos obrigatorios',
        text: 'Selecione pelo menos um dia da semana para a carona.',
        confirmButtonText: 'Corrigir',
      })
      return
    }

    if (hasReachedRideRequestLimit) {
      await Swal.fire({
        icon: 'info',
        title: 'Limite atingido',
        text: 'Voce ja possui 2 pedidos de carona ativos no momento.',
        confirmButtonText: 'Fechar',
      })
      return
    }

    try {
      const payload = {
        ...requestForm,
        weekdays: selectedWeekdays,
      }

      if (editingRequestId) {
        await onUpdateRideRequest(editingRequestId, selectedZone, payload)
      } else {
        await onCreateRideRequest(selectedZone, payload)
      }

      handleCloseRequestModal()
      await Swal.fire({
        icon: 'success',
        title: editingRequestId ? 'Pedido de carona atualizado' : 'Pedido de carona publicado',
        html: `${editingRequestId ? 'Seu pedido foi atualizado' : 'Seu pedido ficou visivel para todos os usuarios'} na zona <strong>${selectedZone}</strong>.${selectedWeekdays.length ? `<br /><br />Dias selecionados: <strong>${selectedWeekdays.join(', ')}</strong>.` : ''}`,
        confirmButtonText: 'Fechar',
      })
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Falha ao solicitar carona',
        text: error instanceof Error ? error.message : 'Nao foi possivel enviar a solicitacao.',
        confirmButtonText: 'Fechar',
      })
    }
  }

  async function handleCloseRide(ride: RideOffer) {
    const result = await Swal.fire({
      icon: 'question',
      title: 'Encerrar vaga?',
      text: `A carona "${ride.title}" sera marcada como encerrada.`,
      showCancelButton: true,
      confirmButtonText: 'Encerrar',
      cancelButtonText: 'Cancelar',
    })

    if (!result.isConfirmed) return

    await onCloseRide(ride.id)
    await toast.fire({ icon: 'success', title: 'Vaga encerrada.' })
  }

  async function handleAcceptRideRequest(request: RideRequest) {
    await onAcceptRideRequest(request.id)

    await showWhatsAppContactModal({
      title: 'Pedido de carona aceito',
      personName: request.requesterName,
      phone: `WhatsApp do solicitante: ${request.requesterWhatsapp}`,
      detail: `Endereco informado: ${request.pickupAddress}`,
      buttonLabel: 'Conversar no WhatsApp',
      message: `Oi, ${request.requesterName}! Vi seu pedido de carona para ${request.zone} no portal da UTP e posso atender.`,
    })
  }

  async function handleDeclareRideInterest(ride: RideOffer) {
    const result = await Swal.fire({
      title: 'Declarar interesse na vaga',
      html: `
        <div class="swal-inline-form">
          <input id="ride-interest-whatsapp" class="swal2-input" placeholder="Seu WhatsApp" />
          <textarea id="ride-interest-address" class="swal2-textarea" placeholder="Seu endereco ou ponto de embarque"></textarea>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Enviar interesse',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const whatsapp = (document.getElementById('ride-interest-whatsapp') as HTMLInputElement | null)?.value.trim() ?? ''
        const pickupAddress = (document.getElementById('ride-interest-address') as HTMLTextAreaElement | null)?.value.trim() ?? ''

        if (!whatsapp || !pickupAddress) {
          Swal.showValidationMessage('Preencha seu WhatsApp e endereco para registrar o interesse.')
          return null
        }

        return { whatsapp, pickupAddress }
      },
    })

    if (!result.isConfirmed || !result.value) {
      return
    }

    await onDeclareRideInterest(ride.id, result.value)
    await toast.fire({ icon: 'success', title: 'Interesse enviado ao motorista.' })
  }

  async function handleContactAcceptedDriver(request: RideRequest) {
    if (!request.acceptedByWhatsapp || !request.acceptedByName) {
      await Swal.fire({
        icon: 'info',
        title: 'Contato ainda indisponivel',
        text: 'O motorista ainda nao informou um numero de WhatsApp para essa carona.',
        confirmButtonText: 'Fechar',
      })
      return
    }

    await showWhatsAppContactModal({
      title: 'Motorista que aceitou',
      personName: request.acceptedByName,
      phone: `WhatsApp do motorista: ${request.acceptedByWhatsapp}`,
      detail: `Zona solicitada: ${request.zone} • Embarque: ${request.pickupAddress}`,
      buttonLabel: 'Falar com o motorista',
      message: `Oi, ${request.acceptedByName}! Vi que voce aceitou meu pedido de carona para ${request.zone} no portal da UTP.`,
    })
  }

  async function handleDeleteRideRequest(request: RideRequest) {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Excluir pedido de carona?',
      text: `O pedido para ${request.zone} sera removido da lista.`,
      showCancelButton: true,
      confirmButtonText: 'Excluir',
      cancelButtonText: 'Cancelar',
    })

    if (!result.isConfirmed) {
      return
    }

    await onDeleteRideRequest(request.id)
    await toast.fire({ icon: 'success', title: 'Pedido excluido com sucesso.' })
  }

  function handleStartRequestCreation() {
    setEditingRequestId(null)
    setSelectedZone(availableZones[0] ?? 'Centro')
    setRequestForm({ whatsapp: '', pickupAddress: '' })
    setSelectedWeekdays([])
    setIsRequestModalOpen(true)
  }

  function handleStartRequestEdit(request: RideRequest) {
    setEditingRequestId(request.id)
    setSelectedZone(request.zone)
    setRequestForm({
      whatsapp: request.requesterWhatsapp,
      pickupAddress: request.pickupAddress,
    })
    setSelectedWeekdays(
      request.weekdays
        .split(',')
        .map((value) => value.trim())
        .filter((value) => value && value !== 'Nao informado'),
    )
    setIsRequestModalOpen(true)
  }

  return (
    <section className="page-section rides-section">
      <div className="page-heading">
        <div>
          <h2>Caronas</h2>
          <p>Consulte todas as caronas abertas e use a busca para encontrar bairros, motoristas ou rotas.</p>
        </div>
      </div>
      <article className="rides-disclaimer" role="note" aria-label="Aviso importante sobre caronas">
        <div className="rides-disclaimer-icon"><InfoIcon /></div>
        <div className="rides-disclaimer-content">
          <strong>Aviso importante</strong>
          <p>
            A plataforma de caronas existe para aproximar alunos que oferecem e procuram trajetos.
            Horarios, valores, pontos de encontro e demais combinacoes sao definidos diretamente entre
            os participantes, sem intermediacao ou responsabilidade da instituicao.
          </p>
        </div>
      </article>
      <section className="rides-action-hero" aria-label="Acoes principais de carona">
        <div className="rides-action-copy">
          <span className="detail-tag">Fluxo rapido</span>
          <h3>Encontre ou publique uma carona em poucos cliques</h3>
          <p>
            Abra um pedido publico se voce precisa de ajuda, ou publique sua rota para receber interessados.
            O contato com WhatsApp continua dentro do fluxo de cada carona.
          </p>
        </div>
        <div className="rides-action-buttons">
          <button className="ride-hero-button ride-hero-button-primary" type="button" onClick={handleStartRequestCreation}>
            <span className="ride-hero-button-label">Preciso de carona</span>
            <strong>Solicitar carona</strong>
          </button>
          <button className="ride-hero-button ride-hero-button-secondary" type="button" onClick={onOpenRideModal}>
            <span className="ride-hero-button-label">Tenho vagas no carro</span>
            <strong>Oferecer carona</strong>
          </button>
        </div>
      </section>
      <div className="rides-hero">
        <div className="rides-summary-card"><span>Rotas abertas</span><strong>{safeRides.filter((ride) => ride.status === 'Ativa').length}</strong><p>Caronas disponiveis no sistema neste momento.</p></div>
        <div className="rides-summary-card"><span>Destino padrao</span><strong>Campus UTP</strong><p>Rotas focadas no periodo noturno com ponto de encontro definido.</p></div>
        <div className="rides-summary-card"><span>Pedidos publicos</span><strong>{openRideRequests.length}</strong><p>Solicitacoes visiveis para todos os usuarios.</p></div>
      </div>
      <div className="rides-grid">
        <div className="rides-search-panel">
          <div className="rides-search-panel-header">
            <div>
              <h3>Buscar caronas abertas</h3>
              <p>Pesquise por bairro, motorista, rota, veiculo ou horario para localizar a melhor opcao.</p>
            </div>
            <span className="map-legend">Busca atual: {rideSearch || 'Todas as caronas'}</span>
          </div>
          <div className="rides-search-bar">
            <input
              type="text"
              placeholder="Buscar por bairro, motorista, rota ou veiculo"
              value={rideSearch}
              onChange={(event) => setRideSearch(event.target.value)}
            />
            <span>{filteredRides.length} resultado(s)</span>
          </div>
        </div>
        <div className="rides-list-panel">
          <div className="rides-list-header"><h3>Rotas disponiveis</h3><p>{normalizedSearch ? `Resultados para "${rideSearch}"` : 'Todas as caronas abertas e cadastradas'}</p></div>
          <div className="rides-list">
            {filteredRides.map((ride) => (
              <article key={ride.id} className="ride-card ride-card-enhanced">
                <div className="ride-card-header">
                  <div><h3>{ride.title}</h3><p>{ride.driver}</p></div>
                  <span className="ride-badge">{ride.status === 'Ativa' ? ride.seats : ride.status}</span>
                </div>
                <div className="ride-meta-grid">
                  <div><span className="ride-meta-label">Saida</span><strong>{ride.time}</strong></div>
                  <div><span className="ride-meta-label">Endereco</span><strong>{ride.meeting}</strong></div>
                  <div><span className="ride-meta-label">Veiculo</span><strong>{ride.vehicle}</strong></div>
                </div>
                <div className="ride-meta-grid">
                  <div><span className="ride-meta-label">WhatsApp</span><strong>{ride.whatsapp}</strong></div>
                  <div><span className="ride-meta-label">Dias</span><strong>{ride.weekdays}</strong></div>
                  <div><span className="ride-meta-label">Motorista</span><strong>{ride.driver}</strong></div>
                </div>
                <div className="ride-meta-grid">
                  <div><span className="ride-meta-label">Solicitacoes</span><strong>{ride.requestCount}</strong></div>
                  <div><span className="ride-meta-label">Status</span><strong>{ride.status}</strong></div>
                  <div><span className="ride-meta-label">Zona</span><strong>{ride.zone}</strong></div>
                </div>
                {ride.driverId === currentUserId ? (
                  <div className="row-actions">
                    <button type="button" onClick={() => onEditRide(ride)}>Editar oferta</button>
                    <button type="button" onClick={() => void handleCloseRide(ride)}>Encerrar vaga</button>
                  </div>
                ) : (
                  <div className="ride-contact-actions">
                    <button className="primary-button" type="button" disabled={ride.status !== 'Ativa'} onClick={() => void handleTalkToDriver(ride)}>Entrar em contato com motorista</button>
                    <button className="interest-button" type="button" disabled={ride.status !== 'Ativa'} onClick={() => void handleDeclareRideInterest(ride)}>Declarar interesse</button>
                  </div>
                )}
                {ride.driverId === currentUserId ? (
                  <div className="ride-interest-list">
                    <span className="ride-meta-label">Interessados</span>
                    {safeRideInterestsInbox.filter((interest) => interest.rideId === ride.id).length > 0 ? (
                      safeRideInterestsInbox
                        .filter((interest) => interest.rideId === ride.id)
                        .map((interest) => (
                          <div key={interest.id} className="ride-interest-item">
                            <strong>{interest.requesterName}</strong>
                            <span>{interest.requesterWhatsapp}</span>
                            <span>{interest.pickupAddress}</span>
                          </div>
                        ))
                    ) : (
                      <p>Ninguem declarou interesse nessa vaga ainda.</p>
                    )}
                  </div>
                ) : null}
              </article>
            ))}
            {filteredRides.length === 0 ? <article className="ride-card ride-card-enhanced"><h3>Nenhuma carona encontrada</h3><p>Tente buscar por outro bairro, motorista ou veiculo.</p></article> : null}
          </div>
        </div>
      </div>
      <section className="rides-list-panel ride-requests-panel">
        <div className="moderation-card-header">
          <div><h3>Pedidos publicos de carona</h3><p>Solicitacoes abertas para todos os usuarios visualizarem e atenderem.</p></div>
        </div>
        <div className="ride-requests-list">
          {safeRideRequestsInbox.map((request) => (
            <article key={request.id} className="ride-request-card">
              <div className="ride-request-card-header">
                <div>
                  <strong>{request.zone}</strong>
                  <p>{request.createdAt}</p>
                </div>
                <span className={`status-pill ${request.status === 'Aceito' ? 'status-approved' : 'status-pending'}`}>
                  {request.status}
                </span>
              </div>
              <div className="ride-request-meta">
                <div><span className="ride-meta-label">Solicitante</span><strong>{request.requesterName}</strong></div>
                <div><span className="ride-meta-label">WhatsApp</span><strong>{request.requesterWhatsapp}</strong></div>
                <div><span className="ride-meta-label">Endereco</span><strong>{request.pickupAddress}</strong></div>
                <div><span className="ride-meta-label">Dias</span><strong>{request.weekdays}</strong></div>
                <div><span className="ride-meta-label">Atendido por</span><strong>{request.acceptedByName ?? 'Aguardando motorista'}</strong></div>
              </div>
              <div className="row-actions">
                {request.status === 'Aberto' && request.requesterId !== currentUserId ? (
                  <div className="ride-contact-actions">
                    <button type="button" onClick={() => void handleAcceptRideRequest(request)}>Aceitar carona</button>
                  </div>
                ) : request.requesterId === currentUserId ? (
                  <span>Seu pedido</span>
                ) : (
                  <span>Atendido</span>
                )}
              </div>
            </article>
          ))}
          {safeRideRequestsInbox.length === 0 ? <article className="ride-request-card"><strong>Nenhum pedido aberto</strong><p>Assim que um aluno publicar uma solicitacao, ela aparecera aqui.</p></article> : null}
        </div>
      </section>
      {myRideRequests.length > 0 ? (
        <section className="moderation-card">
          <div className="moderation-card-header">
            <div><h3>Meus pedidos de carona</h3><p>Acompanhe seus pedidos e veja o contato de quem aceitou atender.</p></div>
          </div>
          <div className="my-ride-requests-list">
            {myRideRequests.map((request) => (
              <article key={request.id} className="my-ride-request-card">
                <div className="my-ride-request-header">
                  <div className="my-ride-request-title-group">
                    <strong>{request.zone}</strong>
                    <span className={`status-pill ${request.status === 'Aceito' ? 'status-approved' : 'status-pending'}`}>
                      {request.status}
                    </span>
                  </div>
                  <button
                    className="inline-icon-button inline-icon-button-neutral"
                    type="button"
                    aria-label={`Editar pedido de carona para ${request.zone}`}
                    onClick={() => handleStartRequestEdit(request)}
                    disabled={request.status !== 'Aberto'}
                  >
                    <PencilIcon />
                  </button>
                  <button
                    className="inline-icon-button inline-icon-button-danger"
                    type="button"
                    aria-label={`Excluir pedido de carona para ${request.zone}`}
                    onClick={() => void handleDeleteRideRequest(request)}
                  >
                    <TrashIcon />
                  </button>
                </div>
                <p>{request.pickupAddress}</p>
                <p>Dias: {request.weekdays}</p>
                <p>Seu WhatsApp: {request.requesterWhatsapp}</p>
                {request.acceptedByName ? <p>Motorista: {request.acceptedByName}</p> : <p>Aguardando alguem aceitar.</p>}
                {request.acceptedByWhatsapp ? <p>WhatsApp do motorista: {request.acceptedByWhatsapp}</p> : null}
                {request.acceptedByWhatsapp ? (
                  <div className="ride-contact-actions">
                    <button className="primary-button" type="button" onClick={() => void handleContactAcceptedDriver(request)}>
                      Falar com o motorista
                    </button>
                    <button
                      className="whatsapp-icon-button"
                      type="button"
                      aria-label="Abrir o WhatsApp do motorista que aceitou"
                      onClick={() => void handleContactAcceptedDriver(request)}
                    >
                      <WhatsAppIcon />
                    </button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}
      {isRequestModalOpen ? (
        <div className="details-modal-backdrop" onClick={handleCloseRequestModal}>
          <div className="details-modal publish-modal" onClick={(event) => event.stopPropagation()}>
            <div className="details-modal-header">
              <div><span className="detail-tag">Pedir carona</span><h3>Solicitar carona para a zona {selectedZone}</h3></div>
              <button className="ghost-button" type="button" onClick={handleCloseRequestModal}>Fechar</button>
            </div>
            <form className="publish-form" onSubmit={(event) => void handleSubmitRideRequest(event)}>
              <div className="lost-details-grid">
                <div><span className="detail-label">Zona desejada</span><strong>{selectedZone}</strong></div>
              <div><span className="detail-label">Fluxo</span><strong>{editingRequestId ? 'Voce esta editando um pedido ja publicado.' : 'Seu pedido ficara visivel para todos os usuarios.'}</strong></div>
                <div><span className="detail-label">Pedidos ativos</span><strong>{myActiveRideRequests.length}/2 em uso</strong></div>
              </div>
              {hasReachedRideRequestLimit ? (
                <div className="rides-request-limit-warning">
                  Voce atingiu o limite de 2 pedidos de carona ativos. Aguarde um deles ser atendido ou encerrado para abrir outro.
                </div>
              ) : null}
              <label className="form-field">
                <span>Bairro de interesse <em className="required-marker">*</em></span>
                <input type="text" value={selectedZone} onChange={(event) => setSelectedZone(event.target.value)} />
              </label>
              <fieldset className="weekday-fieldset">
                <legend>Dias da semana necessarios <em className="required-marker">*</em></legend>
                <label className="weekday-option weekday-option-all">
                  <input
                    type="checkbox"
                    checked={selectedWeekdays.length === weekdayOptions.length}
                    onChange={handleToggleAllWeekdays}
                  />
                  <span>Selecionar todos</span>
                </label>
                <div className="weekday-grid">
                  {weekdayOptions.map((day) => (
                    <label key={day} className="weekday-option">
                      <input
                        type="checkbox"
                        checked={selectedWeekdays.includes(day)}
                        onChange={() => handleToggleWeekday(day)}
                      />
                      <span>{day}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="form-field">
                <span>Seu WhatsApp <em className="required-marker">*</em></span>
                <input type="text" placeholder="Ex.: (41) 99999-1234" value={requestForm.whatsapp} onChange={(event) => setRequestForm((current) => ({ ...current, whatsapp: formatPhoneInput(event.target.value) }))} />
              </label>
              <label className="form-field">
                <span>Seu endereco de embarque <em className="required-marker">*</em></span>
                <textarea rows={4} placeholder="Ex.: Rua X, numero Y, bairro Z" value={requestForm.pickupAddress} onChange={(event) => setRequestForm((current) => ({ ...current, pickupAddress: event.target.value }))} />
              </label>
             <div>
  <span className="detail-label">Fluxo</span>
  <strong>Quem puder ajudar vai ver seu endereco e seu WhatsApp para combinar a carona.</strong>
</div>

<button 
  className="primary-button" 
  type="submit" 
  style={{ 
    backgroundColor: '#2b5a7a', 
    color: '#ffffff',           
    fontWeight: 'bold',         
    border: '2px solid #1a3b52',
    padding: '12px 24px',       
    borderRadius: '8px',        
    transition: 'all 0.2s'      
  }}
  disabled={!editingRequestId && hasReachedRideRequestLimit}
>
  {editingRequestId ? 'Salvar alteracoes' : 'Publicar pedido'}
</button>

</div>
          </form>
        </div>
        </div>
      ) : null}
    </section>
  )
}
