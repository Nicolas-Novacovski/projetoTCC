import type { FormEvent } from 'react'
import { formatPhoneInput } from '../../lib/phone'
import type { RideForm } from '../../types/app'

type RideModalProps = {
  rideForm: RideForm
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onChange: (value: RideForm | ((current: RideForm) => RideForm)) => void
  mode?: 'create' | 'edit'
}

export function RideModal({ rideForm, onClose, onSubmit, onChange, mode = 'create' }: RideModalProps) {
  const weekdayOptions = ['Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta']
  const isEditing = mode === 'edit'

  function handleToggleWeekday(day: string) {
    onChange((current) => ({
      ...current,
      weekdays: current.weekdays.includes(day)
        ? current.weekdays.filter((value) => value !== day)
        : [...current.weekdays, day],
    }))
  }

  function handleToggleAllWeekdays() {
    onChange((current) => ({
      ...current,
      weekdays: current.weekdays.length === weekdayOptions.length ? [] : [...weekdayOptions],
    }))
  }

  return (
    <div className="details-modal-backdrop" onClick={onClose}>
      <div className="details-modal publish-modal" onClick={(event) => event.stopPropagation()}>
        <div className="details-modal-header">
          <div><span className="detail-tag">{isEditing ? 'Editar carona' : 'Nova carona'}</span><h3>{isEditing ? 'Atualizar oferta de carona' : 'Oferecer carona'}</h3></div>
          <button className="ghost-button" type="button" onClick={onClose}>Fechar</button>
        </div>
        <form className="publish-form" onSubmit={onSubmit}>
          <div className="publish-grid">
            <label className="form-field">
              <span>Bairro / zona <em className="required-marker">*</em></span>
              <input
                type="text"
                placeholder="Ex.: Santa Felicidade"
                value={rideForm.zone}
                onChange={(event) => onChange((current) => ({ ...current, zone: event.target.value }))}
              />
            </label>
            <label className="form-field">
              <span>Horario de saida <em className="required-marker">*</em></span>
              <input type="time" value={rideForm.departureTime} onChange={(event) => onChange((current) => ({ ...current, departureTime: event.target.value }))} />
            </label>
          </div>
          <label className="form-field">
            <span>Titulo da rota <em className="required-marker">*</em></span>
            <input type="text" placeholder="Ex.: Boqueirao -> Campus UTP" value={rideForm.title} onChange={(event) => onChange((current) => ({ ...current, title: event.target.value }))} />
          </label>
          <div className="publish-grid">
            <label className="form-field">
              <span>Vagas <em className="required-marker">*</em></span>
              <input type="text" placeholder="Ex.: 3 vagas" value={rideForm.seats} onChange={(event) => onChange((current) => ({ ...current, seats: event.target.value }))} />
            </label>
            <label className="form-field">
              <span>Endereco <em className="required-marker">*</em></span>
              <input type="text" placeholder="Ex.: Rua Joao Negrrao, 120" value={rideForm.meetingPoint} onChange={(event) => onChange((current) => ({ ...current, meetingPoint: event.target.value }))} />
            </label>
          </div>
          <label className="form-field">
            <span>WhatsApp do motorista <em className="required-marker">*</em></span>
            <input type="text" placeholder="Ex.: (41) 99999-1234" value={rideForm.whatsapp} onChange={(event) => onChange((current) => ({ ...current, whatsapp: formatPhoneInput(event.target.value) }))} />
          </label>
          <label className="form-field">
            <span>Veiculo <em className="required-marker">*</em></span>
            <input type="text" placeholder="Ex.: Onix prata" value={rideForm.vehicle} onChange={(event) => onChange((current) => ({ ...current, vehicle: event.target.value }))} />
          </label>
          <fieldset className="weekday-fieldset">
            <legend>Dias da semana da rota <em className="required-marker">*</em></legend>
            <label className="weekday-option weekday-option-all">
              <input
                type="checkbox"
                checked={rideForm.weekdays.length === weekdayOptions.length}
                onChange={handleToggleAllWeekdays}
              />
              <span>Selecionar todos</span>
            </label>
            <div className="weekday-grid">
              {weekdayOptions.map((day) => (
                <label key={day} className="weekday-option">
                  <input
                    type="checkbox"
                    checked={rideForm.weekdays.includes(day)}
                    onChange={() => handleToggleWeekday(day)}
                  />
                  <span>{day}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="details-modal-footer">
            <div><span className="detail-label">Destino</span><strong>Campus UTP</strong></div>
            <button className="primary-button" type="submit">{isEditing ? 'Salvar alteracoes' : 'Publicar carona'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
