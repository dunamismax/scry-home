import { component$ } from "@builder.io/qwik";
import type { DocumentHead, RequestHandler } from "@builder.io/qwik-city";
import { Link } from "@builder.io/qwik-city";

export const onGet: RequestHandler = async ({ cacheControl }) => {
  cacheControl({ public: true, maxAge: 300, staleWhileRevalidate: 1_800 });
};

const pillars = [
  {
    title: "Resumable Routing",
    description: "Qwik City ships HTML first and resumes only what the route needs.",
  },
  {
    title: "Security Defaults",
    description: "CSP, strict response headers, same-origin mutation checks, and rate limits.",
  },
  {
    title: "Identity + RBAC",
    description: "Better Auth sessions, protected routes, and role-aware admin controls.",
  },
  {
    title: "Storage Pipeline",
    description: "MinIO upload flow with metadata indexing and account-level ownership.",
  },
  {
    title: "Queue + Worker",
    description: "pg-boss wiring with demo job queueing and worker entrypoint scaffolds.",
  },
  {
    title: "SQL-First Data",
    description: "PostgreSQL with migrations in plain SQL and direct postgres.js queries.",
  },
] as const;

const buildTargets = [
  "Launch user auth in hours instead of rebuilding session flows.",
  "Deploy on Bun with small runtime overhead and self-hosted infra.",
  "Maintain fast TTFB by keeping page rendering server-first.",
  "Preserve fast resumability without eager link prefetch overhead.",
] as const;

export default component$(() => {
  return (
    <main class="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8" id="main-content">
      <section class="surface reveal overflow-hidden p-8 lg:p-12">
        <p class="eyebrow">Performance-first Full-stack Template</p>
        <h1 class="mt-3 max-w-3xl text-4xl font-semibold leading-tight tracking-tight lg:text-5xl">
          Ship a premium web app baseline without sacrificing speed.
        </h1>
        <p class="muted mt-4 max-w-3xl text-base lg:text-lg">
          `bedrock-template` is tuned for fast initial paint, smooth route transitions, and secure
          production defaults. Start from a refined dark-first UI, then build product features on
          top.
        </p>

        <div class="mt-8 flex flex-wrap gap-3">
          <Link class="btn btn-primary" href="/auth/sign-up" prefetch={false}>
            Start with an account
          </Link>
          <Link class="btn btn-secondary" href="/dashboard" prefetch={false}>
            Open dashboard
          </Link>
        </div>

        <div class="mt-8 grid gap-3 sm:grid-cols-3">
          <article class="surface-strong p-4">
            <p class="kpi-label">Client JS Strategy</p>
            <p class="kpi-value">Resume on demand</p>
          </article>
          <article class="surface-strong p-4">
            <p class="kpi-label">Local Stack</p>
            <p class="kpi-value">Bun + Postgres + MinIO</p>
          </article>
          <article class="surface-strong p-4">
            <p class="kpi-label">Navigation Feel</p>
            <p class="kpi-value">No eager prefetch</p>
          </article>
        </div>
      </section>

      <section class="defer-section mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {pillars.map((pillar, index) => (
          <article key={pillar.title} class={`surface p-5 reveal reveal-${(index % 3) + 1}`}>
            <p class="eyebrow">{pillar.title}</p>
            <p class="mt-2 text-sm muted">{pillar.description}</p>
          </article>
        ))}
      </section>

      <section class="defer-section mt-8 surface p-6 lg:p-8">
        <h2 class="text-2xl font-semibold tracking-tight">What this template optimizes for</h2>
        <div class="mt-4 grid gap-2 text-sm muted sm:grid-cols-2">
          {buildTargets.map((target) => (
            <p key={target}>{target}</p>
          ))}
        </div>
      </section>

      <section class="defer-section mt-8 surface p-6 lg:p-8">
        <h2 class="text-2xl font-semibold tracking-tight">Included modules</h2>
        <div class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <p class="surface-strong p-3 text-sm">1. Better Auth mounted at `/api/auth/*`</p>
          <p class="surface-strong p-3 text-sm">2. Role-aware protected routes + admin screens</p>
          <p class="surface-strong p-3 text-sm">3. SQL migration runner with plain `.sql` files</p>
          <p class="surface-strong p-3 text-sm">4. MinIO upload pipeline and metadata table</p>
          <p class="surface-strong p-3 text-sm">5. pg-boss queue publisher + worker scaffold</p>
          <p class="surface-strong p-3 text-sm">6. Security headers and anti-CSRF checks</p>
        </div>
      </section>
    </main>
  );
});

export const head: DocumentHead = {
  title: "bedrock-template | performance-first Qwik starter",
  meta: [
    {
      name: "description",
      content:
        "Performance-first Qwik starter with Better Auth, postgres.js, pg-boss, MinIO, and production security defaults.",
    },
    {
      property: "og:title",
      content: "bedrock-template | performance-first Qwik starter",
    },
    {
      property: "og:description",
      content:
        "Performance-first Qwik starter with Better Auth, postgres.js, pg-boss, MinIO, and production security defaults.",
    },
    {
      property: "og:type",
      content: "website",
    },
    {
      name: "twitter:card",
      content: "summary_large_image",
    },
    {
      name: "twitter:title",
      content: "bedrock-template | performance-first Qwik starter",
    },
    {
      name: "twitter:description",
      content:
        "Performance-first Qwik starter with Better Auth, postgres.js, pg-boss, MinIO, and production security defaults.",
    },
  ],
};
