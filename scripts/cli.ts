import { bootstrap } from "./tasks/bootstrap";
import { doctor } from "./tasks/doctor";
import {
  doctorProjects,
  installProjects,
  listProjects,
  verifyProjects,
} from "./tasks/projects";
import { setupConfigBackup } from "./tasks/setup-config-backup";
import { setupSshBackup, setupSshRestore } from "./tasks/setup-ssh";
import { setupWorkstation } from "./tasks/setup-workstation";
import { syncOpenclaw } from "./tasks/sync-openclaw";
import { syncRemotes } from "./tasks/sync-remotes";
import { syncWorkDesktop } from "./tasks/sync-work-desktop";
import { verifyConfigBackup } from "./tasks/verify-config-backup";

const command = Bun.argv[2];

type Command = {
  fn: () => void | Promise<void>;
  flags?: string;
};

const commands: Record<string, Command> = {
  bootstrap: { fn: bootstrap },
  doctor: { fn: doctor },
  "setup:workstation": { fn: setupWorkstation },
  "setup:config_backup": { fn: setupConfigBackup },
  "verify:config_backup": { fn: verifyConfigBackup },
  "setup:ssh_backup": { fn: setupSshBackup },
  "setup:ssh_restore": { fn: setupSshRestore },
  "projects:list": { fn: listProjects },
  "projects:doctor": { fn: doctorProjects },
  "projects:install": { fn: installProjects },
  "projects:verify": { fn: verifyProjects },
  "sync:openclaw": {
    fn: syncOpenclaw,
    flags: "--commit  sync + git commit + push",
  },
  "sync:remotes": {
    fn: syncRemotes,
    flags: "--fix     apply remote changes (default: dry run)",
  },
  "sync:work-desktop": {
    fn: syncWorkDesktop,
    flags: "--dry-run preview only, no writes",
  },
};

if (!command || !commands[command]) {
  console.error(`Unknown or missing command: ${command ?? "(none)"}`);
  console.error("Available commands:");
  for (const [key, cmd] of Object.entries(commands)) {
    const suffix = cmd.flags ? `  [${cmd.flags.split(" ")[0]}]` : "";
    console.error(`  ${key}${suffix}`);
  }
  process.exit(1);
}

if (Bun.argv.includes("--help")) {
  const cmd = commands[command];
  console.log(`Usage: bun run scripts/cli.ts ${command}`);
  if (cmd.flags) {
    console.log(`\nFlags:\n  ${cmd.flags}`);
  }
  process.exit(0);
}

try {
  await commands[command].fn();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`error: ${message}`);
  process.exit(1);
}
