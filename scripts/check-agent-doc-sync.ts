import { constants, accessSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const repoRoot = resolve(import.meta.dir, "..");
const agentsPath = resolve(repoRoot, "AGENTS.md");

try {
  accessSync(agentsPath, constants.R_OK);
} catch {
  console.error("AGENTS.md is missing or unreadable.");
  process.exit(1);
}

const agentsContent = readFileSync(agentsPath, "utf8").trim();

if (!agentsContent) {
  console.error("AGENTS.md is empty.");
  process.exit(1);
}

console.log("AGENTS.md exists and is readable.");
