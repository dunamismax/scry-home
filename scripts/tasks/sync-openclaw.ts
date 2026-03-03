/**
 * sync-openclaw
 *
 * One-directional sync: OpenClaw workspace → this repo.
 * The OpenClaw workspace is canonical for identity and memory.
 * Code agents should not edit SOUL.md or AGENTS.md in this repo directly;
 * changes flow from the workspace copy outward.
 *
 * Sync map:
 *   ~/.openclaw/workspace/SOUL.md      → <repo>/SOUL.md
 *   ~/.openclaw/workspace/AGENTS.md    → <repo>/AGENTS.md
 *   ~/.openclaw/workspace/IDENTITY.md  → <repo>/openclaw/IDENTITY.md
 *   ~/.openclaw/workspace/USER.md      → <repo>/openclaw/USER.md
 *   ~/.openclaw/workspace/TOOLS.md     → <repo>/openclaw/TOOLS.md
 *   ~/.openclaw/workspace/HEARTBEAT.md → <repo>/openclaw/HEARTBEAT.md
 *   ~/.openclaw/workspace/memory/      → <repo>/openclaw/memory/
 *   ~/.openclaw/cron/jobs.json         → <repo>/openclaw/cron-jobs.json
 *   ~/.openclaw/exec-approvals.json    → <repo>/openclaw/exec-approvals.json
 *
 * Secrets (openclaw.json, credentials/, tokens) are NOT synced here.
 * Use `bun run scry:setup:config_backup` for encrypted secret backups.
 *
 * Usage:
 *   bun run scry:sync:openclaw               # sync only
 *   bun run scry:sync:openclaw -- --commit   # sync + git commit + push
 */

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { logStep } from "../common";

const OPENCLAW_WORKSPACE =
  process.env.OPENCLAW_WORKSPACE ??
  join(process.env.HOME ?? homedir(), ".openclaw", "workspace");

const OPENCLAW_ROOT =
  process.env.OPENCLAW_ROOT ?? join(process.env.HOME ?? homedir(), ".openclaw");

const REPO_ROOT = resolve(".");

/** Files synced to repo root (identity docs shared with code agents). */
const ROOT_FILES = ["SOUL.md", "AGENTS.md"] as const;

/** Files synced to openclaw/ directory. */
const OPENCLAW_FILES = [
  "IDENTITY.md",
  "MEMORY.md",
  "USER.md",
  "TOOLS.md",
  "HEARTBEAT.md",
] as const;

/** Extra files from ~/.openclaw/ (not workspace) synced to openclaw/. */
const EXTRA_FILES: ReadonlyArray<{ src: string; dest: string }> = [
  { src: "cron/jobs.json", dest: "cron-jobs.json" },
  { src: "exec-approvals.json", dest: "exec-approvals.json" },
];

type SyncResult = {
  copied: number;
  skipped: number;
  deleted: number;
  errors: string[];
};

function filesMatch(a: string, b: string): boolean {
  if (!existsSync(a) || !existsSync(b)) return false;
  const aStat = statSync(a);
  const bStat = statSync(b);
  if (aStat.size !== bStat.size) return false;
  const aContent = readFileSync(a);
  const bContent = readFileSync(b);
  return aContent.equals(bContent);
}

function ensureDir(path: string): void {
  mkdirSync(path, { recursive: true });
}

function syncFile(src: string, dest: string, result: SyncResult): void {
  if (!existsSync(src)) return;

  if (filesMatch(src, dest)) {
    result.skipped++;
    return;
  }

  try {
    ensureDir(dirname(dest));
    copyFileSync(src, dest);
    console.log(`  [COPY] ${src} → ${dest}`);
    result.copied++;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`  [ERROR] ${src}: ${msg}`);
    result.errors.push(msg);
  }
}

