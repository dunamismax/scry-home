import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-5xl font-bold tracking-tight">Scrybase</h1>
        <p className="max-w-md text-center text-lg text-muted-foreground">
          Upload your documents. Get an AI-powered API that answers questions
          about them.
        </p>
      </div>
      <div className="flex gap-4">
        <Link
          to="/login"
          className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Get Started
        </Link>
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-border px-6 py-3 text-sm font-medium transition-colors hover:bg-accent"
        >
          GitHub
        </a>
      </div>
    </div>
  );
}
