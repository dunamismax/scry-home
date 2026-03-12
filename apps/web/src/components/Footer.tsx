export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer mt-20 px-4 pb-14 pt-10 text-[var(--sea-ink-soft)]">
      <div className="page-wrap flex flex-col gap-4 text-sm sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="m-0">&copy; {year} scry-home control plane.</p>
          <p className="m-0">
            TanStack Start app, Effect domain packages, Bun CLI, PostgreSQL-ready data layer.
          </p>
        </div>
        <div className="footer-meta">
          <span className="eyebrow">Observability</span>
          <span>OpenTelemetry scaffolded</span>
        </div>
      </div>
    </footer>
  )
}
