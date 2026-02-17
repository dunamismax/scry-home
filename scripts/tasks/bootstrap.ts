import { commandExists, logStep, runOrThrow } from "../common";

const REQUIRED_TOOLS = ["bun", "git", "curl"];

export function bootstrap(): void {
  logStep("Checking prerequisites");
  for (const tool of REQUIRED_TOOLS) {
    if (!commandExists(tool)) {
      throw new Error(`Missing required tool: ${tool}`);
    }
    console.log(`ok: ${tool}`);
  }

  logStep("Installing dependencies with Bun");
  runOrThrow(["bun", "install"]);

  logStep("Installing managed project dependencies");
  runOrThrow(["bun", "run", "scry:projects:install"]);

  logStep("Bootstrap complete");
  const bunVersion = runOrThrow(["bun", "--version"], { quiet: true });
  console.log(`bun: ${bunVersion}`);
}
