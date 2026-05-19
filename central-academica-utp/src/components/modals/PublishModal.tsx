import type { FormEvent } from 'react'
import type { PublishForm } from '../../types/app'

type PublishModalProps = {
  publishForm: PublishForm
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onChange: (value: PublishForm | ((current: PublishForm) => PublishForm)) => void
}

export function PublishModal({ publishForm, onClose, onSubmit, onChange }: PublishModalProps) {
  return (
    <div className="details-modal-backdrop" onClick={onClose}>
      <div className="details-modal publish-modal" onClick={(event) => event.stopPropagation()}>
        <div className="details-modal-header">
          <div><span className="detail-tag">Novo post</span><h3>Publicar no mural</h3></div>
          <button className="ghost-button" type="button" onClick={onClose}>Fechar</button>
        </div>
        <form className="publish-form" onSubmit={onSubmit}>
          <div className="publish-grid">
            <label className="form-field"><span>Categoria</span><select value={publishForm.category} onChange={(event) => onChange((current) => ({ ...current, category: event.target.value }))}><option>Vaga</option><option>Evento</option><option>Comunicado</option><option>Grupo de estudo</option></select></label>
            <label className="form-field"><span>Local ou empresa</span><input type="text" placeholder="Ex.: Curitiba ou Empresa XPTO" value={publishForm.location} onChange={(event) => onChange((current) => ({ ...current, location: event.target.value }))} /></label>
          </div>
          {publishForm.category === 'Vaga' ? (
            <label className="form-field">
              <span>E-mail de contato da vaga</span>
              <input
                type="email"
                placeholder="Ex.: recrutamento@empresa.com"
                value={publishForm.contactEmail}
                onChange={(event) => onChange((current) => ({ ...current, contactEmail: event.target.value }))}
              />
            </label>
          ) : null}
          <label className="form-field"><span>Titulo</span><input type="text" placeholder="Ex.: Estagio em Desenvolvimento Web" value={publishForm.title} onChange={(event) => onChange((current) => ({ ...current, title: event.target.value }))} /></label>
          <label className="form-field"><span>Descricao</span><textarea rows={6} placeholder="Descreva a oportunidade, evento ou comunicado." value={publishForm.description} onChange={(event) => onChange((current) => ({ ...current, description: event.target.value }))} /></label>
          <div className="details-modal-footer">
            <div><span className="detail-label">Fluxo</span><strong>O post sera enviado para moderacao antes de aparecer no mural.</strong></div>
            <button className="primary-button" type="submit">Enviar publicacao</button>
          </div>
        </form>
      </div>
    </div>
  )
}
