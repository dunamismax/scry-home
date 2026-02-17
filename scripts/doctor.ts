import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { commandExists, logStep, runOrThrow } from "./lib";
import { managedProjects } from "./projects-config";

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
  "infra/garage.toml.example",
  "infra/garage.toml",
  "infra/.env.example",
  "infra/.env",
];
for (const file of infraFiles) {
  const full = resolve(repoRoot, file);
  console.log(`${file}: ${existsSync(full) ? "ok" : "missing"}`);
}

logStep("Managed projects");
for (const project of managedProjects) {
  const hasRepo = existsSync(project.path) && existsSync(resolve(project.path, ".git"));
  console.log(`${project.name}: ${hasRepo ? "ok" : "missing"} (${project.path})`);
  if (!hasRepo) {
    continue;
  }

  const branch = runOrThrow(["git", "-C", project.path, "branch", "--show-current"], {
    quiet: true,
  });
  const pushUrls = runOrThrow(
    ["git", "-C", project.path, "remote", "get-url", "--all", "--push", "origin"],
    { quiet: true },
  )
    .split("\n")
    .filter(Boolean)
    .join(" | ");

  console.log(`branch: ${branch}`);
  console.log(`push: ${pushUrls}`);
}
