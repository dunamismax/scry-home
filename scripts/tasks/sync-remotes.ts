import { readdirSync, statSync } from "node:fs";
import { basename, join } from "node:path";
import { isGitRepo, logStep, runOrThrow } from "../common";

const DEFAULTS = {
  root: "/Users/sawyer/github",
  owner: "dunamismax",
  ghAlias: "github.com-dunamismax",
  cbAlias: "codeberg.org-dunamismax",
};

type RepoResult = {
  name: string;
  status: "ok" | "skip" | "fixed" | "error";
  detail?: string;
};

function getRemoteUrls(
  repoPath: string,
): { fetchUrl: string; pushUrls: string[] } | null {
  try {
    const fetchUrl = runOrThrow(
      ["git", "-C", repoPath, "remote", "get-url", "origin"],
      { quiet: true },
    );
    const pushRaw = runOrThrow(
      ["git", "-C", repoPath, "remote", "get-url", "--push", "--all", "origin"],
      { quiet: true },
    );
    const pushUrls = pushRaw
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    return { fetchUrl, pushUrls };
  } catch {
    return null;
  }
}

function configureRemote(repoPath: string, ghUrl: string, cbUrl: string): void {
  runOrThrow(["git", "-C", repoPath, "remote", "set-url", "origin", ghUrl], {
    quiet: true,
  });

  // Clear all push URLs then re-add both
  try {
    runOrThrow(
      ["git", "-C", repoPath, "config", "--unset-all", "remote.origin.pushurl"],
      { quiet: true },
    );
  } catch {
    // No pushurl config to clear — that's fine
  }

  runOrThrow(
    [
      "git",
      "-C",
      repoPath,
      "remote",
      "set-url",
      "--add",
      "--push",
      "origin",
      ghUrl,
    ],
    { quiet: true },
  );
  runOrThrow(
    [
      "git",
      "-C",
      repoPath,
      "remote",
      "set-url",
      "--add",
      "--push",
      "origin",
      cbUrl,
    ],
    { quiet: true },
  );
}

function expectedUrls(repoName: string): { ghUrl: string; cbUrl: string } {
  return {
    ghUrl: `git@${DEFAULTS.ghAlias}:${DEFAULTS.owner}/${repoName}.git`,
    cbUrl: `git@${DEFAULTS.cbAlias}:${DEFAULTS.owner}/${repoName}.git`,
  };
}

function isCorrect(
  urls: { fetchUrl: string; pushUrls: string[] },
  expected: { ghUrl: string; cbUrl: string },
): boolean {
  if (urls.fetchUrl !== expected.ghUrl) return false;
  if (urls.pushUrls.length !== 2) return false;
  if (urls.pushUrls[0] !== expected.ghUrl) return false;
  if (urls.pushUrls[1] !== expected.cbUrl) return false;
  return true;
}

function processRepo(repoPath: string, fix: boolean): RepoResult {
  const name = basename(repoPath);

  if (!isGitRepo(repoPath)) {
    return { name, status: "skip", detail: "not a git repo" };
  }

  const urls = getRemoteUrls(repoPath);
  if (!urls) {
    return { name, status: "skip", detail: "no origin remote" };
  }

  const expected = expectedUrls(name);

  if (isCorrect(urls, expected)) {
    return { name, status: "ok" };
  }

  if (!fix) {
    const issues: string[] = [];
    if (urls.fetchUrl !== expected.ghUrl) {
      issues.push(`fetch: ${urls.fetchUrl} (want ${expected.ghUrl})`);
    }
    if (urls.pushUrls.length !== 2) {
      issues.push(`push url count: ${urls.pushUrls.length} (want 2)`);
    } else {
      if (urls.pushUrls[0] !== expected.ghUrl) {
        issues.push(`push[0]: ${urls.pushUrls[0]} (want ${expected.ghUrl})`);
      }
      if (urls.pushUrls[1] !== expected.cbUrl) {
        issues.push(`push[1]: ${urls.pushUrls[1]} (want ${expected.cbUrl})`);
      }
    }
    return { name, status: "error", detail: issues.join("; ") };
  }

  try {
    configureRemote(repoPath, expected.ghUrl, expected.cbUrl);
    return { name, status: "fixed" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { name, status: "error", detail: msg };
  }
}

function discoverRepos(root: string): string[] {
  return readdirSync(root)
    .map((entry) => join(root, entry))
    .filter((p) => {
      try {
        return statSync(p).isDirectory();
      } catch {
        return false;
      }
    })
    .sort();
}

export function syncRemotes(): void {
  const fix = Bun.argv.includes("--fix");
  const root = DEFAULTS.root;

  logStep(
    fix
      ? "Syncing dual remotes (fix mode)"
      : "Checking dual remotes (dry run — pass --fix to apply)",
  );

  console.log(`  root:     ${root}`);
  console.log(`  owner:    ${DEFAULTS.owner}`);
  console.log(`  github:   ${DEFAULTS.ghAlias}`);
  console.log(`  codeberg: ${DEFAULTS.cbAlias}`);

  const repos = discoverRepos(root);
  const results = repos.map((r) => processRepo(r, fix));

  console.log("");

  const ok = results.filter((r) => r.status === "ok");
  const fixed = results.filter((r) => r.status === "fixed");
  const skipped = results.filter((r) => r.status === "skip");
  const errors = results.filter((r) => r.status === "error");

  for (const r of ok) console.log(`  [ok]    ${r.name}`);
  for (const r of fixed) console.log(`  [fixed] ${r.name}`);
  for (const r of skipped) console.log(`  [skip]  ${r.name} — ${r.detail}`);
  for (const r of errors) console.log(`  [error] ${r.name} — ${r.detail}`);

  console.log(
    `\n  ok=${ok.length} fixed=${fixed.length} skipped=${skipped.length} errors=${errors.length}`,
  );

  if (errors.length > 0) {
    process.exit(1);
  }
}
