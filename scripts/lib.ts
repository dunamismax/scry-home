import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

type RunOptions = {
  cwd?: string;
  env?: Record<string, string>;
  quiet?: boolean;
};

export function logStep(message: string): void {
  console.log(`\n==> ${message}`);
}

export function ensureDir(path: string): void {
  mkdirSync(path, { recursive: true });
}

export function ensureParentDir(path: string): void {
  mkdirSync(dirname(path), { recursive: true });
}

export function runOrThrow(cmd: string[], options: RunOptions = {}): string {
  if (!options.quiet) {
    console.log(`$ ${cmd.join(" ")}`);
  }

  const proc = Bun.spawnSync({
    cmd,
    cwd: options.cwd,
    env: {
      ...process.env,
      ...options.env,
    },
    stdout: "pipe",
    stderr: "pipe",
  });

  const stdout = proc.stdout.toString().trim();
  const stderr = proc.stderr.toString().trim();

  if (proc.exitCode !== 0) {
    if (stdout.length > 0) {
      console.error(stdout);
    }
    if (stderr.length > 0) {
      console.error(stderr);
    }
    throw new Error(`Command failed (${proc.exitCode}): ${cmd.join(" ")}`);
  }

  return stdout;
}

export function commandExists(bin: string): boolean {
  const proc = Bun.spawnSync({
    cmd: ["bash", "-lc", `command -v ${bin}`],
    stdout: "ignore",
    stderr: "ignore",
  });
  return proc.exitCode === 0;
}
