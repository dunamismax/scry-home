# Project Ideas

> Agentic engineering projects ranked by market potential, virality, and alignment with Stephen's stack.
> Updated 2026-03-02. Living document — re-rank as the landscape shifts.

---

## Tier 1 — High-Impact Agentic Projects

The best intersection of market demand, agentic showcase, and monetization potential. Build these first.

---

### PR Firefighter

**Category:** DevTools SaaS
**Tagline:** An agent that watches your CI, reproduces failures locally, and opens fix PRs with test evidence before you finish your coffee.

**What it does:** Monitors GitHub Actions / CI pipelines for failures. When a build breaks, the agent clones the repo, reproduces the failure in a sandboxed environment, diagnoses root cause, writes a fix with passing tests, and opens a PR with full evidence — reproduction steps, diff explanation, and test output. Works as a GitHub App so teams install it in one click.

**Why it wins:** Every engineering team loses hours to broken CI. The existing tools (Copilot, CodeRabbit) review code *before* merge — nobody's owning the post-merge firefight. This is a new category: autonomous CI repair. The "it opened a fix PR before I saw the failure notification" moment is the viral hook.

**Monetization:**
- Free tier: 1 repo, 10 fixes/month
- Team: $49/mo per repo (unlimited fixes, priority queue)
- Enterprise: $299/mo per org (self-hosted runner option, SSO, audit logs)

**Jobs signal:** Massive. Demonstrates LLM orchestration, CI/CD expertise, code generation with verification, sandboxed execution, and developer experience tooling. This is the resume project that gets you hired at any AI-focused DevTools company.

**Stack:** TypeScript + Bun, GitHub App (webhooks + API), sandboxed code execution (Docker or Firecracker), LLM orchestration layer, Postgres for job history, React dashboard for monitoring fixes.

**MVP scope:** Single repo support, GitHub Actions only, TypeScript/JavaScript test failures. Fix → PR pipeline with basic evidence. 2-3 week build with agentic tooling.

**Competitive landscape:** No direct competitor doing autonomous CI fix PRs. CodeRabbit and Copilot do pre-merge review. Trunk does merge queues. This is a gap.

---

### Self-Hostable AI Homelab Manager

**Category:** Infrastructure / Self-Hosting
**Tagline:** An AI ops engineer for your homelab that never sleeps.

**What it does:** Manages your entire self-hosted infrastructure through natural language and autonomous monitoring. Docker container lifecycle, system updates, SSL certificate renewal, DNS management, backup orchestration, health checks, and incident response. Connects to your services via SSH/Docker API and acts on your behalf — or proposes changes and waits for approval based on risk level.

**Why it wins:** The self-hosting community (500k+ on r/selfhosted alone) is massive, growing, and underserved. Current tools are either too simple (Portainer) or too complex (Kubernetes). Nobody's built the "AI sysadmin" that understands your stack contextually. The "I told my homelab to update everything and it did it safely at 3am" story writes itself.

**Monetization:**
- Open-source core (self-hosted, always free)
- Pro: $9/mo — managed cloud dashboard, multi-server orchestration, backup verification
- Business: $29/mo — team access, audit logs, compliance templates

**Jobs signal:** Infrastructure automation, LLM-driven operations, security posture management, Docker/systems expertise. Directly relevant to the booming "AI for DevOps" hiring wave.

**Stack:** TypeScript + Bun backend, React dashboard, Postgres for state/history, SSH/Docker API integrations, agent orchestration layer with approval gates. Optional: OpenClaw integration for natural language control via Signal/Telegram.

**MVP scope:** Docker container management (list, start, stop, update, health check) + system update orchestration for a single Debian/Ubuntu host. Natural language interface. 2-week build.

**Competitive landscape:** Portainer (no AI), Yacht (minimal), CasaOS (consumer-focused). None have agent capabilities. Coolify is closest in spirit but focused on deployment, not ongoing management.

---

### Git-Powered Developer Portfolio

**Category:** Developer Tools / Career
**Tagline:** Your code is your resume. This proves it.

**What it does:** Agents analyze your actual git history across repos — commit patterns, languages used, code complexity, contribution frequency, review activity, and project impact. Generates a living, verifiable developer portfolio that updates automatically as you ship. Not self-reported skills — cryptographically linked proof of work.

