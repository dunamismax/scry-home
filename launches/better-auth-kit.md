# Better Auth Kit

> The missing starter kit for Better Auth. Full-stack, fully wired, ready to ship.

---

## The Problem

Better Auth is gaining real traction as the TypeScript-native auth library — but the gap between "read the docs" and "running in production" is wide. There's no comprehensive, opinionated starter that wires up 2FA, passkeys, org management, email verification, and session handling into a working app you can actually deploy.

Every developer using Better Auth is building the same boilerplate from scratch. First-mover advantage is real here.

## The Product

A production-ready auth starter with:

- Better Auth fully configured with Drizzle + Postgres
- Email/password, OAuth (GitHub, Google), magic links
- 2FA (TOTP) with recovery codes
- Passkey registration and login
- Organization/team management with roles
- Session management UI (view/revoke active sessions)
- Email verification and password reset flows
- Rate limiting on auth endpoints
- Complete TypeScript types end-to-end
- Responsive UI built with shadcn/ui
- One-command setup: `bun create better-auth-kit`

## Target Audience

- Better Auth adopters (growing fast, vocal community)
- Developers building SaaS products who need auth yesterday
- People migrating from Auth.js/NextAuth who want something TypeScript-native
- The Better Auth maintainers themselves (they'll link to good starters)

## Star Potential

High. Auth starters consistently perform well (next-auth examples, lucia-auth starters, etc.). Being first to a growing library's ecosystem is the play. If Better Auth links to this from their docs, it's game over.

## Launch Strategy

1. Ship v0.1 with email/password + OAuth + 2FA + session management
2. Open a PR to Better Auth's docs linking the starter
3. Post in Better Auth's Discord/GitHub discussions
4. Write: "Production auth in 10 minutes with Better Auth and Bun"
5. Post to: r/typescript, r/reactjs, Twitter/X auth community

## Name Candidates

- `better-auth-kit` — direct, discoverable, obvious what it is
- `better-auth-starter` — same energy
- `auth-forge` — ties to the forge/smithy naming if that becomes a theme

## Stack

Bun, Vite, React Router (framework mode), React, Better Auth, Drizzle, Postgres, shadcn/ui, Tailwind, Zod. The full scryai stack in action.

## Priority

Tier 1. Time-sensitive — first mover in a growing ecosystem wins disproportionately.
