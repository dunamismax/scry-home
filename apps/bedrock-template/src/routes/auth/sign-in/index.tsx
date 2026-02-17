import { component$ } from "@builder.io/qwik";
import { Form, Link, routeAction$, routeLoader$ } from "@builder.io/qwik-city";
import { APIError } from "better-auth/api";
import { z } from "zod";

import { auth } from "~/lib/auth.server";
import { extractSetCookieHeader, getAuthState, safeRedirectPath } from "~/lib/auth-utils.server";
import { getSameOriginError } from "~/lib/http.server";
import { checkRateLimit, requestFingerprint } from "~/lib/rate-limit.server";

const signInSchema = z.object({
  email: z.email().max(320),
  password: z.string().min(12).max(128),
});

export const useSignInLoader = routeLoader$(async (event) => {
  const authState = await getAuthState(event.request);

  if (authState) {
    throw event.redirect(302, "/dashboard");
  }

  return {
    next: safeRedirectPath(event.url.searchParams.get("next")),
  };
});

export const useSignInAction = routeAction$(async (_, event) => {
  const formData = await event.request.formData();

  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    event.status(400);
    return { error: "Enter a valid email and password." };
  }

  const next = safeRedirectPath(formData.get("next"));

  const sameOriginError = getSameOriginError(event.request);
  if (sameOriginError) {
    event.status(403);
    return { error: sameOriginError };
  }

  const fingerprint = requestFingerprint(event.request);
  if (!checkRateLimit(`signin:${fingerprint}`, 10, 60_000)) {
    event.status(429);
    return { error: "Too many sign-in attempts. Try again in a minute." };
  }

  try {
    const result = await auth.api.signInEmail({
      headers: event.request.headers,
      body: {
        email: parsed.data.email,
        password: parsed.data.password,
      },
      returnHeaders: true,
    });

    const setCookie = extractSetCookieHeader(result);
    if (setCookie) {
      event.headers.set("set-cookie", setCookie);
    }

    throw event.redirect(302, next);
  } catch (error) {
    if (error instanceof APIError) {
      event.status(error.statusCode || 400);
      return { error: error.message };
    }
    throw error;
  }
});

export default component$(() => {
  const loader = useSignInLoader();
  const action = useSignInAction();

  return (
    <main class="mx-auto max-w-md px-4 py-14 sm:px-0" id="main-content">
      <section class="surface reveal p-6">
        <p class="eyebrow">Welcome back</p>
        <h1 class="mt-2 text-xl font-semibold">Sign in</h1>
        <p class="muted mt-1 text-sm">Use your account to access dashboard and admin routes.</p>

        <Form action={action} class="mt-6 space-y-4">
          <input name="next" type="hidden" value={loader.value.next} />

          <div class="space-y-2">
            <label class="field-label" for="email">
              Email
            </label>
            <input
              autoComplete="email"
              class="input"
              id="email"
              name="email"
              required
              type="email"
              value={String(action.formData?.get("email") ?? "")}
            />
          </div>

          <div class="space-y-2">
            <label class="field-label" for="password">
              Password
            </label>
            <input
              autoComplete="current-password"
              class="input"
              id="password"
              name="password"
              required
              type="password"
            />
          </div>

          {action.value?.error ? <p class="notice notice-error">{action.value.error}</p> : null}

          <button class="btn btn-primary h-10 w-full" disabled={action.isRunning} type="submit">
            {action.isRunning ? "Signing in..." : "Sign in"}
          </button>
        </Form>

        <p class="muted mt-4 text-sm">
          Need an account?{" "}
          <Link class="inline-link" href="/auth/sign-up" prefetch={false}>
            Create one
          </Link>
          .
        </p>
      </section>
    </main>
  );
});
