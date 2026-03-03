# Scry / OpenClaw Max-Capability Playbook

Last updated: 2026-03-03

Audience: Stephen (`dunamismax`)

This is the practical roadmap to make your OpenClaw setup maximally useful while keeping security sane.

---

## 1) Current baseline (already strong)

- Primary chat/control surface: **Signal** (running, allowlisted)
- Model strategy: **Claude Opus 4.6 primary** + **Codex 5.3 OAuth fallback**
- Background-agent workflow: active and preferred
- Daily OpenClaw workspace sync + backup freshness monitoring + restore-drill reminders in place
- Tailscale-aware local gateway posture (`bind: loopback`, `allowTailscale: true`)

---

## 2) Highest-leverage OpenClaw capabilities (ranked)

1. **Background multi-agent orchestration**
   - Keep main thread responsive while Codex/ACP workers execute in parallel.
   - Biggest throughput multiplier for your coding workflow.

2. **Cron + isolated runs + delivery**
   - Scheduled automation for recurring maintenance, briefings, checks, and follow-ups.
   - Best for reliability and “don’t forget” execution.

3. **Hooks + Webhooks ingress**
   - Event-driven automations from external systems (GitHub/M365/Notion/etc.) into OpenClaw.
   - Core integration backbone.

4. **Browser automation (managed profile + Chrome relay)**
   - Automate systems that have no good API.
   - Especially strong for repetitive admin and ops tasks.

5. **Node control over Tailscale**
   - Run commands, inspect UI/canvas/screen, and execute remote workflows on paired nodes.

6. **Plugin/channel expansion**
   - Add additional messaging/work channels only when they improve signal-to-noise.

---

## 3) Integration map for your stack

## Notion
- Native OpenClaw channel: **No**
- Best path: Notion API + webhook/hook pipeline
- Recommended outcome:
  - Capture action items/decisions from chat into Notion automatically
  - Pull “today’s priorities” into morning brief cron jobs
- Requires your action:
  - Create Notion integration token + share target databases/pages

## GitHub / Codeberg
- Native OpenClaw channel: GitHub via `gh` CLI workflows (already strong)
- Best path:
  - PR triage/review agents
  - Issue-to-fix agent pipelines
  - Scheduled repo health checks
- Requires your action:
  - Ensure `gh auth` is valid per host/account where needed

## Docker
- Native OpenClaw capability: yes (via exec/tooling)
- Best path:
  - Repeatable local test/deploy scripts run by background agents
  - Environment parity checks in cron

## VS Code
- Native direct channel: **No**
- Best path:
  - Use background Codex/ACP + git workflow; VS Code remains your review/edit UI
  - Optional: run VS Code tasks via shell wrappers

## Microsoft 365 (Outlook/Teams/SharePoint)
- Native Teams support: **Yes (plugin)**
- Best path:
  - Enable Teams plugin if/when you want M365 chat-native operations
  - For Outlook/calendar/docs, use Graph + webhooks into OpenClaw hooks
- Requires your action:
  - Azure app registration, tenant consent, bot credentials/manifest decisions

## Ghostty terminal
- Native integration needed: no (OpenClaw already operates through shell/exec)
- Best path:
  - Keep OpenClaw as orchestrator, Ghostty as your operator cockpit

## RustDesk
- Native OpenClaw integration: **No direct**
- Best path:
  - Keep as manual break-glass remote channel
  - Optional: webhook trigger pattern from RustDesk events (if desired)

## Tailscale
- Native alignment: **Excellent**
- Best path:
  - Keep gateway loopback + Serve/Funnel only where explicitly needed
  - Use paired node host(s) over Tailnet for remote exec/browser

## Signal
- Native integration: **Active and primary**
- Best path:
  - Keep as command/control surface
  - Optional: selective reactions, voice/TTS, and proactive alert routing

## Brave browser
- Native alignment: **Yes** (OpenClaw browser supports Chromium-family)
- Best path:
  - Use managed `openclaw` profile for safe automation lanes
  - Use Chrome extension relay (`profile=chrome`) when you want takeover of existing tabs
- Requires your action:
  - Install/attach browser relay extension when needed

## LocalSend
- Native OpenClaw integration: **No direct**
- Best path:
  - File-drop automation script wrappers + monitored folders
  - Optional: cron/hook trigger for transfer workflows

---

## 4) What to enable next (recommended order)

## Phase A — Immediate (high value, low risk)
- [ ] Add an **integration backlog doc** per active project (`BUILD.md` + integration checklist)
- [ ] Add daily/weekly cron summaries (repos, tasks, calendar priorities)
- [ ] Add GitHub automation templates for issue triage and PR review cycles

## Phase B — External systems bridge
- [ ] Enable webhook ingress mappings (`/hooks/*`) for external triggers
- [ ] Build Notion sync hook (capture + retrieve)
- [ ] Add M365 event ingestion (calendar/inbox) via Graph webhook relay

## Phase C — Operator UX power-ups
- [ ] Enable browser relay workflows for repetitive web ops
- [ ] Expand node-driven remote operations on Tailnet
- [ ] Add selective proactive alerts by severity/channel

---

## 5) Decisions only Stephen should make before enabling

1. **Channel expansion policy**
   - Keep Signal-only vs enable Teams/Telegram/etc.
2. **Data sensitivity boundaries**
   - Which systems are allowed to feed data into OpenClaw automatically
3. **Automation aggressiveness**
   - Observe-only recommendations vs auto-act on certain classes of tasks
4. **Risk profile for browser/node actions**
   - Human approval required vs allowlist/full trust per action category
5. **M365/Notion credential scope**
   - Least privilege definitions before token issuance

---

## 6) Suggested “Max Power” default operating policy

- Background agents by default for non-trivial work
- Main thread always responsive for orchestration
- BUILD.md mandatory for multi-step projects
- New integration proposals always include:
  - value
  - setup cost
  - risk
  - rollback
- No silent high-risk enables (new channels, inbound webhooks, broad API scopes) without explicit approval

---

## 7) Outside-agent setup checklist (you do once, then I automate)

- [ ] Notion integration token + database/page IDs
- [ ] Microsoft Graph app credentials + consent model
- [ ] Teams plugin decision (on/off) and bot app package path
- [ ] Browser Relay extension installed + tested attach flow
- [ ] Any additional channel credentials (only if you want expansion)
- [ ] Confirm “auto-act vs ask-first” policy per integration

Once these are in place, Scry can run the whole system as an orchestrated control plane.