**Why it wins:** Developers hate writing resumes. Recruiters hate reading them. This solves both sides. "I don't have a resume, I have a portfolio that updates every time I push code" is the tweet that gets 50k likes. The verification angle (linked to real commits, not self-reported) is the moat against the inevitable copycats.

**Monetization:**
- Free tier: Public repos, basic portfolio page
- Pro: $5/mo — private repo analysis, custom domain, analytics on who's viewing
- Recruiter API: $99/mo — search verified developer profiles by skill/activity, contact through platform

**Jobs signal:** Strong. Shows you understand developer experience, can build consumer-facing products, and know how to make data legible. The recruiter marketplace angle shows business thinking.

**Stack:** TypeScript + Bun, GitHub/GitLab/Codeberg APIs, Postgres for profile data and analytics, React frontend with SSR for SEO, agent layer for commit analysis and skill extraction.

**MVP scope:** GitHub-only, public repos. Commit frequency heatmap, language breakdown, top projects with auto-generated descriptions, shareable URL. Ship in 1 week. Iterate based on feedback.

**Competitive landscape:** GitHub profile READMEs (manual, limited). GitRoll (exists but poorly executed). OSS Card (dead). The market has been tried but never nailed.

---

### Agentic Code Review GitHub App

**Category:** DevTools SaaS
**Tagline:** A code reviewer that's read every commit in your repo.

**What it does:** A self-hostable GitHub App that performs deep, context-aware code review. Ingests your codebase's architecture, style conventions, past review comments, and documented decisions. Reviews PRs not just for bugs but for architectural fit, naming consistency, test coverage gaps, and patterns that diverge from established conventions. Multi-agent: one agent per changed file, orchestrator synthesizes.

**Why it wins:** CodeRabbit and similar tools review diffs in isolation. This one understands your codebase *holistically*. The self-hostable option is the killer differentiator — enterprises and security-conscious teams won't send code to third-party clouds. Dual distribution: GitHub Marketplace for easy install, self-hosted Docker image for enterprises.

**Monetization:**
- Free tier: Public repos, basic review
- Team: $29/mo per repo — deep context, custom rules, learning from your review history
- Enterprise: $199/mo per org — self-hosted, SSO, custom model support, audit logs

**Jobs signal:** Demonstrates production AI systems, multi-agent orchestration, code understanding at scale, and enterprise product thinking.

**Stack:** TypeScript + Bun, GitHub App webhooks, vector store for codebase context (pgvector or similar), LLM orchestration with fan-out per file, Postgres, React dashboard.

**MVP scope:** Single-repo, TypeScript codebases. Architectural consistency checks + bug detection on PRs. 2-3 week build.

**Competitive landscape:** CodeRabbit (cloud-only, no deep context), GitHub Copilot code review (surface-level), Graphite (merge workflow, not review). Self-hostable + deep context is unoccupied.

---

## Tier 2 — Strong Ideas, Clear Path

Solid market fit and monetization. Slightly narrower audience or longer path to virality than Tier 1.

---

### Self-Hosted Support Agent

**Category:** Business SaaS
**Tagline:** Your support team's senior engineer, available 24/7, hosted on your infrastructure.

**What it does:** An email/chat support copilot that combines RAG over your docs/knowledge base with action tools — can issue refunds, reset passwords, check order status, escalate to humans with full context. Self-hostable so customer data never leaves your infrastructure. Learns from past support interactions to improve over time.

**Why it wins:** Support is expensive and most AI chatbots are terrible because they can only regurgitate docs. This one actually *does things* — the action layer is the differentiator. Privacy-first teams (healthcare, fintech, EU companies) will pay a premium for self-hosted.

**Monetization:**
- Setup fee: $500-$2,000 (integration with existing support stack)
- Monthly: $99-$499 depending on volume
- Enterprise: Custom pricing for multi-tenant deployments

**Jobs signal:** Production AI systems, RAG pipelines, security posture, observability, enterprise integration. Directly hireable skills.

**Stack:** TypeScript + Bun, RAG pipeline (pgvector + embeddings), action tool framework (refund/reset/status APIs), Postgres, React admin dashboard, webhook integrations for email/chat platforms.

**MVP scope:** Email-only support for a single product. RAG over docs + 2-3 action tools (status check, escalate, FAQ response). 3-week build.

