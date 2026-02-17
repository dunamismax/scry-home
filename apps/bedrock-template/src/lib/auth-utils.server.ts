import type { RequestEventCommon } from "@builder.io/qwik-city";

import { auth } from "~/lib/auth.server";
import { hasPermission, type Permission, type Role } from "~/lib/rbac";

export type AppUser = {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  emailVerified: boolean;
  role: Role;
  isActive: boolean;
};

export type AppSession = {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type AuthState = {
  user: AppUser;
  session: AppSession;
};

const authStateCacheKey = "__auth-state-promise__";

function asRole(value: unknown): Role {
  if (value === "admin" || value === "manager" || value === "member") {
    return value;
  }
  return "member";
}

export async function getAuthState(request: Request): Promise<AuthState | null> {
  const state = await auth.api.getSession({ headers: request.headers });

  if (!state?.user || !state.session) {
    return null;
  }

  return {
    user: {
      id: state.user.id,
      email: state.user.email,
      name: state.user.name,
      image: state.user.image,
      emailVerified: state.user.emailVerified,
      role: asRole((state.user as Record<string, unknown>).role),
      isActive: Boolean((state.user as Record<string, unknown>).isActive ?? true),
    },
    session: {
      id: state.session.id,
      token: state.session.token,
      userId: state.session.userId,
      expiresAt: state.session.expiresAt,
      createdAt: state.session.createdAt,
      updatedAt: state.session.updatedAt,
    },
  };
}

export function getEventAuthState(event: RequestEventCommon): Promise<AuthState | null> {
  const cached = event.sharedMap.get(authStateCacheKey);
  if (cached) {
    return cached as Promise<AuthState | null>;
  }

  const pending = getAuthState(event.request);
  event.sharedMap.set(authStateCacheKey, pending);
  return pending;
}

export async function requireAuth(event: RequestEventCommon): Promise<AuthState> {
  const authState = await getEventAuthState(event);

  if (!authState) {
    throw event.redirect(302, toSignInUrl(event.url));
  }

  if (!authState.user.isActive) {
    throw event.redirect(302, "/auth/sign-in?error=account-disabled");
  }

  return authState;
}

export async function requirePermission(
  event: RequestEventCommon,
  permission: Permission,
): Promise<AuthState> {
  const authState = await requireAuth(event);

  if (!hasPermission(authState.user.role, permission)) {
    throw event.redirect(302, "/dashboard?error=forbidden");
  }

  return authState;
}

export function toSignInUrl(url: URL): string {
  const next = encodeURIComponent(`${url.pathname}${url.search}`);
  return `/auth/sign-in?next=${next}`;
}

export function safeRedirectPath(value: FormDataEntryValue | string | null): string {
  if (typeof value !== "string" || value.length === 0) {
    return "/dashboard";
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  if (value.startsWith("/api/")) {
    return "/dashboard";
  }

  return value;
}

export function extractSetCookieHeader(result: unknown): string | null {
  if (result instanceof Response) {
    return result.headers.get("set-cookie");
  }

  if (typeof result !== "object" || result === null) {
    return null;
  }

  if (
    "headers" in result &&
    result.headers instanceof Headers &&
    result.headers.has("set-cookie")
  ) {
    return result.headers.get("set-cookie");
  }

  return null;
}
