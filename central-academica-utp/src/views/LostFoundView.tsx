import { useMemo, useState } from 'react'
import Swal from 'sweetalert2'
import { SearchIcon } from '../components/icons'
import type { LostItem } from '../types/app'

const lostItemReturnPlace = 'Casinha no estacionamento, proximo a entrada dos blocos A e B'

type LostFoundViewProps = {
  lostItems: LostItem[]
  onOpenRegisterModal: () => void
}

export function LostFoundView({ lostItems, onOpenRegisterModal }: LostFoundViewProps) {
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null)
  const [previewItemId, setPreviewItemId] = useState<number | null>(null)
  const [lostItemSearch, setLostItemSearch] = useState('')

  const normalizedSearch = lostItemSearch.trim().toLowerCase()
  const filteredLostItems = useMemo(
    () =>
      normalizedSearch
        ? lostItems.filter((item) =>
            [item.place, item.date, item.category]
              .filter(Boolean)
              .some((value) => value.toLowerCase().includes(normalizedSearch)),
          )
        : lostItems,
    [lostItems, normalizedSearch],
  )

  const effectivePreviewItemId = filteredLostItems.some((item) => item.id === previewItemId)
    ? previewItemId
    : filteredLostItems[0]?.id ?? null
  const previewItem = filteredLostItems.find((item) => item.id === effectivePreviewItemId) ?? null
  const selectedItem = lostItems.find((item) => item.id === selectedItemId) ?? null

  async function handleReturnRequest(item: LostItem) {
    await Swal.fire({
      icon: 'info',
      title: 'Orientacoes para retirada',
      html: `<strong>${item.title}</strong><br /><br />A retirada e permitida <strong>APENAS PELO DONO</strong> do item.<br />Local: ${lostItemReturnPlace}.<br />Contato da secretaria: ${item.contact}`,
      confirmButtonText: 'Entendi',
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
      <article className="lost-return-notice" role="note" aria-label="Orientacoes para retirada de itens">
        <strong>Retirada APENAS PELOS DONOS</strong>
        <span>Itens encontrados podem ser retirados somente pelo proprietario, na casinha no estacionamento proximo a entrada dos blocos A e B.</span>
      </article>
      <div className="lost-found-search">
        <SearchIcon />
        <input
          type="text"
          placeholder="Pesquisar por local, data ou categoria"
          value={lostItemSearch}
          onChange={(event) => setLostItemSearch(event.target.value)}
        />
        <span>{filteredLostItems.length} resultado(s)</span>
      </div>
      {previewItem ? (
        <div className="lost-found-layout">
          <div className="lost-found-grid">
            {filteredLostItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`lost-card${effectivePreviewItemId === item.id ? ' is-active' : ''}`}
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
                    <span>{item.category}</span>
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
              <div><span className="detail-label">Registrado por</span><strong>{previewItem.foundBy}</strong></div>
              <div><span className="detail-label">Retirada</span><strong>Apenas pelo dono</strong></div>
            </div>
            <div className="lost-details-footer">
              <div><span className="detail-label">Local de retirada</span><strong>{lostItemReturnPlace}</strong></div>
              <button className="primary-button" type="button" onClick={() => setSelectedItemId(previewItem.id)}>
                Abrir detalhe completo
              </button>
            </div>
          </aside>
        </div>
      ) : (
        <article className="lost-details-card">
          <h3>{normalizedSearch ? 'Nenhum item encontrado' : 'Nenhum item registrado'}</h3>
          <p>{normalizedSearch ? 'Tente pesquisar por outro local, data ou categoria.' : 'Assim que novos registros forem adicionados ao banco, eles vao aparecer aqui.'}</p>
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
              <div><span className="detail-label">Registrado por</span><strong>{selectedItem.foundBy}</strong></div>
              <div><span className="detail-label">Retirada</span><strong>Apenas pelo dono</strong></div>
            </div>
            <div className="lost-return-notice lost-return-notice-compact" role="note">
              <strong>Retirada APENAS PELO DONO</strong>
              <span>Compareca a casinha no estacionamento, proximo a entrada dos blocos A e B.</span>
            </div>
            <div className="details-modal-footer">
              <div><span className="detail-label">Secretaria</span><strong>{selectedItem.contact}</strong></div>
              <button className="primary-button" type="button" onClick={() => void handleReturnRequest(selectedItem)}>
                Ver orientacoes de retirada
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
