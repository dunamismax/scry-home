import { resolve } from "node:path";

export type ManagedProject = {
  installCommand: string[];
  name: string;
  path: string;
  verifyCommands: string[][];
};

const home = process.env.HOME ?? "/home/sawyer";
const githubRoot = process.env.GITHUB_ROOT
  ? resolve(process.env.GITHUB_ROOT)
  : resolve(home, "github");

export const managedProjects: ManagedProject[] = [
  {
    installCommand: ["bun", "install"],
    name: "next-web-template",
    path: resolve(githubRoot, "next-web-template"),
    verifyCommands: [
      ["bun", "run", "lint"],
      ["bun", "run", "typecheck"],
      ["bun", "run", "build"],
    ],
  },
  {
    installCommand: ["bun", "install"],
    name: "next-blog-template",
    path: resolve(githubRoot, "next-blog-template"),
    verifyCommands: [
      ["bun", "run", "lint"],
      ["bun", "run", "typecheck"],
      ["bun", "run", "build"],
    ],
  },
];
