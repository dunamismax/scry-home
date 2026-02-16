import { existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { ensureDir, ensureParentDir, logStep, runOrThrow } from "./lib";

type ZigPlatform = "x86_64-linux" | "aarch64-linux";

type ZigRelease = {
  tarball: string;
};

type ZigIndex = Record<string, Record<string, ZigRelease> & { version?: string }>;

const home = process.env.HOME ?? "/home/sawyer";
const installRoot = resolve(home, ".local/zig");
const binDir = resolve(home, ".local/bin");
const zigLink = resolve(binDir, "zig");
const tempArchive = "/tmp/zig.tar.xz";
const tempExtractDir = "/tmp/zig-extract";

function detectPlatform(): ZigPlatform {
  const arch = Bun.spawnSync({ cmd: ["uname", "-m"], stdout: "pipe" })
    .stdout.toString()
    .trim();
  if (arch === "x86_64") return "x86_64-linux";
  if (arch === "aarch64") return "aarch64-linux";
  throw new Error(`Unsupported architecture for Zig setup: ${arch}`);
}

async function fetchLatestStable(
  platform: ZigPlatform,
): Promise<{ version: string; tarball: string }> {
  logStep("Resolving latest Zig release");
  const response = await fetch("https://ziglang.org/download/index.json");
  if (!response.ok) {
    throw new Error(`Failed to fetch Zig index: ${response.status} ${response.statusText}`);
  }
  const index = (await response.json()) as ZigIndex;

  const stableVersions = Object.keys(index)
    .filter((key) => key !== "master" && /^\d+\.\d+\.\d+$/.test(key))
    .sort((a, b) => {
      const ap = a.split(".").map(Number);
      const bp = b.split(".").map(Number);
      for (let i = 0; i < 3; i += 1) {
        if (ap[i] !== bp[i]) return bp[i] - ap[i];
      }
      return 0;
    });

  const version = stableVersions[0];
  if (!version) {
    throw new Error("No stable Zig release found in index.");
  }

  const release = index[version]?.[platform];
  if (!release?.tarball) {
    throw new Error(`No Zig tarball found for ${platform} in version ${version}.`);
  }

  return { version, tarball: release.tarball };
}

function hasInstalledZig(): boolean {
  const proc = Bun.spawnSync({ cmd: ["bash", "-lc", "command -v zig"], stdout: "ignore" });
  return proc.exitCode === 0;
}

function getInstalledVersion(): string {
  return runOrThrow(["zig", "version"], { quiet: true });
}

function installArchive(version: string, tarball: string): void {
  const targetDir = resolve(installRoot, version);
  const extractedDir = resolve(tempExtractDir, `zig-${detectPlatform()}-${version}`);

  logStep(`Downloading Zig ${version}`);
  runOrThrow(["curl", "-fLs", tarball, "-o", tempArchive]);

  logStep("Extracting archive");
  rmSync(tempExtractDir, { recursive: true, force: true });
  ensureDir(tempExtractDir);
  runOrThrow(["tar", "-xf", tempArchive, "-C", tempExtractDir]);

  logStep("Installing into ~/.local/zig");
  rmSync(targetDir, { recursive: true, force: true });
  ensureDir(installRoot);
  runOrThrow(["mv", extractedDir, targetDir]);

  logStep("Linking zig binary");
  ensureParentDir(zigLink);
  rmSync(zigLink, { force: true });
  runOrThrow(["ln", "-s", resolve(targetDir, "zig"), zigLink]);
}

async function main(): Promise<void> {
  const wantsUpgrade = process.argv.includes("--upgrade");

  if (hasInstalledZig() && !wantsUpgrade) {
    logStep(`Zig already installed: ${getInstalledVersion()}`);
    console.log(`binary: ${zigLink}`);
    return;
  }

  const platform = detectPlatform();
  const { version, tarball } = await fetchLatestStable(platform);

  if (hasInstalledZig()) {
    const current = getInstalledVersion();
    if (current === version) {
      logStep(`Zig ${version} already installed`);
      return;
    }
    logStep(`Upgrading Zig ${current} -> ${version}`);
  } else {
    logStep(`Installing Zig ${version}`);
  }

  installArchive(version, tarball);

  if (!existsSync(zigLink)) {
    throw new Error(`Failed to link Zig binary at ${zigLink}`);
  }

  logStep(`Zig ready: ${getInstalledVersion()}`);
  console.log(`binary: ${zigLink}`);
}

await main();
