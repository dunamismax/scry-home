import { component$ } from "@builder.io/qwik";
import { Form, Link, routeAction$, routeLoader$ } from "@builder.io/qwik-city";
import { APIError } from "better-auth/api";
import { z } from "zod";

import { auth } from "~/lib/auth.server";
import { extractSetCookieHeader, getAuthState } from "~/lib/auth-utils.server";
import { getSameOriginError } from "~/lib/http.server";
import { checkRateLimit, requestFingerprint } from "~/lib/rate-limit.server";

const signUpSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.email().max(320),
  password: z
    .string()
    .min(12, "Password must be at least 12 characters")
    .max(128)
    .regex(/[A-Z]/, "Include at least one uppercase letter")
    .regex(/[a-z]/, "Include at least one lowercase letter")
    .regex(/[0-9]/, "Include at least one number"),
});

export const useSignUpLoader = routeLoader$(async (event) => {
  const authState = await getAuthState(event.request);
  if (authState) {
    throw event.redirect(302, "/dashboard");
  }

  return {};
});

export const useSignUpAction = routeAction$(async (_, event) => {
  const formData = await event.request.formData();
  const parsed = signUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    event.status(400);
    return {
      error: parsed.error.issues.map((issue) => issue.message).join(". "),
    };
  }

  const sameOriginError = getSameOriginError(event.request);
  if (sameOriginError) {
    event.status(403);
    return { error: sameOriginError };
  }

  const fingerprint = requestFingerprint(event.request);
  if (!checkRateLimit(`signup:${fingerprint}`, 6, 60_000)) {
    event.status(429);
    return { error: "Too many sign-up attempts. Try again shortly." };
  }

  try {
    const result = await auth.api.signUpEmail({
      headers: event.request.headers,
      body: {
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password,
      },
      returnHeaders: true,
    });

    const setCookie = extractSetCookieHeader(result);
    if (setCookie) {
      event.headers.set("set-cookie", setCookie);
    }

    throw event.redirect(302, "/dashboard");
  } catch (error) {
    if (error instanceof APIError) {
      event.status(error.statusCode || 400);
      return { error: error.message };
    }

    throw error;
  }
});

export default component$(() => {
  useSignUpLoader();
  const action = useSignUpAction();

  return (
    <main class="mx-auto max-w-md px-4 py-14 sm:px-0" id="main-content">
      <section class="surface reveal p-6">
        <p class="eyebrow">Start fast</p>
        <h1 class="mt-2 text-xl font-semibold">Create account</h1>
        <p class="muted mt-1 text-sm">Includes baseline security policy and role defaults.</p>

        <Form action={action} class="mt-6 space-y-4">
          <div class="space-y-2">
            <label class="field-label" for="name">
              Full name
            </label>
            <input
              autoComplete="name"
              class="input"
              id="name"
              name="name"
              required
              value={String(action.formData?.get("name") ?? "")}
            />
          </div>

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
              autoComplete="new-password"
              class="input"
              id="password"
              name="password"
              required
              type="password"
            />
          </div>

          {action.value?.error ? <p class="notice notice-error">{action.value.error}</p> : null}

          <button class="btn btn-primary h-10 w-full" disabled={action.isRunning} type="submit">
            {action.isRunning ? "Creating account..." : "Create account"}
          </button>
        </Form>

        <p class="muted mt-4 text-sm">
          Already have an account?{" "}
          <Link class="inline-link" href="/auth/sign-in" prefetch={false}>
            Sign in
          </Link>
          .
        </p>
      </section>
    </main>
  );
});
