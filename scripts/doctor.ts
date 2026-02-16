import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { commandExists, logStep, runOrThrow } from "./lib";

const repoRoot = resolve(import.meta.dir, "..");
const checks = ["bun", "docker", "git", "zig"];

logStep("Toolchain status");
for (const tool of checks) {
  if (!commandExists(tool)) {
    console.log(`missing: ${tool}`);
    continue;
  }
  const versionCmd = tool === "zig" ? [tool, "version"] : [tool, "--version"];
  const version = runOrThrow(versionCmd, { quiet: true }).split("\n")[0];
  console.log(`${tool}: ${version}`);
}

logStep("Infra files");
const infraFiles = [
  "infra/docker-compose.yml",
  "infra/Caddyfile",
  "infra/.env.example",
  "infra/.env",
];
for (const file of infraFiles) {
  const full = resolve(repoRoot, file);
  console.log(`${file}: ${existsSync(full) ? "ok" : "missing"}`);
}

logStep("Monorepo apps");
const appFiles = ["apps/README.md", "apps/scrybase/package.json"];
for (const file of appFiles) {
  const full = resolve(repoRoot, file);
  console.log(`${file}: ${existsSync(full) ? "ok" : "missing"}`);
}
