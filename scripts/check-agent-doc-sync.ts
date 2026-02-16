import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const repoRoot = resolve(import.meta.dir, "..");
const claudePath = resolve(repoRoot, "CLAUDE.md");
const agentsPath = resolve(repoRoot, "AGENTS.md");

const claudeContent = readFileSync(claudePath, "utf8");
const agentsContent = readFileSync(agentsPath, "utf8");

if (claudeContent !== agentsContent) {
  console.error("AGENTS.md and CLAUDE.md are out of sync.");
  console.error("Run: cp CLAUDE.md AGENTS.md");
  process.exit(1);
}

console.log("AGENTS.md and CLAUDE.md are synchronized.");
