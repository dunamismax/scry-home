import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import { ensureParentDir, logStep, runOrThrow } from "./lib";

type ProfileName = "mobile" | "desktop";

type RunMetrics = {
  accessibilityScore: number;
  bestPracticesScore: number;
  cls: number;
  fcpMs: number;
  lcpMs: number;
  performanceScore: number;
  run: number;
  seoScore: number;
  tbtMs: number;
};

type ProfileReport = {
  median: Omit<RunMetrics, "run">;
  runs: RunMetrics[];
};

type LighthouseSummary = {
  chromePath: string | null;
  generatedAt: string;
  profiles: Record<ProfileName, ProfileReport>;
  runsPerProfile: number;
  url: string;
};

type CliOptions = {
  appDir: string;
  output: string;
  port: number;
  runs: number;
  skipBuild: boolean;
  url: string;
  urlExplicit: boolean;
};

const browserBinaryCandidates = [
  "google-chrome-stable",
  "google-chrome",
  "chromium",
  "chromium-browser",
  "brave-browser",
  "microsoft-edge-stable",
  "microsoft-edge",
] as const;

const browserPathCandidates = [
  "/usr/bin/google-chrome-stable",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/snap/bin/chromium",
] as const;

function parseArgs(argv: string[]): CliOptions {
  const values = new Map<string, string>();
  const flags = new Set<string>();

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) {
      continue;
    }

    const [key, inlineValue] = arg.slice(2).split("=", 2);
    if (inlineValue !== undefined) {
      values.set(key, inlineValue);
      continue;
    }

    const next = argv[index + 1];
    if (next && !next.startsWith("--")) {
      values.set(key, next);
      index += 1;
      continue;
    }

    flags.add(key);
  }

  const appDir = resolve(values.get("app-dir") ?? "apps/astro-web-template");
  const output = resolve(values.get("output") ?? "artifacts/lighthouse/current.json");
  const port = Number(values.get("port") ?? "4173");
  const runs = Number(values.get("runs") ?? "3");
  const urlExplicit = values.has("url");
  const url = values.get("url") ?? `http://127.0.0.1:${port}/`;
  const skipBuild = flags.has("skip-build");

  if (!Number.isFinite(port) || port <= 0) {
    throw new Error(`Invalid --port value: ${String(values.get("port"))}`);
  }

  if (!Number.isFinite(runs) || runs < 1) {
    throw new Error(`Invalid --runs value: ${String(values.get("runs"))}`);
  }

  return {
    appDir,
    output,
    port,
    runs,
    skipBuild,
    url,
    urlExplicit,
  };
}

function median(values: number[]): number {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
}

function toScore(value: unknown): number {
  if (typeof value !== "number") {
    return 0;
  }

  return Number((value * 100).toFixed(2));
}

function toMetric(value: unknown): number {
  if (typeof value !== "number") {
    return 0;
  }

  return Number(value.toFixed(2));
}

function toProfileMedian(runs: RunMetrics[]): Omit<RunMetrics, "run"> {
  return {
    accessibilityScore: Number(median(runs.map((item) => item.accessibilityScore)).toFixed(2)),
    bestPracticesScore: Number(median(runs.map((item) => item.bestPracticesScore)).toFixed(2)),
    cls: Number(median(runs.map((item) => item.cls)).toFixed(4)),
    fcpMs: Number(median(runs.map((item) => item.fcpMs)).toFixed(2)),
    lcpMs: Number(median(runs.map((item) => item.lcpMs)).toFixed(2)),
    performanceScore: Number(median(runs.map((item) => item.performanceScore)).toFixed(2)),
    seoScore: Number(median(runs.map((item) => item.seoScore)).toFixed(2)),
    tbtMs: Number(median(runs.map((item) => item.tbtMs)).toFixed(2)),
  };
}

function parseLighthouseRun(lhrPath: string, run: number): RunMetrics {
  const raw = JSON.parse(readFileSync(lhrPath, "utf8")) as Record<string, unknown>;
  const categories = (raw.categories as Record<string, { score?: number }>) ?? {};
  const audits = (raw.audits as Record<string, { numericValue?: number } | undefined | null>) ?? {};

  return {
    accessibilityScore: toScore(categories.accessibility?.score),
    bestPracticesScore: toScore(categories["best-practices"]?.score),
    cls: toMetric(audits["cumulative-layout-shift"]?.numericValue),
    fcpMs: toMetric(audits["first-contentful-paint"]?.numericValue),
    lcpMs: toMetric(audits["largest-contentful-paint"]?.numericValue),
    performanceScore: toScore(categories.performance?.score),
    run,
    seoScore: toScore(categories.seo?.score),
    tbtMs: toMetric(audits["total-blocking-time"]?.numericValue),
  };
}

function runLighthouseOnce(
  url: string,
  profile: ProfileName,
  run: number,
  tempDir: string,
  chromePath: string,
): RunMetrics {
  const lhrPath = resolve(tempDir, `${profile}-run-${run}.json`);
  const chromeFlags = "--headless=new --no-sandbox --disable-dev-shm-usage";

  const cmd = [
    "bunx",
    "--bun",
    "lighthouse",
    url,
    "--output=json",
    `--output-path=${lhrPath}`,
    "--quiet",
    `--chrome-flags=${chromeFlags}`,
    "--only-categories=performance,accessibility,best-practices,seo",
    "--max-wait-for-load=45000",
  ];

  if (profile === "desktop") {
    cmd.push("--preset=desktop");
  }

  cmd.push(`--chrome-path=${chromePath}`);

  runOrThrow(cmd, { env: { CHROME_PATH: chromePath } });
  return parseLighthouseRun(lhrPath, run);
}

