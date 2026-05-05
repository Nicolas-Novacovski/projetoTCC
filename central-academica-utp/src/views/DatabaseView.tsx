import type { AdminDatabaseSnapshot } from '../types/app'

type DatabaseViewProps = {
  snapshot: AdminDatabaseSnapshot | null
  isLoading: boolean
  onLoad: () => void
}

export function DatabaseView({ snapshot, isLoading, onLoad }: DatabaseViewProps) {
  const tableEntries = snapshot ? Object.entries(snapshot.tables) : []
  const rideRows = snapshot?.tables.caronas ?? []

  return (
    <section className="page-section database-section">
      <div className="page-heading">
        <div>
          <h2>Visualizacao de Tabelas</h2>
          <p>Ambiente de teste para o administrador inspecionar os registros atuais do banco.</p>
        </div>
        <button className="secondary-button" type="button" onClick={onLoad} disabled={isLoading}>
          {isLoading ? 'Carregando...' : 'Atualizar tabelas'}
        </button>
      </div>

      {!snapshot ? (
        <article className="moderation-card database-empty-card">
          <h3>Carregar dados do banco</h3>
          <p>Clique em "Atualizar tabelas" para buscar os registros reais das tabelas do PostgreSQL.</p>
        </article>
      ) : (
        <>
          <div className="database-overview">
            {Object.entries(snapshot.totals).map(([tableName, total]) => (
              <article key={tableName} className="overview-card">
                <span>{tableName.replace('_', ' ')}</span>
                <strong>{total}</strong>
                <p>Registros encontrados na tabela {tableName}.</p>
              </article>
            ))}
          </div>

          <section className="moderation-card database-focus-card">
            <div className="moderation-card-header">
              <div>
                <h3>Moderacao de Caronas</h3>
                <p>Visualizacao rapida dos registros da tabela `caronas` para testes e validacoes.</p>
              </div>
            </div>
            <div className="database-table">
              <div className="database-table-head">
                <span>ID</span>
                <span>Zona</span>
                <span>Titulo</span>
                <span>Horario</span>
                <span>Vagas</span>
                <span>Status</span>
              </div>
              {rideRows.map((ride) => (
                <div key={String(ride.id_carona)} className="database-table-row">
                  <span>{String(ride.id_carona)}</span>
                  <span>{String(ride.zona_destino)}</span>
                  <span>{String(ride.titulo)}</span>
                  <span>{String(ride.horario_saida)}</span>
                  <span>{String(ride.vagas)}</span>
                  <span>{String(ride.status_carona)}</span>
                </div>
              ))}
            </div>
          </section>

          <div className="database-grid">
            {tableEntries.map(([tableName, rows]) => (
              <section key={tableName} className="moderation-card database-card">
                <div className="moderation-card-header">
                  <div>
                    <h3>{tableName}</h3>
                    <p>{rows.length} registros carregados para teste.</p>
                  </div>
                </div>
                <div className="database-json-preview">
                  <pre>{JSON.stringify(rows, null, 2)}</pre>
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
