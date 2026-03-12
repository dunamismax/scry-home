export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer mt-20 px-4 pb-14 pt-10 text-[var(--sea-ink-soft)]">
      <div className="page-wrap flex flex-col gap-4 text-sm sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="m-0">&copy; {year} scry-home workspace.</p>
          <p className="m-0">
            Optional UI for the Scry prompt repo, helper tooling, and workspace utilities.
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
