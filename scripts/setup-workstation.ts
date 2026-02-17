import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { commandExists, logStep, runOrThrow } from "./lib";

const home = process.env.HOME ?? "/home/sawyer";
const scriptRepoRoot = resolve(import.meta.dir, "..");
const githubRoot = process.env.GITHUB_ROOT
  ? resolve(process.env.GITHUB_ROOT)
  : resolve(home, "github");
const owner = process.env.GITHUB_OWNER ?? "dunamismax";
const anchorRepo = process.env.GITHUB_ANCHOR_REPO ?? "scryai";
const profileRepo = process.env.GITHUB_PROFILE_REPO ?? "dunamismax";
const managedProjectRepos = ["next-web-template", "next-blog-template"];
const reposIndexPath = resolve(githubRoot, profileRepo, "REPOS.md");
const localOnly = process.argv.includes("--local-only");
const useFallback = process.argv.includes("--use-fallback");
const fallbackRepos = [
  "scryai",
  "dunamismax",
  "next-web-template",
  "next-blog-template",
  "BereanAI",
  "TALLstack",
  "c-from-the-ground-up",
  "codex-web",
  "configs",
  "hello-world-from-hell",
  "images",
  "imaging-services-website",
  "imagingservices",
  "mtg-card-bot",
  "mylife-rpg",
  "poddashboard",
  "xray-chrome",
];

function repoDir(repo: string): string {
  return resolve(githubRoot, repo);
}

function githubUrl(repo: string): string {
  return `git@github.com:${owner}/${repo}.git`;
}

function codebergUrl(repo: string): string {
  return `git@codeberg.org:${owner}/${repo}.git`;
}

function uniqueOrdered(items: string[]): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const item of items.map((value) => value.trim()).filter(Boolean)) {
    if (seen.has(item)) {
      continue;
    }
    seen.add(item);
    ordered.push(item);
  }
  return ordered;
}

function ensurePrereqs(): void {
  logStep("Checking workstation bootstrap prerequisites");
  const requiredTools = ["git", "ssh"];
  if (process.argv.includes("--restore-ssh")) {
    requiredTools.push("bun");
  }

  for (const tool of requiredTools) {
    if (!commandExists(tool)) {
      throw new Error(`Missing required tool: ${tool}`);
    }
    console.log(`ok: ${tool}`);
  }
}

function ensureGithubRoot(): void {
  logStep("Ensuring projects root");
  mkdirSync(githubRoot, { recursive: true });
  console.log(`root: ${githubRoot}`);
}

function maybeRestoreSshBackup(): void {
  if (!process.argv.includes("--restore-ssh")) {
    return;
  }

  logStep("Restoring encrypted SSH backup");
  runOrThrow(["bun", "run", "setup:ssh:restore"], { cwd: scriptRepoRoot });
}

function ensureAnchorRepoContext(): void {
  logStep("Ensuring scryai anchor repository");
  if (localOnly && !existsSync(repoDir(anchorRepo))) {
    throw new Error(
      `Anchor repo missing in local-only mode: ${repoDir(anchorRepo)}\nClone first: git clone git@github.com:dunamismax/scryai.git`,
    );
  }
  cloneOrFetch(anchorRepo);
  console.log(`anchor: ${repoDir(anchorRepo)}`);
  if (resolve(scriptRepoRoot) !== resolve(repoDir(anchorRepo))) {
    console.log(`note: running from ${scriptRepoRoot}`);
    console.log(`note: canonical anchor is ${repoDir(anchorRepo)}`);
  }
}

function cloneOrFetch(repo: string): void {
  const targetDir = repoDir(repo);

  if (!existsSync(targetDir)) {
    if (localOnly) {
      throw new Error(`Repository missing in local-only mode: ${targetDir}`);
    }
    logStep(`Cloning ${repo}`);
    runOrThrow(["git", "clone", githubUrl(repo), targetDir]);
    return;
  }

  if (!existsSync(resolve(targetDir, ".git"))) {
    throw new Error(`Path exists but is not a git repository: ${targetDir}`);
  }

  if (localOnly) {
    logStep(`Using local repository ${repo}`);
    return;
  }

  logStep(`Fetching ${repo}`);
  runOrThrow(["git", "-C", targetDir, "fetch", "--all", "--prune"]);
}

function remoteExists(targetDir: string, remote: string): boolean {
  const remotes = runOrThrow(["git", "-C", targetDir, "remote"], { quiet: true })
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return remotes.includes(remote);
}

