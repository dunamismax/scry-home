import { sql } from "~/services/db.server";
import { getBoss } from "~/services/jobs.server";
import { ensureStorageBucket } from "~/services/storage.server";

export interface ServiceStatus {
  status: "ok" | "error";
  detail: string;
}

export interface StackStatus {
  database: ServiceStatus;
  objectStorage: ServiceStatus;
  backgroundJobs: ServiceStatus;
}

export async function getStackStatus(): Promise<StackStatus> {
  const [database, objectStorage, backgroundJobs] = await Promise.all([
    checkDatabase(),
    checkObjectStorage(),
    checkBackgroundJobs(),
  ]);

  return {
    database,
    objectStorage,
    backgroundJobs,
  };
}

async function checkDatabase(): Promise<ServiceStatus> {
  try {
    await sql`select 1`;
    return {
      status: "ok",
      detail: "postgres.js connected",
    };
  } catch (error) {
    return {
      status: "error",
      detail: toErrorMessage(error),
    };
  }
}

async function checkObjectStorage(): Promise<ServiceStatus> {
  try {
    await ensureStorageBucket();
    return {
      status: "ok",
      detail: "MinIO bucket reachable",
    };
  } catch (error) {
    return {
      status: "error",
      detail: toErrorMessage(error),
    };
  }
}

async function checkBackgroundJobs(): Promise<ServiceStatus> {
  try {
    await getBoss();
    return {
      status: "ok",
      detail: "pg-boss started",
    };
  } catch (error) {
    return {
      status: "error",
      detail: toErrorMessage(error),
    };
  }
}

function toErrorMessage(value: unknown): string {
  if (value instanceof Error) {
    return value.message;
  }

  return "Unknown error";
}
