import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import { getOverview, type OverviewRecord } from '../server/control-plane'

export const Route = createFileRoute('/')({ component: App })

function App() {
  const { data } = useQuery<OverviewRecord>({
    queryFn: () => getOverview(),
    queryKey: ['overview'],
  })

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="hero-panel rise-in">
        <div className="hero-copy">
          <p className="eyebrow">Operational Dashboard</p>
          <h1 className="display-title">
            A rewritten control plane for repos, backups, and operator workflows.
          </h1>
          <p className="lede">
            The repo now runs as a Bun and TypeScript monorepo. The UI is Start + Router + Query,
            the CLI is Bun, and the domain logic lives in shared TypeScript packages.
          </p>
        </div>
        <div className="hero-grid">
          <article className="metric-card">
            <span className="metric-label">Managed Repos</span>
            <strong>{data?.projects.present ?? 0}</strong>
            <small>of {data?.projects.total ?? 0} detected locally</small>
          </article>
          <article className="metric-card">
            <span className="metric-label">Backups</span>
            <strong>{data?.backup.config ? 'Config ready' : 'Pending'}</strong>
            <small>{data?.backup.ssh ? 'SSH archive present' : 'SSH archive missing'}</small>
          </article>
          <article className="metric-card">
            <span className="metric-label">Database</span>
            <strong>{data?.databaseConfigured ? 'Connected by env' : 'Needs DATABASE_URL'}</strong>
            <small>Drizzle + PostgreSQL scaffolded</small>
          </article>
          <article className="metric-card accent">
            <span className="metric-label">Auth / CAB</span>
            <strong>{data?.authConfigured ? 'Auth ready' : 'Auth scaffolded'}</strong>
            <small>{data?.cabTemplateCount ?? 0} CAB templates available</small>
          </article>
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Bun CLI', 'Core repo workflows are ported into TypeScript command modules.'],
          [
            'Shared Core',
            'Remote policy, snapshotting, crypto, and contracts live in shared packages.',
          ],
          [
            'Postgres Ready',
            'Drizzle schema, auth tables, and operations records are scaffolded for PostgreSQL.',
          ],
          [
            'Control Plane',
            'Dashboard and CLI keep repo health, backups, and CAB workflows in one place.',
          ],
        ].map(([title, desc], index) => (
          <article
            key={title}
            className="panel feature-card rise-in rounded-2xl p-5"
            style={{ animationDelay: `${index * 90 + 80}ms` }}
          >
            <h2 className="mb-2 text-base font-semibold text-[var(--sea-ink)]">{title}</h2>
            <p className="m-0 text-sm text-[var(--sea-ink-soft)]">{desc}</p>
          </article>
        ))}
      </section>

      <section className="panel mt-8 rounded-2xl p-6">
        <p className="eyebrow mb-2">Command Surface</p>
        <ul className="m-0 list-disc space-y-2 pl-5 text-sm text-[var(--sea-ink-soft)]">
          <li>
            <code>bun run cli doctor</code>
          </li>
          <li>
            <code>bun run cli sync:remotes --fix</code>
          </li>
          <li>
            <code>bun run cli setup:config_backup</code>
          </li>
        </ul>
      </section>
    </main>
  )
}
