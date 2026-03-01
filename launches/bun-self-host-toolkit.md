# Bun Self-Host Toolkit

> One command to production-ready self-hosted infrastructure. Bun-native.

---

## The Problem

Bun adoption is accelerating but the deployment and self-hosting story is thin. There's no opinionated, batteries-included toolkit that takes you from `bun create` to a running production system with Postgres, auth, backups, health checks, and monitoring — all without touching Docker Compose yaml or reading 40 pages of docs.

The self-hosting community is large, vocal, and passionate. They star everything that respects their values: own your data, run it yourself, no vendor lock-in.

## The Product

A `bun create` template and companion CLI that scaffolds a production-ready self-hosted application with:

- Postgres with migrations (Drizzle)
- Auth with 2FA and passkeys (Better Auth)
- Health checks and uptime monitoring
- Automated backups with restore verification
- Reverse proxy config generation (Caddy/nginx)
- Systemd service files
- Environment validation (Zod)
- One-command deploy to any Linux box with SSH

## Target Audience

- Self-hosters (r/selfhosted — 350k+ members)
- Bun early adopters looking for production patterns
- Solo developers and small teams who deploy to VPS/bare metal
- People migrating off Vercel/Railway to own their stack

## Star Potential

High. Bun tooling gap + self-hosting community passion + developer tool category = strong compound effect. Similar tools in the Node ecosystem (like `create-t3-app`) have 20k+ stars.

## Launch Strategy

1. Ship v0.1 with core scaffold + one-command local dev
2. Write a companion blog post: "Self-hosting a production Bun app from scratch"
3. Post to: r/selfhosted, r/typescript, Bun Discord, Hacker News
4. Get listed in Bun's community resources / awesome-bun

## Name Candidates

- `bunker` — Bun + bunker (self-hosted fortress). Short, memorable, slightly cheeky.
- `bun-harbor` — safe harbor for your apps
- `bun-ship` — ships with Bun
- `selfhost` — direct, generic enough to own the space

## Stack

Bun, TypeScript, Drizzle, Better Auth, Zod, Postgres. The scryai stack, deployed.

## Priority

Tier 1 — highest star potential. Build first.
