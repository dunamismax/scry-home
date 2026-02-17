import { resolve } from "node:path";
import { commandExists, logStep, runOrThrow } from "./lib";

const requiredTools = ["bun", "docker", "git", "curl", "tar"];
const scriptRepoRoot = resolve(import.meta.dir, "..");

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

function ensureManagedProjectDeps(): void {
  logStep("Installing managed project dependencies");
  runOrThrow(["bun", "run", "projects:install"], { cwd: scriptRepoRoot });
}

function setupInfra(): void {
  logStep("Configuring PostgreSQL + Garage defaults");
  runOrThrow(["bun", "run", "setup:storage"]);
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
ensureManagedProjectDeps();
setupInfra();
setupZig();
printSummary();
