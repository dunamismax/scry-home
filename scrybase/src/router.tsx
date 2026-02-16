import { createRouter, ErrorComponent } from "@tanstack/react-router";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";
import { routeTree } from "./routeTree.gen";

function DefaultError({ error }: ErrorComponentProps) {
  if (import.meta.env.DEV) {
    return <ErrorComponent error={error} />;
  }

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
        Something went wrong
      </h1>
      <p style={{ marginTop: "0.5rem", color: "#666" }}>
        Please try refreshing the page.
      </p>
    </div>
  );
}

export function getRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
      },
    },
  });

  return createRouter({
    routeTree,
    defaultPreload: "intent",
    scrollRestoration: true,
    defaultNotFoundComponent: () => (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
          404 — Not Found
        </h1>
        <p style={{ marginTop: "0.5rem", color: "#666" }}>
          This page doesn't exist.
        </p>
      </div>
    ),
    defaultErrorComponent: DefaultError,
    context: { queryClient },
  });
}