function ensureDualPushUrls(repo: string): void {
  const targetDir = repoDir(repo);
  const github = githubUrl(repo);
  const codeberg = codebergUrl(repo);

  if (!remoteExists(targetDir, "origin")) {
    runOrThrow(["git", "-C", targetDir, "remote", "add", "origin", github]);
  }

  runOrThrow(["git", "-C", targetDir, "remote", "set-url", "origin", github]);
  const clearPushUrls = Bun.spawnSync({
    cmd: ["git", "-C", targetDir, "config", "--unset-all", "remote.origin.pushurl"],
    stdout: "ignore",
    stderr: "ignore",
  });

  if (![0, 1, 5].includes(clearPushUrls.exitCode)) {
    throw new Error(`Failed to clear origin.pushurl for ${repo} (exit ${clearPushUrls.exitCode}).`);
  }

  runOrThrow(["git", "-C", targetDir, "remote", "set-url", "--add", "--push", "origin", github]);
  runOrThrow(["git", "-C", targetDir, "remote", "set-url", "--add", "--push", "origin", codeberg]);
}

function parseReposFromIndex(markdown: string): string[] {
  const lines = markdown.split(/\r?\n/);
  const repos: string[] = [];
  let inRepositoriesSection = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("## ")) {
      if (trimmed === "## Repositories") {
        inRepositoriesSection = true;
        continue;
      }
      if (inRepositoriesSection) {
        break;
      }
    }

    if (!inRepositoriesSection) {
      continue;
    }

    const match = trimmed.match(/^###\s+([A-Za-z0-9._-]+)\s*$/);
    if (match) {
      repos.push(match[1]);
    }
  }

  return uniqueOrdered(repos);
}

type RepoPlan = {
  discoveredRepos: string[];
  source: "fallback" | "index";
  syncedRepos: string[];
};

function loadRepoPlan(): RepoPlan {
  let parsedFromIndex: string[] = [];

  if (existsSync(reposIndexPath)) {
    const indexContents = readFileSync(reposIndexPath, "utf8");
    parsedFromIndex = parseReposFromIndex(indexContents);
  }

  if (parsedFromIndex.length === 0) {
    if (!useFallback) {
      throw new Error(
        `No repositories parsed from ${reposIndexPath}. Re-run with --use-fallback to load the built-in discovery list.`,
      );
    }

    const syncedRepos = uniqueOrdered([anchorRepo, profileRepo, ...managedProjectRepos]);
    const discoveredRepos = uniqueOrdered([...syncedRepos, ...fallbackRepos]);

    logStep("Repository set");
    console.log(`warning: using fallback discovery list from ${reposIndexPath}`);
    console.log(
      "warning: fallback mode is discovery-only; only anchor/profile/managed repos will be cloned or remote-configured",
    );
    for (const repo of discoveredRepos) {
      console.log(`- ${repo}`);
    }

    return {
      discoveredRepos,
      source: "fallback",
      syncedRepos,
    };
  }

  const syncedRepos = uniqueOrdered([
    anchorRepo,
    profileRepo,
    ...managedProjectRepos,
    ...parsedFromIndex,
  ]);

  logStep("Repository set");
  for (const repo of syncedRepos) {
    console.log(`- ${repo}`);
  }

  return {
    discoveredRepos: syncedRepos,
    source: "index",
    syncedRepos,
  };
}

function configureRemotes(repos: string[]): void {
  logStep("Enforcing dual push URL policy");
  for (const repo of repos) {
    ensureDualPushUrls(repo);
  }
}

function printRemoteSummary(repos: string[]): void {
  logStep("Remote summary");
  for (const repo of repos) {
    const pushUrls = runOrThrow(
      ["git", "-C", repoDir(repo), "remote", "get-url", "--all", "--push", "origin"],
      { quiet: true },
    )
      .split("\n")
      .filter(Boolean)
      .join(" | ");

    console.log(`${repo}: ${pushUrls}`);
  }
}

function printFallbackDiscoverySummary(discoveredRepos: string[], syncedRepos: string[]): void {
  const synced = new Set(syncedRepos);
  const discoveryOnlyRepos = discoveredRepos.filter((repo) => !synced.has(repo));
  if (discoveryOnlyRepos.length === 0) {
    return;
  }

  logStep("Fallback discovery-only repositories");
  for (const repo of discoveryOnlyRepos) {
    const targetDir = repoDir(repo);
    const present = existsSync(targetDir) && existsSync(resolve(targetDir, ".git"));
    console.log(`${repo}: ${present ? "present" : "missing"} (${targetDir})`);
  }
}

function main(): void {
  ensurePrereqs();
  ensureGithubRoot();
  ensureAnchorRepoContext();
  maybeRestoreSshBackup();

  cloneOrFetch(profileRepo);
  const repoPlan = loadRepoPlan();

  for (const repo of repoPlan.syncedRepos) {
    if (repo === anchorRepo || repo === profileRepo) {
      continue;
    }
    cloneOrFetch(repo);
  }

  configureRemotes(repoPlan.syncedRepos);
  printRemoteSummary(repoPlan.syncedRepos);
  if (repoPlan.source === "fallback") {
    printFallbackDiscoverySummary(repoPlan.discoveredRepos, repoPlan.syncedRepos);
  }

  logStep("Workstation bootstrap complete");
  if (localOnly) {
    console.log("mode: local-only");
  }
  if (repoPlan.source === "fallback") {
    console.log("mode: fallback-discovery-only");
  }
  console.log("next: bun run bootstrap");
}

main();
