import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import { SearchIcon } from '../components/icons'
import type { LostItem } from '../types/app'

type LostFoundViewProps = {
  lostItems: LostItem[]
  onOpenRegisterModal: () => void
}

export function LostFoundView({ lostItems, onOpenRegisterModal }: LostFoundViewProps) {
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null)
  const [previewItemId, setPreviewItemId] = useState<number>(lostItems[0]?.id ?? 0)

  useEffect(() => {
    if (lostItems[0] && !lostItems.some((item) => item.id === previewItemId)) {
      setPreviewItemId(lostItems[0].id)
    }
  }, [lostItems, previewItemId])

  const previewItem = lostItems.find((item) => item.id === previewItemId) ?? lostItems[0] ?? null
  const selectedItem = lostItems.find((item) => item.id === selectedItemId) ?? null

  async function handleReturnRequest(item: LostItem) {
    await Swal.fire({
      icon: 'success',
      title: 'Solicitacao registrada',
      html: `<strong>${item.title}</strong><br />Entre em contato com: ${item.contact}`,
      confirmButtonText: 'Ok',
    })
  }

  return (
    <section className="page-section lost-found-section">
      <div className="page-heading">
        <div>
          <h2>Achados e Perdidos</h2>
          <p>Itens localizados no campus e registrados para retirada.</p>
        </div>
        <button className="secondary-button" type="button" onClick={onOpenRegisterModal}>
          Registrar item
        </button>
      </div>
      <div className="lost-found-toolbar">
        <span className="filter-chip is-active">Todos</span>
        <span className="filter-chip">Documentos</span>
        <span className="filter-chip">Eletronicos</span>
        <span className="filter-chip">Mochilas</span>
      </div>
      {previewItem ? (
        <div className="lost-found-layout">
          <div className="lost-found-grid">
            {lostItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`lost-card${previewItemId === item.id ? ' is-active' : ''}`}
                onClick={() => setPreviewItemId(item.id)}
              >
                <div className="lost-card-icon">
                  <SearchIcon />
                </div>
                <div className="lost-card-body">
                  <h3>{item.title}</h3>
                  <p>{item.place}</p>
                  <div className="lost-card-meta">
                    <span>{item.date}</span>
                    <span>{item.status}</span>
                  </div>
                </div>
                <span
                  className="lost-card-action"
                  onClick={(event) => {
                    event.stopPropagation()
                    setPreviewItemId(item.id)
                    setSelectedItemId(item.id)
                  }}
                >
                  Ver detalhes
                </span>
              </button>
            ))}
          </div>
          <aside className="lost-details-card">
            <div className="lost-details-header">
              <span className="detail-tag">{previewItem.category}</span>
              <h3>{previewItem.title}</h3>
              <p>{previewItem.description}</p>
            </div>
            <div className="lost-details-grid">
              <div><span className="detail-label">Local</span><strong>{previewItem.place}</strong></div>
              <div><span className="detail-label">Data</span><strong>{previewItem.date}</strong></div>
              <div><span className="detail-label">Status</span><strong>{previewItem.status}</strong></div>
              <div><span className="detail-label">Registrado por</span><strong>{previewItem.foundBy}</strong></div>
            </div>
            <div className="lost-details-footer">
              <div><span className="detail-label">Contato para retirada</span><strong>{previewItem.contact}</strong></div>
              <button className="primary-button" type="button" onClick={() => setSelectedItemId(previewItem.id)}>
                Abrir detalhe completo
              </button>
            </div>
          </aside>
        </div>
      ) : (
        <article className="lost-details-card">
          <h3>Nenhum item registrado</h3>
          <p>Assim que novos registros forem adicionados ao banco, eles vao aparecer aqui.</p>
        </article>
      )}
      {selectedItem ? (
        <div className="details-modal-backdrop" onClick={() => setSelectedItemId(null)}>
          <div className="details-modal" onClick={(event) => event.stopPropagation()}>
            <div className="details-modal-header">
              <div><span className="detail-tag">{selectedItem.category}</span><h3>{selectedItem.title}</h3></div>
              <button className="ghost-button" type="button" onClick={() => setSelectedItemId(null)}>Fechar</button>
            </div>
            <p className="details-modal-description">{selectedItem.description}</p>
            <div className="lost-details-grid">
              <div><span className="detail-label">Local encontrado</span><strong>{selectedItem.place}</strong></div>
              <div><span className="detail-label">Data do registro</span><strong>{selectedItem.date}</strong></div>
              <div><span className="detail-label">Status atual</span><strong>{selectedItem.status}</strong></div>
              <div><span className="detail-label">Registrado por</span><strong>{selectedItem.foundBy}</strong></div>
            </div>
            <div className="details-modal-footer">
              <div><span className="detail-label">Contato</span><strong>{selectedItem.contact}</strong></div>
              <button className="primary-button" type="button" onClick={() => void handleReturnRequest(selectedItem)}>
                Solicitar devolucao
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