function syncMemory(result: SyncResult): void {
  const srcDir = join(OPENCLAW_WORKSPACE, "memory");
  const destDir = join(REPO_ROOT, "openclaw", "memory");

  if (!existsSync(srcDir)) {
    console.log("  [SKIP] no memory directory in workspace");
    return;
  }

  ensureDir(destDir);

  const srcFiles = new Set(
    readdirSync(srcDir).filter((f) => f.endsWith(".md")),
  );
  const destFiles = new Set(
    existsSync(destDir)
      ? readdirSync(destDir).filter((f) => f.endsWith(".md"))
      : [],
  );

  // Copy new/updated memory files
  for (const file of srcFiles) {
    syncFile(join(srcDir, file), join(destDir, file), result);
  }

  // Remove memory files that no longer exist in workspace
  for (const file of destFiles) {
    if (!srcFiles.has(file)) {
      const destPath = join(destDir, file);
      try {
        rmSync(destPath);
        console.log(`  [DELETE] ${destPath}`);
        result.deleted++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`  [ERROR] delete ${destPath}: ${msg}`);
        result.errors.push(msg);
      }
    }
  }
}

export function syncOpenclaw(): void {
  const commit = Bun.argv.includes("--commit");

  logStep("Syncing OpenClaw workspace → repo");
  console.log(`  workspace: ${OPENCLAW_WORKSPACE}`);
  console.log(`  repo:      ${REPO_ROOT}`);

  if (!existsSync(OPENCLAW_WORKSPACE)) {
    throw new Error(`OpenClaw workspace not found: ${OPENCLAW_WORKSPACE}`);
  }

  const result: SyncResult = { copied: 0, skipped: 0, deleted: 0, errors: [] };

  // Sync identity docs to repo root
  logStep("Identity docs → repo root");
  for (const file of ROOT_FILES) {
    syncFile(join(OPENCLAW_WORKSPACE, file), join(REPO_ROOT, file), result);
  }

  // Sync workspace files to openclaw/
  logStep("Workspace files → openclaw/");
  for (const file of OPENCLAW_FILES) {
    syncFile(
      join(OPENCLAW_WORKSPACE, file),
      join(REPO_ROOT, "openclaw", file),
      result,
    );
  }

  // Sync extra files from ~/.openclaw/
  logStep("OpenClaw config files → openclaw/");
  for (const { src, dest } of EXTRA_FILES) {
    syncFile(
      join(OPENCLAW_ROOT, src),
      join(REPO_ROOT, "openclaw", dest),
      result,
    );
  }

  // Sync memory
  logStep("Memory → openclaw/memory/");
  syncMemory(result);

  // Summary
  logStep("Sync complete");
  console.log(`  copied: ${result.copied}`);
  console.log(`  skipped: ${result.skipped} (unchanged)`);
  console.log(`  deleted: ${result.deleted}`);
  if (result.errors.length > 0) {
    console.log(`  errors: ${result.errors.length}`);
  }

  if (!commit) {
    if (result.copied > 0 || result.deleted > 0) {
      console.log("\n  pass --commit to auto-commit and push");
    }
    return;
  }

  if (result.copied === 0 && result.deleted === 0) {
    console.log("\n  nothing changed; skipping commit");
    return;
  }

  logStep("Committing and pushing");
  const date = new Date().toISOString().split("T")[0];

  const gitAdd = Bun.spawnSync({
    cmd: ["git", "-C", REPO_ROOT, "add", "-A"],
    stdout: "pipe",
    stderr: "pipe",
  });
  if (gitAdd.exitCode !== 0) {
    throw new Error("git add failed");
  }

  const gitCommit = Bun.spawnSync({
    cmd: [
      "git",
      "-C",
      REPO_ROOT,
      "commit",
      "-m",
      `sync openclaw workspace ${date}`,
    ],
    stdout: "pipe",
    stderr: "pipe",
  });
  if (gitCommit.exitCode !== 0) {
    const stderr = Buffer.from(gitCommit.stderr).toString("utf8").trim();
    if (stderr.includes("nothing to commit")) {
      console.log("  nothing to commit (git tree clean)");
      return;
    }
    throw new Error(`git commit failed: ${stderr}`);
  }

  const gitPush = Bun.spawnSync({
    cmd: ["git", "-C", REPO_ROOT, "push", "origin", "main"],
    stdout: "pipe",
    stderr: "pipe",
  });

  const pushStderr = Buffer.from(gitPush.stderr).toString("utf8").trim();
  if (gitPush.exitCode !== 0) {
    throw new Error(`git push failed: ${pushStderr}`);
  }

  if (pushStderr.length > 0) {
    console.log(`  ${pushStderr}`);
  }
  console.log("  committed and pushed");
}
