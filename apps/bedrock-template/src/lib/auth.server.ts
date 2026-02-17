import { betterAuth } from "better-auth";
import { PostgresJSDialect } from "kysely-postgres-js";

import { db } from "~/lib/db.server";
import { env } from "~/lib/env.server";

export const auth = betterAuth({
  appName: "website-template",
  baseURL: env.BETTER_AUTH_URL,
  basePath: "/api/auth",
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: env.trustedOrigins,
  database: {
    type: "postgres",
    dialect: new PostgresJSDialect({ postgres: db }),
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "member",
        input: false,
      },
      isActive: {
        type: "boolean",
        required: true,
        defaultValue: true,
        input: false,
      },
    },
  },
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 120,
    customRules: {
      "/sign-in/email": {
        window: 60,
        max: 10,
      },
      "/sign-up/email": {
        window: 60,
        max: 6,
      },
      "/request-password-reset": {
        window: 300,
        max: 5,
      },
    },
  },
  advanced: {
    useSecureCookies: env.NODE_ENV === "production",
    defaultCookieAttributes: {
      secure: env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    },
    crossSubDomainCookies: env.SESSION_COOKIE_DOMAIN
      ? {
          enabled: true,
          domain: env.SESSION_COOKIE_DOMAIN,
        }
      : undefined,
  },
});
