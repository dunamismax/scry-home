import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
} from "react-router";
import type { Route } from "./+types/root";
import "./styles/globals.css";

export const meta: Route.MetaFunction = () => {
  return [
    { title: "Scrybase" },
    {
      name: "description",
      content: "RAG platform baseline on React Router 7 + Bun + Postgres.",
    },
  ];
};

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let title = "Unexpected error";
  let detail = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    title = error.status === 404 ? "Not found" : `Error ${error.status}`;
    detail = error.statusText || detail;
  } else if (import.meta.env.DEV && error instanceof Error) {
    detail = error.message;
    stack = error.stack;
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-3 p-6">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-muted-foreground">{detail}</p>
      {stack ? (
        <pre className="overflow-x-auto rounded-lg border border-border bg-card p-4 text-sm">
          <code>{stack}</code>
        </pre>
      ) : null}
    </main>
  );
}
