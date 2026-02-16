import { copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { ensureDir, logStep, runOrThrow } from "./lib";

const repoRoot = resolve(import.meta.dir, "..");
const envExamplePath = resolve(repoRoot, "infra/.env.example");
const envPath = resolve(repoRoot, "infra/.env");
const minioDataDir = resolve(repoRoot, "infra/data/minio");

function ensureEnvFile(): void {
  logStep("Ensuring infra env file");
  if (!existsSync(envPath)) {
    copyFileSync(envExamplePath, envPath);
    console.log(`created: ${envPath}`);
  } else {
    console.log(`exists: ${envPath}`);
  }
}

function ensureDataDirs(): void {
  logStep("Ensuring MinIO data directory");
  ensureDir(minioDataDir);
  console.log(`ready: ${minioDataDir}`);
}

function showComposeHint(): void {
  logStep("Infra ready");
  console.log("run: bun run infra:up");
  console.log("logs: bun run infra:logs");
}

function maybeStartInfra(): void {
  if (process.argv.includes("--up")) {
    logStep("Starting infra services");
    runOrThrow(["bun", "run", "infra:up"]);
  }
}

ensureEnvFile();
ensureDataDirs();
maybeStartInfra();
showComposeHint();
