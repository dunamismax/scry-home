# HEARTBEAT.md

## Checklist

- Check for any active Codex CLI lanes or monitoring sessions already in flight.
- If today's `memory/YYYY-MM-DD.md` does not exist, create it with a session header.
- Inspect `runs/` for stale lanes (older than 30 minutes without meaningful progress) and flag them.
- If there is active work, report lane status, health, blocker state, and next milestone.
- If idle with no active work and nothing needs attention, reply `HEARTBEAT_OK`.
