# Blog-Driven Repos

> Deep technical content paired with companion repositories. Content + code compounds.

---

## The Play

A well-written technical blog post with a companion repo creates a feedback loop: the post drives traffic to the repo, the repo drives stars and forks, GitHub activity drives discoverability, and the cycle repeats. The post gives context the README can't. The repo gives credibility the post can't.

The key: write about things you've actually built and run in production. Not tutorials — war stories with working code.

## Target Posts and Repos

### "Self-Hosting a Production Bun App from Scratch"

Walk through deploying a real Bun application to a VPS with Postgres, TLS, backups, and monitoring. No Docker. No PaaS. Just SSH and systemd.

- Companion repo: working example app with deploy scripts
- Audience: r/selfhosted, Bun community, HN
- Ties directly to: `bun-self-host-toolkit` launch

### "Why I Rewrote My Dotfiles in TypeScript"

The journey from bash scripts to a declarative TypeScript workstation config. What broke, what got better, and the actual config.

- Companion repo: the bootstrap tool itself
- Audience: r/unixporn, r/commandline, dotfiles community
- Ties directly to: `ts-workstation-bootstrap` launch

### "Production Auth in 10 Minutes with Better Auth"

Step-by-step build of a full auth system: email/password, OAuth, 2FA, passkeys, session management. With a working app at the end.

- Companion repo: the auth starter kit
- Audience: r/reactjs, r/typescript, Better Auth community
- Ties directly to: `better-auth-kit` launch

### "Drizzle ORM Patterns That Survive Production"

Real patterns from running Drizzle in production: migration strategies, type-safe queries, connection pooling, testing approaches.

- Companion repo: example patterns with tests
- Audience: Drizzle adopters, TypeScript backend developers
- Standalone piece — no launch dependency

### "Building a Multi-Remote Git Workflow"

How and why to mirror repos across GitHub and Codeberg. The tooling, the automation, the peace of mind.

- Companion repo: the sync script
- Audience: source-control-paranoid developers, FOSS advocates
- Could extract from scryai's existing `scry:sync:remotes`

## Where to Publish

- Personal blog (if terminal portfolio ships, host it there)
- dev.to (large TypeScript audience, easy cross-posting)
- Hashnode (good SEO, developer-focused)
- Medium only if behind no paywall

## Execution

1. Write each post alongside its companion Tier 1/Tier 2 launch
2. Publish post and repo on the same day
3. Cross-post to Reddit, HN, Twitter/X
4. Link repo from post, link post from repo README

## Priority

Tier 2. Force multiplier for Tier 1 launches. Never publish a Tier 1 project without a companion post.
