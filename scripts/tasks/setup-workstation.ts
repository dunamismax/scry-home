import { existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, join, resolve } from "node:path";
import {
  commandExists,
  hasEnv,
  isGitRepo,
  logStep,
  runOrThrow,
} from "../common";
import { MANAGED_PROJECTS } from "../projects.config";

/** Scan a directory for git repos, returning their directory names. */
function discoverRepos(root: string): string[] {
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true })
    .filter((d) => d.isDirectory() && isGitRepo(join(root, d.name)))
    .map((d) => d.name);
}

function unique(items: string[]): string[] {
  return [
    ...new Set(
      items.map((item) => item.trim()).filter((item) => item.length > 0),
    ),
  ];
}

function repoNameFromPath(path: string): string {
  const normalized = path.trim().replace(/\/+$/, "");
  return basename(normalized);
}

export function parseReposFromIndex(markdown: string): string[] {
  const repos: string[] = [];
  let inSection = false;

  for (const rawLine of markdown.split("\n")) {
    const line = rawLine.trim();

    if (line.startsWith("## ")) {
      if (line === "## Repositories") {
        inSection = true;
        continue;
      }
      if (inSection) {
        break;
      }
    }

    if (!inSection) {
      continue;
    }

    const match = line.match(/^###\s+([A-Za-z0-9._-]+)\s*$/);
    if (match?.[1]) {
      repos.push(match[1]);
    }
  }

  return unique(repos);
}

export function setupWorkstation(): void {
  const home = process.env.HOME ?? homedir();
  const scriptRepoRoot = resolve(".");
  const githubRoot = process.env.GITHUB_ROOT ?? join(home, "github");
  const owner = process.env.GITHUB_OWNER ?? "dunamismax";
  const githubHostAlias =
    process.env.GITHUB_HOST_ALIAS ?? `github.com-${owner}`;
  const codebergHostAlias =
    process.env.CODEBERG_HOST_ALIAS ?? `codeberg.org-${owner}`;
  const anchorRepo = process.env.GITHUB_ANCHOR_REPO ?? "grimoire";
  const profileRepo = process.env.GITHUB_PROFILE_REPO ?? "dunamismax";
  const reposIndexPath = join(githubRoot, profileRepo, "REPOS.md");
  const managedProjectRepos = unique(
    MANAGED_PROJECTS.map((project) => repoNameFromPath(project.path)).filter(
      (repo) => repo.length > 0,
    ),
  );

  const localOnly = hasEnv("LOCAL_ONLY");
  const useFallback = hasEnv("USE_FALLBACK");
  const restoreSsh = hasEnv("RESTORE_SSH");

  const repoDir = (repo: string) => join(githubRoot, repo);
  const githubUrl = (repo: string) =>
    `git@${githubHostAlias}:${owner}/${repo}.git`;
  const codebergUrl = (repo: string) =>
    `git@${codebergHostAlias}:${owner}/${repo}.git`;

  const cloneOrFetch = (repo: string) => {
    const target = repoDir(repo);

    if (!existsSync(target)) {
      if (localOnly) {
        throw new Error(`Repository missing in local-only mode: ${target}`);
      }

      logStep(`Cloning ${repo}`);
      runOrThrow(["git", "clone", githubUrl(repo), target]);
      return;
    }

    if (!isGitRepo(target)) {
      throw new Error(`Path exists but is not a git repository: ${target}`);
    }

    if (localOnly) {
      logStep(`Using local repository ${repo}`);
      return;
    }

    logStep(`Fetching ${repo}`);
    runOrThrow(["git", "fetch", "--all", "--prune"], { cwd: target });
  };

  const ensureDualPushUrls = (repo: string) => {
    const target = repoDir(repo);
    const gh = githubUrl(repo);
    const cb = codebergUrl(repo);

    const remotes = runOrThrow(["git", "remote"], { cwd: target, quiet: true })
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (!remotes.includes("origin")) {
      runOrThrow(["git", "remote", "add", "origin", gh], { cwd: target });
    }

    runOrThrow(["git", "remote", "set-url", "origin", gh], { cwd: target });

    Bun.spawnSync({
      cmd: [
        "git",
        "-C",
        target,
        "config",
        "--unset-all",
        "remote.origin.pushurl",
      ],
      stdout: "ignore",
      stderr: "ignore",
    });

    runOrThrow(["git", "remote", "set-url", "--add", "--push", "origin", gh], {
      cwd: target,
    });
    runOrThrow(["git", "remote", "set-url", "--add", "--push", "origin", cb], {
      cwd: target,
    });
  };

  logStep("Checking workstation bootstrap prerequisites");
  const required = ["git", "ssh", ...(restoreSsh ? ["bun"] : [])];
  for (const tool of required) {
    if (!commandExists(tool)) {
      throw new Error(`Missing required tool: ${tool}`);
    }
    console.log(`ok: ${tool}`);
  }

  logStep("Ensuring projects root");
  mkdirSync(githubRoot, { recursive: true });
  console.log(`root: ${githubRoot}`);

  cloneOrFetch(anchorRepo);
  if (resolve(repoDir(anchorRepo)) !== scriptRepoRoot) {
    console.log(`note: running from ${scriptRepoRoot}`);
    console.log(`note: canonical anchor is ${resolve(repoDir(anchorRepo))}`);
  }

  if (restoreSsh) {
    logStep("Restoring encrypted SSH backup");
    runOrThrow(["bun", "run", "scry:setup:ssh_restore"], {
      cwd: scriptRepoRoot,
    });
  }

  cloneOrFetch(profileRepo);

  const parsed = existsSync(reposIndexPath)
    ? parseReposFromIndex(readFileSync(reposIndexPath, "utf8"))
    : [];

  let synced: string[];
  let discovered: string[];
  let source: "index" | "fallback";

  if (parsed.length === 0) {
    if (!useFallback) {
      throw new Error(
        `No repositories parsed from ${reposIndexPath}. Re-run with USE_FALLBACK=1 to load the built-in discovery list.`,
      );
    }

    synced = unique([anchorRepo, profileRepo, ...managedProjectRepos]);
    discovered = unique([...synced, ...discoverRepos(githubRoot)]);
    source = "fallback";

    logStep("Repository set");
    console.log(
      `warning: using fallback discovery list from ${reposIndexPath}`,
    );
    console.log(
      "warning: fallback mode is discovery-only; only anchor/profile/managed repos will be cloned or remote-configured",
    );
    for (const repo of discovered) {
      console.log(`- ${repo}`);
    }
  } else {
    synced = unique([
      anchorRepo,
      profileRepo,
      ...managedProjectRepos,
      ...parsed,
    ]);
    discovered = synced;
    source = "index";

    logStep("Repository set");
    for (const repo of synced) {
      console.log(`- ${repo}`);
    }
  }

  for (const repo of synced) {
    if (repo === anchorRepo || repo === profileRepo) {
      continue;
    }
    cloneOrFetch(repo);
  }

  logStep("Enforcing dual push URL policy");
  for (const repo of synced) {
    ensureDualPushUrls(repo);
  }

  logStep("Remote summary");
  for (const repo of synced) {
    const pushUrls = runOrThrow(
      ["git", "remote", "get-url", "--all", "--push", "origin"],
      {
        cwd: repoDir(repo),
        quiet: true,
      },
    );

    const urls = pushUrls
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join(" | ");

    console.log(`${repo}: ${urls}`);
  }

  if (source === "fallback") {
    const syncedSet = new Set(synced);
    const discoveryOnly = discovered.filter((repo) => !syncedSet.has(repo));

    if (discoveryOnly.length > 0) {
      logStep("Fallback discovery-only repositories");
      for (const repo of discoveryOnly) {
        const target = repoDir(repo);
        const present = isGitRepo(target);
        console.log(`${repo}: ${present ? "present" : "missing"} (${target})`);
      }
    }
  }

  logStep("Workstation bootstrap complete");
  if (localOnly) {
    console.log("mode: local-only");
  }
  if (source === "fallback") {
    console.log("mode: fallback-discovery-only");
  }
  console.log("next: bun run scry:bootstrap");
}
