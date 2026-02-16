import { betterAuth } from "better-auth";
import { sql } from "~/services/db.server";
import { env } from "~/services/env.server";

type QueryConfig = {
  text: string;
  values?: readonly unknown[];
};

type QueryResponse = {
  rows: unknown[];
  rowCount: number;
};

function toQueryConfig(query: string | QueryConfig, values?: readonly unknown[]): QueryConfig {
  if (typeof query === "string") {
    return {
      text: query,
      values,
    };
  }

  return query;
}

const pgCompatiblePool = {
  async connect() {
    return {
      query: async (
        query: string | QueryConfig,
        values?: readonly unknown[],
      ): Promise<QueryResponse> => {
        const config = toQueryConfig(query, values);
        const result = await sql.unsafe(config.text, [...(config.values ?? [])] as never[]);
        const rowCount = typeof result.count === "number" ? result.count : result.length;
        return {
          rows: result,
          rowCount,
        };
      },
      release() {
        return;
      },
    };
  },
  async end() {
    await sql.end({ timeout: 5 });
  },
};

export const auth = betterAuth({
  database: pgCompatiblePool as never,
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: [env.BETTER_AUTH_URL],
});

export async function getSession(request: Request) {
  return auth.api.getSession({
    headers: request.headers,
  });
}
