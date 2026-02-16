import { useState } from "react";
import { Link, redirect, useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { authClient } from "~/lib/auth-client";
import type { Route } from "./+types/login";

export async function loader({ request }: Route.LoaderArgs) {
  const { getSession } = await import("~/services/auth.server");
  const session = (await getSession(request)) as { user?: { id: string } } | null;

  if (session?.user?.id) {
    throw redirect("/");
  }

  return null;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === "sign-up") {
        const response = await authClient.signUp.email({
          email,
          password,
          name,
        });

        if (response.error) {
          setError(response.error.message ?? "Sign up failed.");
          return;
        }
      } else {
        const response = await authClient.signIn.email({
          email,
          password,
        });

        if (response.error) {
          setError(response.error.message ?? "Sign in failed.");
          return;
        }
      }

      navigate("/");
    } catch {
      setError("Unexpected error during authentication.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg items-center p-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{mode === "sign-up" ? "Create account" : "Welcome back"}</CardTitle>
          <CardDescription>
            {mode === "sign-up" ? "Register with Better Auth." : "Sign in to manage your projects."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            {mode === "sign-up" ? (
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium leading-none">
                  Name
                </label>
                <Input
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Stephen"
                  required
                />
              </div>
            ) : null}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium leading-none">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium leading-none">
                Password
              </label>
              <Input
                id="password"
                type="password"
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                required
              />
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Working..." : mode === "sign-up" ? "Create account" : "Sign in"}
            </Button>
          </form>

          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <button
              type="button"
              className="underline underline-offset-4"
              onClick={() => {
                setError(null);
                setMode((current) => (current === "sign-in" ? "sign-up" : "sign-in"));
              }}
            >
              {mode === "sign-up" ? "Already have an account?" : "Need an account?"}
            </button>
            <Link to="/" className="underline underline-offset-4">
              Back home
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
