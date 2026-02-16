import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { commandExists, logStep, runOrThrow } from "./lib";

const requiredTools = ["bun", "docker", "git", "curl", "tar"];

function checkPrereqs(): void {
  logStep("Checking prerequisites");
  for (const tool of requiredTools) {
    if (!commandExists(tool)) {
      throw new Error(`Missing required tool: ${tool}`);
    }
    console.log(`ok: ${tool}`);
  }
}

function ensureDeps(): void {
  logStep("Installing root dependencies");
  runOrThrow(["bun", "install"]);
}

function ensureAppDeps(): void {
  const appsRoot = resolve(import.meta.dir, "..", "apps");
  if (!existsSync(appsRoot)) {
    return;
  }

  const apps = readdirSync(appsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => existsSync(resolve(appsRoot, name, "package.json")));

  if (apps.length === 0) {
    return;
  }

  logStep("Installing app dependencies");
  for (const app of apps) {
    console.log(`app: ${app}`);
    runOrThrow(["bun", "install"], { cwd: resolve(appsRoot, app) });
  }
}

function setupInfra(): void {
  logStep("Configuring MinIO + Postgres + Caddy defaults");
  runOrThrow(["bun", "run", "setup:minio"]);
}

function setupZig(): void {
  logStep("Ensuring Zig is installed");
  runOrThrow(["bun", "run", "setup:zig"]);
}

function printSummary(): void {
  logStep("Bootstrap complete");
  const bunVersion = runOrThrow(["bun", "--version"], { quiet: true });
  const zigVersion = runOrThrow(["zig", "version"], { quiet: true });
  console.log(`bun: ${bunVersion}`);
  console.log(`zig: ${zigVersion}`);
  console.log("next: bun run infra:up");
}

checkPrereqs();
ensureDeps();
ensureAppDeps();
setupInfra();
setupZig();
printSummary();
