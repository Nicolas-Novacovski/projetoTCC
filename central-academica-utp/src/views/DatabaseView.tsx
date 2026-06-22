import { useMemo, useState } from 'react'
import { SearchIcon } from '../components/icons'
import type { AdminLogsSnapshot } from '../types/app'

type DatabaseViewProps = {
  snapshot: AdminLogsSnapshot | null
  isLoading: boolean
  onLoad: () => void
}

function formatDetail(detail: Record<string, unknown> | null) {
  if (!detail || Object.keys(detail).length === 0) return 'Sem detalhes adicionais.'

  return Object.entries(detail)
    .map(([key, value]) => `${key.replaceAll('_', ' ')}: ${String(value ?? '-')}`)
    .join(' • ')
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

export function DatabaseView({ snapshot, isLoading, onLoad }: DatabaseViewProps) {
  const [search, setSearch] = useState('')
  const normalizedSearch = search.trim().toLocaleLowerCase('pt-BR')

  const filteredLogs = useMemo(() => {
    if (!snapshot || !normalizedSearch) return []

    return snapshot.logs.filter((log) =>
      [log.usuario, log.ra]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase('pt-BR').includes(normalizedSearch)),
    )
  }, [normalizedSearch, snapshot])

  const matchedStudents = useMemo(() => {
    const students = new Map<string, { name: string; ra: string }>()

    filteredLogs.forEach((log) => {
      const key = `${log.id_usuario ?? 'sistema'}-${log.ra ?? ''}`
      students.set(key, {
        name: log.usuario,
        ra: log.ra || 'RA não informado',
      })
    })

    return [...students.values()]
  }, [filteredLogs])

  function exportFilteredLogs() {
    if (!normalizedSearch || filteredLogs.length === 0) return

    const printWindow = window.open('', '_blank', 'width=1000,height=760')
    if (!printWindow) return

    const studentSummary = matchedStudents
      .map((student) => `${escapeHtml(student.name)} — ${escapeHtml(student.ra)}`)
      .join('<br />')
    const rows = filteredLogs.map((log) => `
      <tr>
        <td>${escapeHtml(log.data_criacao)}</td>
        <td>${escapeHtml(log.acao)}</td>
        <td>${escapeHtml(log.entidade)}</td>
        <td>${escapeHtml(formatDetail(log.detalhe))}</td>
      </tr>
    `).join('')

    printWindow.document.write(`
      <!doctype html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <title>Logs do aluno</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 32px; color: #17384e; }
            h1 { margin: 0 0 8px; font-size: 24px; }
            .meta { margin-bottom: 24px; color: #506c7d; line-height: 1.6; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { padding: 10px; border: 1px solid #d8e4eb; text-align: left; vertical-align: top; }
            th { background: #edf6fa; color: #17384e; }
            tr:nth-child(even) { background: #f8fbfc; }
            @page { size: A4 landscape; margin: 14mm; }
          </style>
        </head>
        <body>
          <h1>Logs de Auditoria — Central Acadêmica UTP</h1>
          <div class="meta">
            <strong>Aluno(s):</strong><br />${studentSummary}<br />
            <strong>Filtro:</strong> ${escapeHtml(search.trim())}<br />
            <strong>Total de registros:</strong> ${filteredLogs.length}
          </div>
          <table>
            <thead><tr><th>Data e hora</th><th>Ação</th><th>Entidade</th><th>Detalhes</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <script>window.addEventListener('load', () => window.print())</script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <section className="page-section database-section">
      <div className="page-heading">
        <div>
          <h2>Logs de Auditoria</h2>
          <p>Pesquise pelo nome ou RA para consultar o histórico de um aluno.</p>
        </div>
        <button className="primary-button" type="button" onClick={onLoad} disabled={isLoading}>
          {isLoading ? 'Carregando...' : 'Atualizar logs'}
        </button>
      </div>

      {!snapshot ? (
        <article className="moderation-card database-empty-card">
          <h3>Carregar logs</h3>
          <p>Clique em "Atualizar logs" para consultar os registros de auditoria.</p>
        </article>
      ) : (
        <>
          <section className="moderation-card logs-search-card">
            <div className="logs-search-field">
              <SearchIcon />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Digite o nome ou RA do aluno"
                aria-label="Pesquisar logs por nome ou RA do aluno"
              />
            </div>
            <button
              className="secondary-button"
              type="button"
              onClick={exportFilteredLogs}
              disabled={!normalizedSearch || filteredLogs.length === 0}
            >
              Exportar PDF
            </button>
          </section>

          {!normalizedSearch ? (
            <article className="moderation-card database-empty-card">
              <h3>Localize um aluno</h3>
              <p>Os logs só serão exibidos depois que você pesquisar por nome ou RA.</p>
            </article>
          ) : filteredLogs.length === 0 ? (
            <article className="moderation-card database-empty-card">
              <h3>Nenhum log encontrado</h3>
              <p>Confira o nome ou RA informado e tente novamente.</p>
            </article>
          ) : (
            <section className="moderation-card database-focus-card">
              <div className="moderation-card-header">
                <div>
                  <h3>Histórico encontrado</h3>
                  <p>{filteredLogs.length} registro(s) para {matchedStudents.map((student) => `${student.name} (${student.ra})`).join(', ')}.</p>
                </div>
              </div>

              <div className="audit-log-list">
                {filteredLogs.map((log) => (
                  <article key={log.id_log} className="audit-log-card">
                    <div className="audit-log-card-header">
                      <div>
                        <strong>{log.acao}</strong>
                        <span>{log.entidade}{log.id_entidade ? ` #${log.id_entidade}` : ''}</span>
                      </div>
                      <time>{log.data_criacao}</time>
                    </div>
                    <p>{formatDetail(log.detalhe)}</p>
                    <div className="audit-log-person">
                      <span>{log.usuario}</span>
                      <strong>{log.ra || 'RA não informado'}</strong>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </section>
  )
}
