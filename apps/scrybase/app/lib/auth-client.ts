import { createAuthClient } from "better-auth/react";

const fallbackUrl =
  typeof window === "undefined" ? "http://localhost:3000" : window.location.origin;

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_BETTER_AUTH_URL ?? fallbackUrl,
});
