import type { FormEvent } from 'react'
import type { LostItemForm } from '../../types/app'

type LostItemModalProps = {
  lostItemForm: LostItemForm
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onChange: (value: LostItemForm | ((current: LostItemForm) => LostItemForm)) => void
}

export function LostItemModal({ lostItemForm, onClose, onSubmit, onChange }: LostItemModalProps) {
  return (
    <div className="details-modal-backdrop" onClick={onClose}>
      <div className="details-modal publish-modal" onClick={(event) => event.stopPropagation()}>
        <div className="details-modal-header">
          <div><span className="detail-tag">Achados e Perdidos</span><h3>Registrar item</h3></div>
          <button className="ghost-button" type="button" onClick={onClose}>Fechar</button>
        </div>
        <form className="publish-form" onSubmit={onSubmit}>
          <div className="lost-return-notice lost-return-notice-compact" role="note">
            <strong>Retirada apenas pelo dono do item.</strong>
            <span>Os itens ficam na casinha no estacionamento, proximo a entrada dos blocos A e B.</span>
          </div>
          <label className="form-field">
            <span>Categoria</span>
            <select value={lostItemForm.category} onChange={(event) => onChange((current) => ({ ...current, category: event.target.value }))}>
              <option>Documentos</option>
              <option>Eletronicos</option>
              <option>Mochilas</option>
              <option>Acessorios</option>
              <option>Outros</option>
            </select>
          </label>
          <label className="form-field"><span>Titulo</span><input type="text" placeholder="Ex.: Carteira preta com documentos" value={lostItemForm.title} onChange={(event) => onChange((current) => ({ ...current, title: event.target.value }))} /></label>
          <div className="publish-grid">
            <label className="form-field"><span>Local encontrado</span><input type="text" placeholder="Ex.: Bloco B - Sala 12" value={lostItemForm.place} onChange={(event) => onChange((current) => ({ ...current, place: event.target.value }))} /></label>
            <label className="form-field"><span>Data ou horario</span><input type="text" placeholder="Ex.: Hoje, 18:20" value={lostItemForm.date} onChange={(event) => onChange((current) => ({ ...current, date: event.target.value }))} /></label>
          </div>
          <label className="form-field"><span>Descricao</span><textarea rows={5} placeholder="Descreva o item, caracteristicas e qualquer detalhe util para identificacao." value={lostItemForm.description} onChange={(event) => onChange((current) => ({ ...current, description: event.target.value }))} /></label>
          <label className="form-field"><span>Registrado por</span><input type="text" value={lostItemForm.foundBy} onChange={(event) => onChange((current) => ({ ...current, foundBy: event.target.value }))} /></label>
          <div className="details-modal-footer">
            <div><span className="detail-label">Fluxo</span><strong>O item sera exibido como perdido ate ser marcado internamente como recuperado.</strong></div>
            <button className="primary-button" type="submit">Registrar item</button>
          </div>
        </form>
      </div>
    </div>
  )
}
