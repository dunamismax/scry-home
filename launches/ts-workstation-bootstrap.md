# TypeScript Workstation Bootstrap

> Declarative workstation setup. Written in TypeScript. Runs with Bun.

---

## The Problem

Every developer has a dotfiles repo. Most of them are a pile of bash scripts held together by hope and `set -e`. They break on OS updates, they're impossible to test, and they encode years of cargo-culted config that nobody remembers the reason for.

`chezmoi` (13k+ stars) proved there's massive demand for a better dotfiles tool. But it's Go, it has its own templating language, and the mental model is non-trivial. There's room for a TypeScript-native alternative that leverages the language developers already think in.

## The Product

A Bun-powered workstation bootstrap tool that:

- Declares system state in TypeScript (packages, configs, symlinks, services, defaults)
- Runs idempotently — safe to re-run at any time
- Supports macOS and Linux from the same config
- Handles Homebrew, apt, system preferences, shell config, SSH keys, Git config
- Provides dry-run mode showing exactly what would change
- Includes a `doctor` command that validates current state against desired state
- Ships with sensible defaults that work out of the box for a TypeScript developer

## Target Audience

- Developers who maintain dotfiles repos (millions)
- TypeScript developers tired of writing bash
- People who set up new machines regularly
- Teams that want reproducible dev environments

## Star Potential

High. `chezmoi` has 13k+, `dotbot` has 7k+, `yadm` has 5k+. The space is proven. A TypeScript-native entry with good DX and a Bun runtime story has a clear niche.

## Launch Strategy

1. Ship v0.1 with macOS support, Homebrew, symlinks, shell config
2. Publish Stephen's actual workstation config as the example
3. Write: "Why I rewrote my dotfiles in TypeScript"
4. Post to: r/unixporn, r/typescript, r/commandline, Hacker News
5. Cross-pollinate with awesome-bun listing

## Name Candidates

- `forge` — you forge your machine into shape
- `smithy` — the workshop where tools are made
- `machinist` — builds machines to spec
- `kit` — simple, clean, TypeScript toolkit vibes
- `workbench` — where you set up your workspace

## Stack

Bun, TypeScript, Zod for config validation. Minimal dependencies — this tool should bootstrap from almost nothing.

## Priority

Tier 1. Stephen already builds this kind of tooling. Productize the instinct.
