import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import { getProjects, type ProjectRecord } from '../server/control-plane'

export const Route = createFileRoute('/projects')({
  component: ProjectsPage,
})

function ProjectsPage() {
  const { data = [] } = useQuery<Array<ProjectRecord>>({
    queryFn: () => getProjects(),
    queryKey: ['projects'],
  })

  return (
    <main className="page-wrap px-4 pb-12 pt-10">
      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Managed Repositories</p>
            <h1>Project inventory and verification entrypoints.</h1>
          </div>
          <p className="lede">
            This view mirrors the Bun CLI registry. Presence, install commands, and verification
            hooks all come from the shared Effect domain.
          </p>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>State</th>
                <th>Install</th>
                <th>Verify</th>
                <th>Push URLs</th>
              </tr>
            </thead>
            <tbody>
              {data.map((project) => (
                <tr key={project.name}>
                  <td>
                    <strong>{project.name}</strong>
                    <div className="muted">{project.path}</div>
                  </td>
                  <td>{project.present ? 'Present' : 'Missing'}</td>
                  <td>
                    <code>{project.installCommand.join(' ')}</code>
                  </td>
                  <td>
                    {project.verifyCommands.length > 0 ? (
                      project.verifyCommands.map((command) => (
                        <div key={command.join(' ')}>
                          <code>{command.join(' ')}</code>
                        </div>
                      ))
                    ) : (
                      <span className="muted">No verify hooks</span>
                    )}
                  </td>
                  <td>
                    {project.pushUrls.length > 0 ? (
                      project.pushUrls.map((url) => <div key={url}>{url}</div>)
                    ) : (
                      <span className="muted">No push URLs</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