---

### Lead-to-Quote SMS Agent

**Category:** Small Business / Vertical SaaS
**Tagline:** Never miss a lead again. AI answers your business texts in seconds.

**What it does:** Inbound lead capture via SMS and WhatsApp. When a potential customer texts your business number, the agent qualifies the lead (budget, timeline, requirements), generates a quote based on your pricing rules, and books an appointment on your calendar. Hands off to a human when the conversation goes off-script or the deal is high-value.

**Why it wins:** Small businesses (contractors, agencies, freelancers) lose leads because they can't respond fast enough. Speed-to-lead is the #1 predictor of conversion. An agent that responds in 30 seconds with a personalized quote while you're on a job site is worth $500/mo to any contractor doing $50k+/year.

**Monetization:**
- Starter: $49/mo (100 conversations)
- Growth: $149/mo (unlimited conversations, CRM integration)
- Agency: $499/mo (white-label, multi-client)

**Jobs signal:** Conversational AI, business automation, CRM integration, SMS/messaging APIs. Shows you can build products real businesses pay for.

**Stack:** TypeScript + Bun, Twilio/WhatsApp Business API, LLM orchestration with guardrails, calendar integration (Cal.com or Google Calendar API), Postgres for lead tracking, React dashboard for business owners.

**MVP scope:** SMS-only, single business. Lead qualification flow + static pricing quote + calendar booking. 2-week build.

---

### Creator Clip Engine

**Category:** Creator Economy / Media AI
**Tagline:** AI watches your podcast so your audience doesn't have to watch all of it.

**What it does:** Agent ingests long-form video/podcast content, identifies the most engaging/viral-worthy segments using transcript analysis and engagement pattern matching, auto-clips and formats for each social platform (vertical for TikTok/Reels/Shorts, square for Twitter, landscape for YouTube), adds captions, and queues for posting.

**Why it wins:** Every creator with a podcast or YouTube channel needs clips for social. Current tools (Opus Clip, Vizard) are cloud-only and expensive. A self-hostable option with better AI selection (trained on what actually goes viral, not just "loud moments") has clear differentiation. The creator economy is $250B+ and growing.

**Monetization:**
- Free tier: 1 hour of content/month, watermarked
- Creator: $19/mo (10 hours, no watermark, all platforms)
- Agency: $79/mo (unlimited, multi-channel, API access, custom branding)

**Jobs signal:** Media AI, content pipelines, video processing (ffmpeg), NLP/transcript analysis. Interesting and different from typical DevTools — shows range.

**Stack:** TypeScript + Bun orchestration layer, Python for ML/NLP scoring (right tool for the job), ffmpeg for video processing, Whisper for transcription, Postgres for content library, React dashboard for review/approval.

**MVP scope:** YouTube video URL → auto-transcribe → identify top 3 clips → export as vertical video with captions. 2-3 week build.

---

### OpenClaw Workflow Packs / Marketplace

**Category:** Agent Platform / Ecosystem
**Tagline:** Pre-built agent workflows you install in one command.

**What it does:** A marketplace of curated, ready-to-use agent workflows for OpenClaw: automated release notes from git history, GitHub issue triage and labeling, customer follow-up sequences, daily standup summaries, dependency update monitoring, and more. Each pack is a versioned, configurable skill that installs via CLI.

**Why it wins:** OpenClaw has the runtime but the cold-start problem is real — users install it and ask "now what?" Workflow packs answer that question instantly. It's also a platform play: if you build the marketplace, you own the ecosystem. The ClaHub site already exists but is early — getting in now as a top contributor/curator establishes authority.

**Monetization:**
- Free packs: Community-contributed, open source
- Premium packs: $5-$25 one-time (complex workflows with custom integrations)
- Hosted execution tier: $19/mo — run workflows on managed infrastructure, no self-hosting required

**Jobs signal:** Agent platform thinking, product ecosystem design, developer experience. Shows you understand not just building agents but building *systems for agents*. This is the thinking that AI platform companies hire for.

**Stack:** TypeScript + Bun, OpenClaw skill API, npm-style package distribution, Postgres for marketplace metadata, React storefront.

**MVP scope:** 3-5 high-quality workflow packs (release notes, issue triage, daily digest) published to ClaHub. Blog post explaining the architecture. Build the packs first, marketplace infrastructure second.

