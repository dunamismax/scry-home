function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function toBoolean(value: string | undefined, fallback: boolean): boolean {
  if (!value) {
    return fallback;
  }

  return value === "true" || value === "1";
}

export const env = {
  get DATABASE_URL() {
    return required("DATABASE_URL");
  },
  get BETTER_AUTH_SECRET() {
    return required("BETTER_AUTH_SECRET");
  },
  get BETTER_AUTH_URL() {
    return process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  },
  get MINIO_ENDPOINT() {
    return process.env.MINIO_ENDPOINT ?? "http://localhost:19000";
  },
  get MINIO_REGION() {
    return process.env.MINIO_REGION ?? "us-east-1";
  },
  get MINIO_ACCESS_KEY() {
    return process.env.MINIO_ACCESS_KEY ?? "minioadmin";
  },
  get MINIO_SECRET_KEY() {
    return process.env.MINIO_SECRET_KEY ?? "minioadmin123";
  },
  get MINIO_BUCKET() {
    return process.env.MINIO_BUCKET ?? "scrybase-documents";
  },
  get MINIO_FORCE_PATH_STYLE() {
    return toBoolean(process.env.MINIO_FORCE_PATH_STYLE, true);
  },
  get PG_BOSS_SCHEMA() {
    return process.env.PG_BOSS_SCHEMA ?? "pgboss";
  },
} as const;
