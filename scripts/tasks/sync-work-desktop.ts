/**
 * sync-work-desktop
 *
 * Bidirectionally syncs "Work Desktop" between Google Drive and OneDrive:
 *   - Files only in one cloud → copied to the other.
 *   - Files in both clouds → newer version wins and overwrites the older.
 *
 * After cloud-to-cloud sync, mirrors OneDrive Work Desktop one-way into the
 * local git repo at /Users/sawyer/github/work/Work Desktop (--delete included,
 * so the git copy is an exact mirror of OneDrive's post-sync state).
 *
 * Usage:
 *   bun run scry:sync:work-desktop            # live run
 *   bun run scry:sync:work-desktop -- --dry-run  # preview only, no writes
 */

import {
  copyFileSync,
  type Dirent,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
  utimesSync,
} from "node:fs";
import { dirname, join, relative } from "node:path";
import { logStep } from "../common";

// ── Paths ──────────────────────────────────────────────────────────────────

const GDRIVE_WD = "/Users/sawyer/Google Drive/My Drive/Work Desktop" as const;
const ONEDRIVE_WD =
  "/Users/sawyer/OneDrive - Imaging Services Inc/Work Desktop" as const;
const GIT_WD = "/Users/sawyer/github/work/Work Desktop" as const;

// ── Skip list ──────────────────────────────────────────────────────────────

const SKIP_EXACT = new Set([".DS_Store", "Thumbs.db", "desktop.ini"]);
// .~lock. = LibreOffice lock files; ~$ = Office temp/lock files
const SKIP_PREFIX = [".~lock.", "~$"];

function shouldSkip(name: string): boolean {
  if (SKIP_EXACT.has(name)) return true;
  return SKIP_PREFIX.some((p) => name.startsWith(p));
}

// ── File walker ────────────────────────────────────────────────────────────

type FileEntry = {
  relPath: string;
  absPath: string;
  mtimeMs: number;
  size: number;
};

function walkDir(root: string): Map<string, FileEntry> {
  const entries = new Map<string, FileEntry>();

  function walk(dir: string): void {
    let items: Dirent[];
    try {
      items = readdirSync(dir, { withFileTypes: true });
    } catch {
      console.warn(`  [WARN] cannot read directory: ${dir}`);
      return;
    }

    for (const item of items) {
      if (shouldSkip(item.name)) continue;
      const abs = join(dir, item.name);
      const rel = relative(root, abs);

      if (item.isSymbolicLink()) {
      } else if (item.isDirectory()) {
        walk(abs);
      } else if (item.isFile()) {
        try {
          const stat = statSync(abs);
          entries.set(rel, {
            relPath: rel,
            absPath: abs,
            mtimeMs: stat.mtimeMs,
            size: stat.size,
          });
        } catch {
          console.warn(`  [WARN] cannot stat: ${abs}`);
        }
      }
    }
  }

  walk(root);
  return entries;
}

// ── File copy (preserves source mtime) ────────────────────────────────────

function copyWithMtime(src: string, dest: string): void {
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(src, dest);
  const stat = statSync(src);
  utimesSync(dest, stat.atime, stat.mtime);
}

// ── Cloud-to-cloud bidirectional sync ─────────────────────────────────────

// Cloud sync can add small timestamp deltas; 2 s covers any rounding.
const MTIME_TOLERANCE_MS = 2_000;

type SyncLabel = "gdrive" | "onedrive";