---

### Open-Source AI Trading Dashboard

**Category:** Fintech / Self-Hosting
**Tagline:** Your trading journal, powered by an AI that actually reads the charts.

**What it does:** A self-hostable trading dashboard with AI-powered analysis, trade journaling, strategy backtesting, and real-time market commentary. Connects to brokers (IBKR, Alpaca) for live data and execution. The AI layer doesn't just chart — it maintains a running thesis on your positions and challenges your assumptions.

**Why it wins:** Trading communities spend money freely on tools. Existing platforms are either cloud-only (no data sovereignty) or dumb (no AI). A self-hostable, AI-native trading dashboard fills a real gap. The "AI that argues with your trade thesis" angle is sticky — traders love tools that make them think.

**Monetization:**
- Open-source core (self-hosted, IBKR/Alpaca integration)
- Pro: $29/mo — managed hosting, multi-broker, advanced backtesting
- Strategy marketplace: Revenue share on community-contributed strategies

**Jobs signal:** Fintech, real-time data systems, AI analysis pipelines, quantitative thinking. Differentiating resume piece — not another CRUD app.

**Stack:** Python (ecosystem is genuinely better here for trading — pandas, numpy, IBKR API). React + TypeScript frontend. Postgres for trade history and analysis. Augur codebase is the starting point.

**MVP scope:** Already partially built as `augur`. Polish the dashboard, add trade journaling with AI commentary, deploy a demo. 2-week effort to make it presentable.

---

## Tier 3 — Portfolio & Infrastructure

Useful projects that round out the portfolio. Lower commercial potential but high craft signal.

---

### Terminal Portfolio

Personal site that looks and behaves like a real terminal. Visitors type commands to explore your work, read about projects, check your stack, and navigate like they're SSH'd into your brain. SPA with a custom shell parser, command history, tab completion, and enough personality to make people stay.

**Why it's great:** It's a front door that filters for your kind of people. Anyone who enjoys it is someone worth talking to. Surprisingly shippable — the core is a text input and a command router.

**Stack:** React, Vite, Tailwind, deployed as a static SPA.

---

### Status Page Generator

Self-hosted uptime monitoring with a clean public status page. Ping your services on a schedule, record history, render a page that tells visitors (and yourself) what's up and what's down.

**Why it's great:** Everyone running self-hosted services needs this, and the existing options are either overkill or someone else's server. One `bun run` to start monitoring.

**Stack:** Bun server, Postgres, React frontend, cron-style health checks.

---

### Incident Journal

Structured log of what broke, when, why, and what fixed it. Searchable, taggable, linkable to specific services or repos. The thing you wish you had the third time you debug the same DNS issue at midnight.

**Why it's great:** Incident memory is high-leverage. Past-you solving a problem is the best documentation future-you will ever read.

**Stack:** Bun server, Postgres, React frontend with full-text search.

---

### Repo Health Dashboard

Point it at your GitHub and Codeberg repos. Scores them on documentation quality, test coverage, dependency freshness, commit frequency, and open issue hygiene. Gamify your maintenance discipline.

**Why it's great:** Turns "I should really update that repo" into a number you can't ignore.

**Stack:** Bun server, GitHub/Codeberg APIs, Postgres, React frontend.

---

### CLI Showcase

A site that renders your CLI tools with interactive, sandboxed demos. Visitors type real commands, see real output, and understand what your tools do by using them.

**Why it's great:** Most developer portfolios show screenshots. This one lets people *use* the work.

**Stack:** React, Vite, Tailwind, sandboxed execution (WASM or pre-recorded output trees).

---

### Link Garden

Curated collection of links with notes, tags, and a public page. Not a bookmarking app — a garden. Dead simple to maintain, RSS feed out.

**Why it's great:** It's a blog for people who discover more than they write.

**Stack:** Bun server, Postgres, React frontend, RSS generation.

---

### Dependency Graveyard

Scans every dependency across your repos. Flags abandoned packages, unmaintained libraries, and stale version pins. Scores your supply chain health.

**Why it's great:** The repo health dashboard's paranoid cousin. Most security incidents start with a dependency nobody was watching.

**Stack:** Bun server, GitHub/Codeberg APIs, npm/package registry APIs, Postgres, React frontend.
