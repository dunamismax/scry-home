import { component$ } from "@builder.io/qwik";
import { Form, routeAction$, routeLoader$ } from "@builder.io/qwik-city";

import { AppShell } from "~/components/app-shell";
import { writeAuditEvent } from "~/lib/audit.server";
import { requireAuth } from "~/lib/auth-utils.server";
import { env } from "~/lib/env.server";
import { getSameOriginError } from "~/lib/http.server";
import { enqueueJob } from "~/lib/jobs.server";

export const useSettingsLoader = routeLoader$(async (event) => {
  const authState = await requireAuth(event);

  return {
    user: authState.user,
    jobsEnabled: env.enableJobs,
    minioBucket: env.MINIO_BUCKET,
    maxUploadBytes: env.MAX_UPLOAD_BYTES,
  };
});

export const useSettingsAction = routeAction$(async (_, event) => {
  const sameOriginError = getSameOriginError(event.request);
  if (sameOriginError) {
    event.status(403);
    return { message: sameOriginError };
  }

  const authState = await requireAuth(event);
  const formData = await event.request.formData();
  const intent = formData.get("intent");

  if (intent === "enqueue-demo") {
    const jobId = await enqueueJob("system.demo", {
      requestedByUserId: authState.user.id,
      requestedAt: new Date().toISOString(),
    });

    await writeAuditEvent({
      actorUserId: authState.user.id,
      action: "jobs.enqueue_demo",
      targetType: "queue",
      metadata: { jobId },
    });

    return {
      message: jobId
        ? `Queued demo job: ${jobId}`
        : "Job queue is disabled. Set ENABLE_JOBS=true to activate pg-boss.",
    };
  }

  event.status(400);
  return { message: "Unknown action" };
});

export default component$(() => {
  const loader = useSettingsLoader();
  const action = useSettingsAction();

  return (
    <AppShell isAdmin={loader.value.user.role === "admin"}>
      <div class="space-y-6">
        <section class="surface p-6 reveal">
          <h1 class="text-xl font-semibold">Runtime configuration</h1>
          <p class="muted mt-1 text-sm">Values from environment and infra wiring.</p>

          <div class="muted mt-4 space-y-2 text-sm">
            <p>
              <strong class="text-[var(--fg)]">Jobs enabled:</strong>{" "}
              {loader.value.jobsEnabled ? "yes" : "no"}
            </p>
            <p>
              <strong class="text-[var(--fg)]">MinIO bucket:</strong> {loader.value.minioBucket}
            </p>
            <p>
              <strong class="text-[var(--fg)]">Max upload bytes:</strong>{" "}
              {loader.value.maxUploadBytes}
            </p>
          </div>
        </section>

        <section class="surface p-6 reveal reveal-2">
          <h2 class="text-lg font-semibold">Background jobs</h2>
          <p class="muted mt-1 text-sm">Queue a sample pg-boss job to validate worker plumbing.</p>

          <Form action={action} class="mt-4">
            <input name="intent" type="hidden" value="enqueue-demo" />
            <button class="btn btn-primary" disabled={action.isRunning} type="submit">
              {action.isRunning ? "Queueing..." : "Queue demo job"}
            </button>
          </Form>

          {action.value?.message ? <p class="muted mt-3 text-sm">{action.value.message}</p> : null}
        </section>
      </div>
    </AppShell>
  );
});

export const head = {
  title: "Settings | website-template",
};
