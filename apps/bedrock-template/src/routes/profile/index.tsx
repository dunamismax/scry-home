import { component$ } from "@builder.io/qwik";
import { Form, routeAction$, routeLoader$, useLocation } from "@builder.io/qwik-city";
import { APIError } from "better-auth/api";
import { z } from "zod";

import { AppShell } from "~/components/app-shell";
import { writeAuditEvent } from "~/lib/audit.server";
import { requireAuth } from "~/lib/auth-utils.server";
import { auth } from "~/lib/auth.server";
import { getSameOriginError } from "~/lib/http.server";

const updateProfileSchema = z.object({
  name: z.string().min(2).max(120),
});

export const useProfileLoader = routeLoader$(async (event) => {
  const authState = await requireAuth(event);
  return {
    user: authState.user,
  };
});

export const useProfileAction = routeAction$(async (_, event) => {
  const formData = await event.request.formData();
  const parsed = updateProfileSchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    event.status(400);
    return { error: "Enter a valid name." };
  }

  const sameOriginError = getSameOriginError(event.request);
  if (sameOriginError) {
    event.status(403);
    return { error: sameOriginError };
  }

  const authState = await requireAuth(event);

  try {
    await auth.api.updateUser({
      headers: event.request.headers,
      body: { name: parsed.data.name },
    });

    await writeAuditEvent({
      actorUserId: authState.user.id,
      action: "profile.updated",
      targetType: "user",
      targetId: authState.user.id,
      metadata: { name: parsed.data.name },
    });

    throw event.redirect(302, "/profile?updated=1");
  } catch (error) {
    if (error instanceof APIError) {
      event.status(error.statusCode || 400);
      return { error: error.message };
    }
    throw error;
  }
});

export default component$(() => {
  const loader = useProfileLoader();
  const action = useProfileAction();
  const loc = useLocation();

  return (
    <AppShell isAdmin={loader.value.user.role === "admin"}>
      <section class="surface p-6 reveal">
        <h1 class="text-xl font-semibold">Profile</h1>
        <p class="muted mt-1 text-sm">Update account identity fields.</p>

        {loc.url.searchParams.get("updated") === "1" ? (
          <p class="notice notice-success mt-4">Profile updated.</p>
        ) : null}

        <Form action={action} class="mt-6 max-w-md space-y-4">
          <div class="space-y-2">
            <label class="field-label" for="name">
              Name
            </label>
            <input
              class="input"
              id="name"
              name="name"
              required
              value={String(action.formData?.get("name") ?? loader.value.user.name)}
            />
          </div>

          <div class="space-y-2">
            <label class="field-label" for="email">
              Email
            </label>
            <input class="input" disabled id="email" type="email" value={loader.value.user.email} />
          </div>

          {action.value?.error ? <p class="notice notice-error">{action.value.error}</p> : null}

          <button class="btn btn-primary" disabled={action.isRunning} type="submit">
            {action.isRunning ? "Saving..." : "Save profile"}
          </button>
        </Form>
      </section>
    </AppShell>
  );
});

export const head = {
  title: "Profile | website-template",
};
