import { component$, Slot } from "@builder.io/qwik";
import type { RequestHandler } from "@builder.io/qwik-city";
import { routeLoader$ } from "@builder.io/qwik-city";

import { SiteNav } from "~/components/site-nav";
import { getEventAuthState } from "~/lib/auth-utils.server";
import { getSecurityHeaders } from "~/lib/http.server";

const noCachePrefixes = ["/auth", "/dashboard", "/profile", "/settings", "/admin"];
const authAwarePrefixes = ["/dashboard", "/profile", "/settings", "/admin"];

export const onRequest: RequestHandler = async (event) => {
  const securityHeaders = getSecurityHeaders();

  for (const [header, value] of Object.entries(securityHeaders)) {
    event.headers.set(header, value);
  }

  if (noCachePrefixes.some((prefix) => event.url.pathname.startsWith(prefix))) {
    event.cacheControl({ noCache: true });
  }

  await event.next();
};

export const useViewer = routeLoader$(async (event) => {
  const pathname = new URL(event.request.url).pathname;
  if (!authAwarePrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return { user: null };
  }

  const authState = await getEventAuthState(event);
  return {
    user: authState?.user ?? null,
  };
});

export default component$(() => {
  const viewer = useViewer();

  return (
    <>
      <a
        class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg"
        href="#main-content"
        style={{
          background: "var(--bg-surface)",
          color: "var(--fg)",
          border: "1px solid var(--border)",
        }}
      >
        Skip to main content
      </a>
      <div class="pointer-events-none fixed inset-0 -z-10" />
      <SiteNav user={viewer.value.user} />
      <Slot />
    </>
  );
});
