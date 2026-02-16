import { Form, Link, data, useActionData, useLoaderData } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import type { Route } from "./+types/home";

type SessionUser = {
  id: string;
  name: string | null;
  email: string;
};

type ActionData = {
  error?: string;
  success?: string;
};

export async function loader({ request }: Route.LoaderArgs) {
  const [{ getSession }, { getStackStatus }] = await Promise.all([
    import("~/services/auth.server"),
    import("~/services/stack.server"),
  ]);

  const [sessionResponse, stack] = await Promise.all([getSession(request), getStackStatus()]);
  const session = sessionResponse as { user?: SessionUser } | null;

  if (!session?.user) {
    return {
      user: null,
      projects: [],
      stack,
    };
  }

  const { listProjectsByUser } = await import("~/services/projects.server");
  const projects = await listProjectsByUser(session.user.id);

  return {
    user: session.user,
    projects,
    stack,
  };
}

export async function action({ request }: Route.ActionArgs) {
  const [
    { getSession },
    { createProject },
    { uploadDocumentObject },
    { createDocument },
    { enqueueProjectCreated, enqueueDocumentProcessing },
  ] = await Promise.all([
    import("~/services/auth.server").then((module) => ({ getSession: module.getSession })),
    import("~/services/projects.server").then((module) => ({
      createProject: module.createProject,
    })),
    import("~/services/storage.server").then((module) => ({
      uploadDocumentObject: module.uploadDocumentObject,
    })),
    import("~/services/documents.server").then((module) => ({
      createDocument: module.createDocument,
    })),
    import("~/services/jobs.server").then((module) => ({
      enqueueProjectCreated: module.enqueueProjectCreated,
      enqueueDocumentProcessing: module.enqueueDocumentProcessing,
    })),
  ]);

  const sessionResponse = await getSession(request);
  const session = sessionResponse as { user?: SessionUser } | null;

  if (!session?.user) {
    return data<ActionData>(
      {
        error: "Sign in is required.",
      },
      { status: 401 },
    );
  }

  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "");

  if (intent === "create-project") {
    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();

    if (!name) {
      return data<ActionData>(
        {
          error: "Project name is required.",
        },
        { status: 400 },
      );
    }

    const project = await createProject({
      userId: session.user.id,
      name,
      description: description || null,
    });

    await enqueueProjectCreated({
      projectId: project.id,
      userId: session.user.id,
    });

    return data<ActionData>({
      success: `Project '${project.name}' created.`,
    });
  }

  if (intent === "upload-document") {
    const projectId = String(formData.get("projectId") ?? "").trim();
    const upload = formData.get("file");

    if (!projectId) {
      return data<ActionData>(
        {
          error: "Project is required.",
        },
        { status: 400 },
      );
    }

    if (!(upload instanceof File) || upload.size === 0) {
      return data<ActionData>(
        {
          error: "Choose a file before uploading.",
        },
        { status: 400 },
      );
    }

    const object = await uploadDocumentObject({
      userId: session.user.id,
      projectId,
      file: upload,
    });

    const document = await createDocument({
      projectId,
      filename: upload.name,
      objectKey: object.objectKey,
      mimeType: object.mimeType,
      sizeBytes: object.sizeBytes,
    });

    await enqueueDocumentProcessing({
      documentId: document.id,
      projectId,
      objectKey: object.objectKey,
    });

    return data<ActionData>({
      success: `Uploaded '${upload.name}' and queued processing.`,
    });
  }

  return data<ActionData>(
    {
      error: "Unknown action.",
    },
    { status: 400 },
  );
}

export default function HomePage() {
  const { user, projects, stack } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <header className="grid gap-2">
        <h1 className="text-4xl font-semibold tracking-tight">Scrybase</h1>
        <p className="text-muted-foreground">
          React Router 7 + Bun + postgres.js + Better Auth + MinIO + pg-boss baseline.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <StatusCard
          label="Database"
          detail={stack.database.detail}
          status={stack.database.status}
        />
        <StatusCard
          label="Object Storage"
          detail={stack.objectStorage.detail}
          status={stack.objectStorage.status}
        />
        <StatusCard
          label="Background Jobs"
          detail={stack.backgroundJobs.detail}
          status={stack.backgroundJobs.status}
        />
      </section>

      {!user ? (
        <Card>
          <CardHeader>
            <CardTitle>Authentication required</CardTitle>
            <CardDescription>
              Sign in before creating projects or uploading documents.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              to="/login"
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Go to login
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Signed in</CardTitle>
              <CardDescription>
                {user.name ?? user.email} ({user.email})
              </CardDescription>
            </CardHeader>
          </Card>

          <section className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Create project</CardTitle>
                <CardDescription>
                  Stores project metadata in PostgreSQL and queues a pg-boss job.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form method="post" className="space-y-4">
                  <input type="hidden" name="intent" value="create-project" />
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium leading-none">
                      Name
                    </label>
                    <Input id="name" name="name" placeholder="Support Docs" required />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="description" className="text-sm font-medium leading-none">
                      Description
                    </label>
                    <Input id="description" name="description" placeholder="Optional" />
                  </div>
                  <Button type="submit">Create project</Button>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Upload document</CardTitle>
                <CardDescription>
                  Uploads a file to MinIO, stores metadata in PostgreSQL, and enqueues processing.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form method="post" encType="multipart/form-data" className="space-y-4">
                  <input type="hidden" name="intent" value="upload-document" />
                  <div className="space-y-2">
                    <label htmlFor="projectId" className="text-sm font-medium leading-none">
                      Project
                    </label>
                    <select
                      id="projectId"
                      name="projectId"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      required
                    >
                      <option value="">Select a project</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="file" className="text-sm font-medium leading-none">
                      File
                    </label>
                    <Input id="file" name="file" type="file" required />
                  </div>
                  <Button type="submit" variant="secondary">
                    Upload file
                  </Button>
                </Form>
              </CardContent>
            </Card>
          </section>

          <Card>
            <CardHeader>
              <CardTitle>Projects ({projects.length})</CardTitle>
              <CardDescription>
                SQL-first data access via postgres.js template literals.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {projects.length === 0 ? (
                  <li className="text-sm text-muted-foreground">No projects yet.</li>
                ) : (
                  projects.map((project) => (
                    <li
                      key={project.id}
                      className="rounded-md border border-border bg-background p-3"
                    >
                      <p className="font-medium">{project.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {project.description || "No description"}
                      </p>
                    </li>
                  ))
                )}
              </ul>
            </CardContent>
          </Card>
        </>
      )}

      {actionData?.error ? <p className="text-sm text-destructive">{actionData.error}</p> : null}
      {actionData?.success ? (
        <p className="text-sm text-emerald-600">{actionData.success}</p>
      ) : null}
    </main>
  );
}

function StatusCard(props: { label: string; detail: string; status: "ok" | "error" }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{props.label}</CardTitle>
        <CardDescription>{props.detail}</CardDescription>
      </CardHeader>
      <CardContent>
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
            props.status === "ok" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
          }`}
        >
          {props.status}
        </span>
      </CardContent>
    </Card>
  );
}
