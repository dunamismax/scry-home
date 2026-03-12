import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import { type BackupRecord, getBackups } from '../server/workspace-data'

export const Route = createFileRoute('/backups')({
  component: BackupsPage,
})

function BackupsPage() {
  const { data } = useQuery<BackupRecord>({
    queryFn: () => getBackups(),
    queryKey: ['backups'],
  })

  return (
    <main className="page-wrap px-4 pb-12 pt-10">
      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Vault Artifacts</p>
            <h1>Encrypted backup inventory with direct filesystem provenance.</h1>
          </div>
          <p className="lede">
            The CLI writes archives and metadata into `vault/`. This route reads the current tree
            from the server and exposes it through TanStack Query.
          </p>
        </div>

        {!data?.configured ? (
          <p className="muted">No `vault/` directory is present in this workspace yet.</p>
        ) : (
          <div className="artifact-list">
            {data.items.map((item) => (
              <article key={item.path} className="artifact-card">
                <div>
                  <h2>{item.path}</h2>
                  <p className="muted">{item.modifiedAt}</p>
                </div>
                <strong>{Intl.NumberFormat().format(item.sizeBytes)} bytes</strong>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
