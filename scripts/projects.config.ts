import { homedir } from "node:os";
import { join } from "node:path";
import type { ManagedProject } from "./common";

const GITHUB = join(homedir(), "github");

export const MANAGED_PROJECTS: ManagedProject[] = [
  // --- TypeScript Web Apps ---
  {
    name: "mylife-rpg",
    path: join(GITHUB, "mylife-rpg"),
    installCommand: ["bun", "install"],
    verifyCommands: [
      ["bun", "run", "lint"],
      ["bun", "run", "typecheck"],
    ],
  },
  {
    name: "poddashboard",
    path: join(GITHUB, "poddashboard"),
    installCommand: ["bun", "install"],
    verifyCommands: [
      ["bun", "run", "lint"],
      ["bun", "run", "typecheck"],
    ],
  },
  {
    name: "reactiveweb",
    path: join(GITHUB, "reactiveweb"),
    installCommand: ["bun", "install"],
    verifyCommands: [
      ["bun", "run", "lint"],
      ["bun", "run", "typecheck"],
    ],
  },
  {
    name: "repo-monitor",
    path: join(GITHUB, "repo-monitor"),
    installCommand: ["bun", "install"],
    verifyCommands: [
      ["bun", "run", "lint"],
      ["bun", "run", "typecheck"],
    ],
  },
  {
    name: "open-video-downloader",
    path: join(GITHUB, "open-video-downloader"),
    installCommand: ["bun", "install"],
    verifyCommands: [
      ["bun", "run", "lint"],
      ["bun", "run", "typecheck"],
    ],
  },
  // --- Chess Platform ---
  {
    name: "elchess",
    path: join(GITHUB, "elchess"),
    installCommand: ["bun", "install"],
    verifyCommands: [
      ["bun", "run", "lint"],
      ["bun", "run", "typecheck"],
    ],
  },
  // --- Mobile ---
  {
    name: "CallRift",
    path: join(GITHUB, "CallRift"),
    installCommand: ["bun", "install"],
    verifyCommands: [
      ["bun", "run", "lint"],
      ["bun", "run", "typecheck"],
    ],
  },
  // --- Ops CLI ---
  {
    name: "scryai-typescript",
    path: join(GITHUB, "scryai-typescript"),
    installCommand: ["bun", "install"],
    verifyCommands: [
      ["bun", "run", "lint"],
      ["bun", "run", "typecheck"],
    ],
  },
  // --- Python ---
  {
    name: "mtg-card-bot",
    path: join(GITHUB, "mtg-card-bot"),
    installCommand: ["uv", "sync"],
    verifyCommands: [
      ["uv", "run", "ruff", "check", "."],
      ["uv", "run", "mypy", "."],
    ],
  },
  {
    name: "scry-trader",
    path: join(GITHUB, "scry-trader"),
    installCommand: ["uv", "sync"],
    verifyCommands: [
      ["uv", "run", "ruff", "check", "."],
      ["uv", "run", "mypy", "."],
    ],
  },
];
