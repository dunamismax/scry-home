# Project Ideas

> Ranked by excitement. Top three are the ones to build first.

---

## Tier 1 — Build These

### Terminal Portfolio

Personal site that looks and behaves like a real terminal. Visitors type commands to explore your work, read about projects, check your stack, and navigate like they're SSH'd into your brain. Vue SPA with a custom shell parser, command history, tab completion, and enough personality to make people stay and poke around.

**Why it's great:** It's a front door that filters for your kind of people. Anyone who enjoys it is someone worth talking to. Surprisingly shippable — the core is a text input and a command router. Everything else is content.

**Stack:** Vue 3, Vite, Tailwind, deployed as a static SPA.

---

### Status Page Generator

Self-hosted uptime monitoring with a clean public status page. Ping your services on a schedule, record history, render a page that tells visitors (and yourself) what's up and what's down. No SaaS dependency for the thing that tells you if your other things are working.

**Why it's great:** Everyone running self-hosted services needs this, and the existing options are either overkill or someone else's server. One `bun run` to start monitoring. One URL to share.

**Stack:** Bun server, Postgres for check history, Vue frontend for the public page, cron-style health checks.

---

### CLI Showcase

A site that renders your CLI tools with interactive, sandboxed demos. Visitors type real commands, see real output, and understand what your tools do by using them — not by reading about them. Pairs naturally with the terminal portfolio but focused on the tools themselves.

**Why it's great:** Most developer portfolios show screenshots. This one lets people *use* the work. It's a live demo that speaks the language your tools were built in.

**Stack:** Vue 3, Vite, Tailwind, sandboxed command execution (WASM or pre-recorded output trees).

---

## Tier 2 — Strong Ideas, Build When Ready

### Incident Journal

Structured log of what broke, when, why, and what fixed it. Searchable. Taggable. Linkable to specific services or repos. The thing you wish you had the third time you debug the same DNS resolution issue at midnight.

**Why it's great:** Incident memory is one of the highest-leverage things a solo operator can have. Past-you solving a problem is the best documentation future-you will ever read.

**Stack:** Bun server, Postgres, Vue frontend with full-text search.

---

### Link Garden

A curated collection of links with notes, tags, and a public page. Not a bookmarking app — a garden. Things you found, why they matter, and how they connect. Dead simple to maintain, looks good enough to share, RSS feed out so others can subscribe.

**Why it's great:** It's a blog for people who discover more than they write. Lower friction than publishing posts, higher signal than a Twitter thread.

**Stack:** Bun server, Postgres, Vue frontend, RSS generation.

---

### Repo Health Dashboard

Point it at your GitHub and Codeberg repos. It scores them on documentation quality, test coverage, dependency freshness, commit frequency, and open issue hygiene. Gamify your own maintenance discipline with honest, automated scoring.

**Why it's great:** It turns "I should really update that repo" into a number you can't ignore. Self-awareness as a feature.

**Stack:** Bun server, GitHub/Codeberg APIs, Postgres for historical scores, Vue frontend.

---

### Dependency Graveyard

Scans every dependency across your repos. Flags abandoned packages, unmaintained libraries, and version pins that haven't moved in years. Scores your supply chain health and shows you which `node_modules` residents are ticking time bombs.

**Why it's great:** The repo health dashboard's paranoid cousin. Most security incidents start with a dependency nobody was watching. This watches all of them.

**Stack:** Bun server, GitHub/Codeberg APIs, npm/package registry APIs, Postgres, Vue frontend.
