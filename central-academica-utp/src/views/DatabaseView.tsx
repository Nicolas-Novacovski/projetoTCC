import { useMemo, useState } from 'react'
import type { AdminDatabaseSnapshot } from '../types/app'

type DatabaseViewProps = {
  snapshot: AdminDatabaseSnapshot | null
  isLoading: boolean
  onLoad: () => void
}

export function DatabaseView({ snapshot, isLoading, onLoad }: DatabaseViewProps) {
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const tableEntries = useMemo(() => (snapshot ? Object.entries(snapshot.tables) : []), [snapshot])
  const activeTableName = selectedTable && snapshot?.tables[selectedTable as keyof AdminDatabaseSnapshot['tables']]
    ? selectedTable
    : tableEntries[0]?.[0] ?? null
  const activeRows = useMemo(
    () => (activeTableName ? snapshot?.tables[activeTableName as keyof AdminDatabaseSnapshot['tables']] ?? [] : []),
    [activeTableName, snapshot],
  )
  const activeColumns = useMemo(() => {
    const columnNames = new Set<string>()

    activeRows.slice(0, 20).forEach((row) => {
      Object.keys(row).forEach((key) => columnNames.add(key))
    })

    return [...columnNames].slice(0, 6)
  }, [activeRows])

  function formatTableName(tableName: string) {
    return tableName.replaceAll('_', ' ')
  }

  return (
    <section className="page-section database-section">
      <div className="page-heading">
        <div>
          <h2>Visualizacao de Tabelas</h2>
          <p>Ambiente de teste para o administrador inspecionar os registros atuais do banco.</p>
        </div>
     <button className="primary-button" type="button" onClick={onLoad} disabled={isLoading}>
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
              <button
                key={tableName}
                className={`overview-card database-overview-card${activeTableName === tableName ? ' is-active' : ''}`}
                type="button"
                onClick={() => setSelectedTable(tableName)}
              >
                <span>{formatTableName(tableName)}</span>
                <strong>{total}</strong>
                <p>Clique para visualizar os registros desta tabela.</p>
              </button>
            ))}
          </div>

          <section className="moderation-card database-focus-card">
            <div className="moderation-card-header">
              <div>
                <h3>{activeTableName ? formatTableName(activeTableName) : 'Tabela'}</h3>
                <p>{activeRows.length} registros carregados. Clique em outro card acima para trocar a tabela.</p>
              </div>
            </div>
            {activeRows.length > 0 && activeColumns.length > 0 ? (
              <div className="database-dynamic-table">
                <div className="database-dynamic-table-head" style={{ gridTemplateColumns: `repeat(${activeColumns.length}, minmax(120px, 1fr))` }}>
                  {activeColumns.map((column) => <span key={column}>{column}</span>)}
                </div>
                {activeRows.map((row, rowIndex) => (
                  <div
                    key={`${activeTableName}-${rowIndex}`}
                    className="database-dynamic-table-row"
                    style={{ gridTemplateColumns: `repeat(${activeColumns.length}, minmax(120px, 1fr))` }}
                  >
                    {activeColumns.map((column) => (
                      <span key={column}>{String(row[column] ?? '-')}</span>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-state-text">Nenhum registro encontrado nesta tabela.</p>
            )}
            <div className="database-json-preview">
              <pre>{JSON.stringify(activeRows, null, 2)}</pre>
            </div>
          </section>
        </>
      )}
    </section>
  )
}
