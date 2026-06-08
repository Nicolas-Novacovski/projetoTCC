import type { FormEvent } from 'react'

export type ReportForm = {
  title: string
  detail: string
}

type ReportModalProps = {
  reportForm: ReportForm
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onChange: (value: ReportForm) => void
}

export function ReportModal({ reportForm, onClose, onSubmit, onChange }: ReportModalProps) {
  return (
    <div className="details-modal-backdrop" onClick={onClose}>
      <div className="details-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="details-modal-header">
          <div>
            <span className="detail-tag" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>Canal de Segurança</span>
            <h3>Registrar Denúncia</h3>
            <p>Relate publicações inadequadas ou irregularidades anonimamente.</p>
          </div>
          <button className="ghost-button" type="button" onClick={onClose}>Fechar</button>
        </div>

        <form className="modal-form" onSubmit={onSubmit} style={{ padding: '20px 30px' }}>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#163a54' }}>
              Motivo ou Título da Denúncia
            </label>
            <input
              type="text"
              placeholder="Ex: Publicação ofensiva, Vaga falsa"
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              value={reportForm.title}
              onChange={(e) => onChange({ ...reportForm, title: e.target.value })}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#163a54' }}>
              Detalhes e Evidências
            </label>
            <textarea
              placeholder="Descreva o que aconteceu com o máximo de detalhes..."
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', minHeight: '120px', fontFamily: 'inherit' }}
              value={reportForm.detail}
              onChange={(e) => onChange({ ...reportForm, detail: e.target.value })}
              required
            />
          </div>

          <div className="details-modal-footer" style={{ marginTop: '20px', padding: '20px 0 0 0', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '12px', color: '#64748b', maxWidth: '300px' }}>
              <strong>SIGILO GARANTIDO:</strong> Sua identidade não será revelada.
            </div>
            <button 
              type="submit" 
              className="primary-button" 
              style={{ backgroundColor: '#dc2626', color: 'white', border: 'none' }}
            >
              Enviar Denúncia
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}