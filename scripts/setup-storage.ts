import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { ensureDir, logStep, runOrThrow } from "./lib";

const repoRoot = resolve(import.meta.dir, "..");
const envExamplePath = resolve(repoRoot, "infra/.env.example");
const envPath = resolve(repoRoot, "infra/.env");
const garageConfigExamplePath = resolve(repoRoot, "infra/garage.toml.example");
const garageConfigPath = resolve(repoRoot, "infra/garage.toml");
const garageMetaDir = resolve(repoRoot, "infra/data/garage/meta");
const garageDataDir = resolve(repoRoot, "infra/data/garage/data");

function ensureEnvFile(): void {
  logStep("Ensuring infra env file");
  if (!existsSync(envPath)) {
    copyFileSync(envExamplePath, envPath);
    console.log(`created: ${envPath}`);
    return;
  }

  const envTemplate = readFileSync(envExamplePath, "utf8");
  const currentEnv = readFileSync(envPath, "utf8");

  const currentKeys = new Set(
    currentEnv
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith("#"))
      .map((line) => line.split("=")[0]?.trim())
      .filter(Boolean),
  );

  const missingLines = envTemplate
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"))
    .filter((line) => !currentKeys.has(line.split("=")[0]?.trim() ?? ""));

  if (missingLines.length === 0) {
    console.log(`exists: ${envPath}`);
    return;
  }

  const nextEnv = `${currentEnv.trimEnd()}\n\n${missingLines.join("\n")}\n`;
  writeFileSync(envPath, nextEnv);
  console.log(`updated: ${envPath}`);
  for (const line of missingLines) {
    console.log(`added: ${line.split("=")[0]}`);
  }
}

function ensureGarageConfig(): void {
  logStep("Ensuring Garage config file");
  if (!existsSync(garageConfigPath)) {
    copyFileSync(garageConfigExamplePath, garageConfigPath);
    console.log(`created: ${garageConfigPath}`);
  } else {
    console.log(`exists: ${garageConfigPath}`);
  }
}

function ensureDataDirs(): void {
  logStep("Ensuring Garage data directories");
  ensureDir(garageMetaDir);
  ensureDir(garageDataDir);
  console.log(`ready: ${garageMetaDir}`);
  console.log(`ready: ${garageDataDir}`);
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
ensureGarageConfig();
ensureDataDirs();
maybeStartInfra();
showComposeHint();