function resolveChromePath(value: string | undefined): string {
  const explicit = value?.trim();
  if (explicit) {
    if (explicit.includes("/")) {
      if (!existsSync(explicit)) {
        throw new Error(`CHROME_PATH is set but missing: ${explicit}`);
      }
      return explicit;
    }

    const resolved = Bun.which(explicit);
    if (!resolved) {
      throw new Error(`CHROME_PATH points to "${explicit}" but it is not on PATH.`);
    }
    return resolved;
  }

  for (const candidate of browserBinaryCandidates) {
    const resolved = Bun.which(candidate);
    if (resolved) {
      return resolved;
    }
  }

  for (const candidate of browserPathCandidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    [
      "No Chrome/Chromium executable found for Lighthouse.",
      "Install one browser binary (for Ubuntu/Debian, try: sudo apt-get install -y chromium).",
      "Or set CHROME_PATH to your browser executable, for example:",
      "  CHROME_PATH=/usr/bin/google-chrome-stable bun run perf:lighthouse",
    ].join("\n"),
  );
}

async function waitForServer(
  url: string,
  timeoutMs: number,
  serverProc?: ReturnType<typeof Bun.spawn>,
): Promise<void> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (serverProc && serverProc.exitCode !== null) {
      throw new Error("Server process exited before it became ready.");
    }

    try {
      const response = await fetch(url, { method: "GET" });
      if (response.ok || response.status === 404) {
        return;
      }
    } catch {
      // keep polling
    }

    await Bun.sleep(250);
  }

  throw new Error(`Timed out waiting for server at ${url}`);
}

function streamToText(stream: ReadableStream<Uint8Array> | null): Promise<string> {
  if (!stream) {
    return Promise.resolve("");
  }

  return new Response(stream).text();
}

function startServer(appDir: string, port: number) {
  const serverProc = Bun.spawn({
    cmd: ["bun", "run", "serve"],
    cwd: appDir,
    env: {
      ...process.env,
      PORT: String(port),
    },
    stdout: "pipe",
    stderr: "pipe",
  });

  return {
    port,
    serverProc,
    stderrPromise: streamToText(serverProc.stderr),
    stdoutPromise: streamToText(serverProc.stdout),
  };
}

async function startServerWithRetries(options: CliOptions): Promise<{
  port: number;
  stderrPromise: Promise<string>;
  stdoutPromise: Promise<string>;
  url: string;
  serverProc: ReturnType<typeof Bun.spawn>;
}> {
  const maxAttempts = options.urlExplicit ? 1 : 20;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const port = options.port + attempt;
    const url = options.urlExplicit ? options.url : `http://127.0.0.1:${port}/`;

    logStep(`Start server on port ${port}`);
    const server = startServer(options.appDir, port);

    try {
      await waitForServer(url, 45_000, server.serverProc);
      return {
        ...server,
        url,
      };
    } catch {
      server.serverProc.kill();
      await server.serverProc.exited;

      const [stdout, stderr] = await Promise.all([server.stdoutPromise, server.stderrPromise]);
      const output = `${stdout}\n${stderr}`;
      const hasAddressInUse = output.includes("EADDRINUSE");

      if (hasAddressInUse && !options.urlExplicit && attempt < maxAttempts - 1) {
        console.warn(`port ${port} is in use, retrying on ${port + 1}`);
        continue;
      }

      const details = output.trim();
      throw new Error(
        details.length > 0
          ? `Failed to start server for Lighthouse:\n${details}`
          : "Failed to start server for Lighthouse.",
      );
    }
  }

  throw new Error("Unable to start Lighthouse server after trying multiple ports.");
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const chromePath = resolveChromePath(process.env.CHROME_PATH);
  logStep(`Using browser binary: ${chromePath}`);

  if (!options.skipBuild) {
    logStep(`Build app (${options.appDir})`);
    runOrThrow(["bun", "run", "build"], { cwd: options.appDir });
  }

  const tempDir = mkdtempSync(resolve(tmpdir(), "scryai-lighthouse-"));
  const server = await startServerWithRetries(options);
  const reportUrl = server.url;

  try {
    const profiles: ProfileName[] = ["mobile", "desktop"];
    const profileReports = {} as Record<ProfileName, ProfileReport>;

    for (const profile of profiles) {
      logStep(`Lighthouse ${profile} (${options.runs} runs)`);
      const runs: RunMetrics[] = [];

      for (let run = 1; run <= options.runs; run += 1) {
        console.log(`run ${run}/${options.runs}`);
        const result = runLighthouseOnce(reportUrl, profile, run, tempDir, chromePath);
        runs.push(result);
      }

      profileReports[profile] = {
        median: toProfileMedian(runs),
        runs,
      };
    }

    const summary: LighthouseSummary = {
      chromePath: chromePath ?? null,
      generatedAt: new Date().toISOString(),
      profiles: profileReports,
      runsPerProfile: options.runs,
      url: reportUrl,
    };

    ensureParentDir(options.output);
    writeFileSync(options.output, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
    logStep(`Wrote report: ${options.output}`);
  } finally {
    server.serverProc.kill();
    await server.serverProc.exited;

    const [stdout, stderr] = await Promise.all([server.stdoutPromise, server.stderrPromise]);
    if (stdout.trim().length > 0) {
      console.log(stdout.trim());
    }
    if (stderr.trim().length > 0) {
      console.error(stderr.trim());
    }

    rmSync(tempDir, { force: true, recursive: true });
  }
}

await main();
