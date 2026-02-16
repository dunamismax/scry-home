import postgres from "postgres";
import { env } from "~/services/env.server";

declare global {
  // eslint-disable-next-line no-var
  var __scrybaseSql: ReturnType<typeof postgres> | undefined;
}

const sqlClient =
  globalThis.__scrybaseSql ??
  postgres(env.DATABASE_URL, {
    max: 10,
    idle_timeout: 10,
    prepare: false,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__scrybaseSql = sqlClient;
}

export const sql = sqlClient;