function syncClouds(dryRun: boolean): void {
  logStep("Scanning Google Drive / Work Desktop …");
  const gFiles = walkDir(GDRIVE_WD);
  console.log(`  ${gFiles.size} files indexed`);

  logStep("Scanning OneDrive / Work Desktop …");
  const oFiles = walkDir(ONEDRIVE_WD);
  console.log(`  ${oFiles.size} files indexed`);

  const allPaths = new Set([...gFiles.keys(), ...oFiles.keys()]);
  logStep(`Syncing ${allPaths.size} unique paths (Google Drive ↔ OneDrive) …`);

  let copied = 0;
  let updated = 0;
  let skipped = 0;
  const tag = dryRun ? "[DRY-RUN] " : "";

  for (const rel of [...allPaths].sort()) {
    const g = gFiles.get(rel);
    const o = oFiles.get(rel);

    if (g && !o) {
      const dest = join(ONEDRIVE_WD, rel);
      console.log(`  ${tag}[COPY] gdrive → onedrive: ${rel}`);
      if (!dryRun) {
        try {
          copyWithMtime(g.absPath, dest);
        } catch (err) {
          console.warn(
            `  [WARN] copy failed (cloud-only?): ${rel} — ${err instanceof Error ? err.message : err}`,
          );
        }
      }
      copied++;
      continue;
    }

    if (o && !g) {
      const dest = join(GDRIVE_WD, rel);
      console.log(`  ${tag}[COPY] onedrive → gdrive: ${rel}`);
      if (!dryRun) {
        try {
          copyWithMtime(o.absPath, dest);
        } catch (err) {
          console.warn(
            `  [WARN] copy failed (cloud-only?): ${rel} — ${err instanceof Error ? err.message : err}`,
          );
        }
      }
      copied++;
      continue;
    }

    if (g && o) {
      const diff = g.mtimeMs - o.mtimeMs; // positive = gdrive is newer

      if (Math.abs(diff) <= MTIME_TOLERANCE_MS && g.size === o.size) {
        skipped++;
        continue; // identical within tolerance
      }

      let src: FileEntry;
      let destRoot: string;
      let srcLabel: SyncLabel;
      let destLabel: SyncLabel;

      if (diff > MTIME_TOLERANCE_MS) {
        src = g;
        destRoot = ONEDRIVE_WD;
        srcLabel = "gdrive";
        destLabel = "onedrive";
      } else {
        src = o;
        destRoot = GDRIVE_WD;
        srcLabel = "onedrive";
        destLabel = "gdrive";
      }

      const ageSecs = Math.round(Math.abs(diff) / 1_000);
      console.log(
        `  ${tag}[UPDATE] ${srcLabel} → ${destLabel}: ${rel} (${srcLabel} newer by ${ageSecs}s)`,
      );
      if (!dryRun) {
        try {
          copyWithMtime(src.absPath, join(destRoot, rel));
        } catch (err) {
          console.warn(
            `  [WARN] update failed (cloud-only?): ${rel} — ${err instanceof Error ? err.message : err}`,
          );
        }
      }
      updated++;
    }
  }

  console.log(
    `\n  result: ${copied} copied, ${updated} updated, ${skipped} identical/skipped`,
  );
}

// ── One-way backup: OneDrive → git repo ───────────────────────────────────
//
// Implemented in pure TypeScript (not rsync) so we can gracefully skip
// cloud-only OneDrive "Files On-Demand" placeholders that haven't been
// downloaded yet. rsync fails hard on those (mmap timeout, exit 20).

function backupToGit(dryRun: boolean): void {
  logStep("Mirroring OneDrive Work Desktop → github/work/Work Desktop …");

  if (!dryRun) {
    mkdirSync(GIT_WD, { recursive: true });
  }

  // Re-walk OneDrive after the cloud-to-cloud sync (may have added files).
  const oFiles = walkDir(ONEDRIVE_WD);
  const gFiles = walkDir(GIT_WD);

  let copied = 0;
  let updated = 0;
  let deleted = 0;
  let skipped = 0;
  let warned = 0;
  const tag = dryRun ? "[DRY-RUN] " : "";

  // Copy / update: OneDrive → git
  for (const [rel, oEntry] of oFiles) {
    const dest = join(GIT_WD, rel);
    const gEntry = gFiles.get(rel);

    if (!gEntry) {
      console.log(`  ${tag}[COPY] onedrive → git: ${rel}`);
      if (!dryRun) {
        try {
          copyWithMtime(oEntry.absPath, dest);
          copied++;
        } catch (err) {
          console.warn(
            `  [WARN] copy failed (cloud-only?): ${rel} — ${err instanceof Error ? err.message : err}`,
          );
          warned++;
        }
      } else {
        copied++;
      }
      continue;
    }

    const diff = Math.abs(oEntry.mtimeMs - gEntry.mtimeMs);
    if (diff <= MTIME_TOLERANCE_MS && oEntry.size === gEntry.size) {
      skipped++;
      continue;
    }

    console.log(`  ${tag}[UPDATE] onedrive → git: ${rel}`);
    if (!dryRun) {
      try {
        copyWithMtime(oEntry.absPath, dest);
        updated++;
      } catch (err) {
        console.warn(
          `  [WARN] update failed (cloud-only?): ${rel} — ${err instanceof Error ? err.message : err}`,
        );
        warned++;
      }
    } else {
      updated++;
    }
  }

  // Delete: files in git that no longer exist in OneDrive
  for (const [rel, gEntry] of gFiles) {
    if (!oFiles.has(rel)) {
      console.log(`  ${tag}[DELETE] from git: ${rel}`);
      if (!dryRun) {
        try {
          rmSync(gEntry.absPath);
          deleted++;
        } catch (err) {
          console.warn(
            `  [WARN] delete failed: ${rel} — ${err instanceof Error ? err.message : err}`,
          );
          warned++;
        }
      } else {
        deleted++;
      }
    }
  }

  const warnSuffix =
    warned > 0 ? `, ${warned} warned (cloud-only files skipped)` : "";
  console.log(
    `\n  result: ${copied} copied, ${updated} updated, ${deleted} deleted, ${skipped} skipped${warnSuffix}`,
  );
}

// ── Entry point ────────────────────────────────────────────────────────────

export function syncWorkDesktop(): void {
  const dryRun = Bun.argv.includes("--dry-run");

  if (dryRun) {
    console.log("\n[DRY-RUN mode — no files will be written]\n");
  }

  syncClouds(dryRun);
  backupToGit(dryRun);

  logStep("All done.");
}
