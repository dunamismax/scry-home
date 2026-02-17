import { readFileSync } from "node:fs";
import { resolve } from "node:path";

type ProfileName = "mobile" | "desktop";

type ProfileMedian = {
  accessibilityScore: number;
  bestPracticesScore: number;
  cls: number;
  fcpMs: number;
  lcpMs: number;
  performanceScore: number;
  seoScore: number;
  tbtMs: number;
};

type LighthouseSummary = {
  generatedAt: string;
  profiles: Record<ProfileName, { median: ProfileMedian }>;
  url: string;
};

type Thresholds = {
  maximumMetrics: {
    cls: number;
    lcpMs: number;
    tbtMs: number;
  };
  maxRegression: {
    cls: number;
    lcpMs: number;
    performanceScoreDrop: number;
    tbtMs: number;
  };
  minimumScores: {
    accessibility: number;
    bestPractices: number;
    performance: number;
    seo: number;
  };
};

type ThresholdConfig = Record<ProfileName, Thresholds>;

type CliOptions = {
  baseline?: string;
  report: string;
  thresholds: string;
};

function parseArgs(argv: string[]): CliOptions {
  const values = new Map<string, string>();

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
    }
  }

  const report = values.get("report");
  if (!report) {
    throw new Error("Missing required --report path");
  }

  return {
    baseline: values.get("baseline"),
    report: resolve(report),
    thresholds: resolve(values.get("thresholds") ?? "docs/performance/lighthouse-thresholds.json"),
  };
}

function readJsonFile<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function failIf(failures: string[], condition: boolean, message: string): void {
  if (condition) {
    failures.push(message);
  }
}

function formatMedian(profile: ProfileName, median: ProfileMedian): string {
  return [
    `${profile}: perf=${median.performanceScore.toFixed(2)}`,
    `a11y=${median.accessibilityScore.toFixed(2)}`,
    `bp=${median.bestPracticesScore.toFixed(2)}`,
    `seo=${median.seoScore.toFixed(2)}`,
    `lcp=${median.lcpMs.toFixed(2)}ms`,
    `cls=${median.cls.toFixed(4)}`,
    `tbt=${median.tbtMs.toFixed(2)}ms`,
  ].join(" | ");
}

function checkAbsoluteThresholds(
  failures: string[],
  profile: ProfileName,
  median: ProfileMedian,
  thresholds: Thresholds,
): void {
  failIf(
    failures,
    median.performanceScore < thresholds.minimumScores.performance,
    `${profile}: performance ${median.performanceScore.toFixed(2)} < ${thresholds.minimumScores.performance}`,
  );
  failIf(
    failures,
    median.accessibilityScore < thresholds.minimumScores.accessibility,
    `${profile}: accessibility ${median.accessibilityScore.toFixed(2)} < ${thresholds.minimumScores.accessibility}`,
  );
  failIf(
    failures,
    median.bestPracticesScore < thresholds.minimumScores.bestPractices,
    `${profile}: best-practices ${median.bestPracticesScore.toFixed(2)} < ${thresholds.minimumScores.bestPractices}`,
  );
  failIf(
    failures,
    median.seoScore < thresholds.minimumScores.seo,
    `${profile}: seo ${median.seoScore.toFixed(2)} < ${thresholds.minimumScores.seo}`,
  );
  failIf(
    failures,
    median.lcpMs > thresholds.maximumMetrics.lcpMs,
    `${profile}: LCP ${median.lcpMs.toFixed(2)}ms > ${thresholds.maximumMetrics.lcpMs}ms`,
  );
  failIf(
    failures,
    median.cls > thresholds.maximumMetrics.cls,
    `${profile}: CLS ${median.cls.toFixed(4)} > ${thresholds.maximumMetrics.cls}`,
  );
  failIf(
    failures,
    median.tbtMs > thresholds.maximumMetrics.tbtMs,
    `${profile}: TBT ${median.tbtMs.toFixed(2)}ms > ${thresholds.maximumMetrics.tbtMs}ms`,
  );
}

function checkRegressionThresholds(
  failures: string[],
  profile: ProfileName,
  current: ProfileMedian,
  baseline: ProfileMedian,
  thresholds: Thresholds,
): void {
  const lcpRegression = current.lcpMs - baseline.lcpMs;
  const clsRegression = current.cls - baseline.cls;
  const tbtRegression = current.tbtMs - baseline.tbtMs;
  const perfDrop = baseline.performanceScore - current.performanceScore;

  failIf(
    failures,
    lcpRegression > thresholds.maxRegression.lcpMs,
    `${profile}: LCP regression +${lcpRegression.toFixed(2)}ms > +${thresholds.maxRegression.lcpMs}ms`,
  );
  failIf(
    failures,
    clsRegression > thresholds.maxRegression.cls,
    `${profile}: CLS regression +${clsRegression.toFixed(4)} > +${thresholds.maxRegression.cls}`,
  );
  failIf(
    failures,
    tbtRegression > thresholds.maxRegression.tbtMs,
    `${profile}: TBT regression +${tbtRegression.toFixed(2)}ms > +${thresholds.maxRegression.tbtMs}ms`,
  );
  failIf(
    failures,
    perfDrop > thresholds.maxRegression.performanceScoreDrop,
    `${profile}: performance score drop -${perfDrop.toFixed(2)} > -${thresholds.maxRegression.performanceScoreDrop}`,
  );
}

function main(): void {
  const options = parseArgs(process.argv.slice(2));
  const currentReport = readJsonFile<LighthouseSummary>(options.report);
  const baselineReport = options.baseline
    ? readJsonFile<LighthouseSummary>(resolve(options.baseline))
    : null;
  const thresholdConfig = readJsonFile<ThresholdConfig>(options.thresholds);

  const failures: string[] = [];
  const profiles: ProfileName[] = ["mobile", "desktop"];

  console.log(`Current report: ${options.report}`);
  if (baselineReport) {
    console.log(`Baseline report: ${resolve(options.baseline ?? "")}`);
  }
  console.log(`Thresholds: ${options.thresholds}`);

  for (const profile of profiles) {
    const currentMedian = currentReport.profiles[profile]?.median;
    if (!currentMedian) {
      failures.push(`${profile}: missing profile results in current report`);
      continue;
    }

    console.log(formatMedian(profile, currentMedian));
    checkAbsoluteThresholds(failures, profile, currentMedian, thresholdConfig[profile]);

    if (baselineReport) {
      const baselineMedian = baselineReport.profiles[profile]?.median;
      if (!baselineMedian) {
        failures.push(`${profile}: missing profile results in baseline report`);
        continue;
      }

      checkRegressionThresholds(
        failures,
        profile,
        currentMedian,
        baselineMedian,
        thresholdConfig[profile],
      );
    }
  }

  if (failures.length > 0) {
    console.error("\nLighthouse assertions failed:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log("\nLighthouse assertions passed.");
}

main();
