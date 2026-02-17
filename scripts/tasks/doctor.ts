import { existsSync } from "node:fs";
import { join } from "node:path";
import { commandExists, logStep, runOrThrow } from "../common";
import { MANAGED_PROJECTS } from "../projects.config";

export function doctor(): void {
  logStep("Toolchain status");
  for (const tool of ["bun", "git", "docker"]) {
    if (!commandExists(tool)) {
      console.log(`missing: ${tool}`);
      continue;
    }

    const version =
      runOrThrow([tool, "--version"], { quiet: true }).split("\n")[0] ??
      "unknown";
    console.log(`${tool}: ${version}`);
  }

  logStep("Core files");
  for (const file of ["SOUL.md", "AGENTS.md", "README.md", "scripts/cli.ts"]) {
    console.log(
      `${file}: ${existsSync(join(process.cwd(), file)) ? "ok" : "missing"}`,
    );
  }

  logStep("Managed projects");
  if (MANAGED_PROJECTS.length === 0) {
    console.log("(none configured)");
    return;
  }

  for (const project of MANAGED_PROJECTS) {
    const hasRepo =
      existsSync(project.path) && existsSync(join(project.path, ".git"));
    console.log(
      `${project.name}: ${hasRepo ? "ok" : "missing"} (${project.path})`,
    );
    if (!hasRepo) {
      continue;
    }

    const branch = runOrThrow(["git", "branch", "--show-current"], {
      cwd: project.path,
      quiet: true,
    });

    const pushUrls = runOrThrow(
      ["git", "remote", "get-url", "--all", "--push", "origin"],
      {
        cwd: project.path,
        quiet: true,
      },
    );

    const urls = pushUrls
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join(" | ");

    console.log(`branch: ${branch}`);
    console.log(`push: ${urls}`);
  }
}
