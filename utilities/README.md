# Utilities

Third-party tools, scripts, and programs that live alongside the Claude repo.

All scripts are Python, run with `uv run`.

## Setup

**First time on a new machine?** Run the bootstrap script from the repo root -- it installs uv, Python, Ruff, and all utilities automatically:

```bash
python3 bootstrap.py
```

To set up individual tools manually, run the setup script for each:

```bash
# Glances (system monitoring)
uv run utilities/setup-glances.py
```

Each `setup-*.py` script is self-contained -- clones, installs, and configures one tool.

## Tools

| Tool | Description | Run |
|---|---|---|
| **Glances** | Cross-platform system monitoring (CPU, RAM, disk, network, containers) | `uv run utilities/glances/run-glances.py` |

### Glances Quick Reference

```bash
# TUI mode (default)
uv run utilities/glances/run-glances.py

# Web UI (http://localhost:61208)
uv run utilities/glances/run-glances.py -- -w

# Quick one-shot overview
uv run utilities/glances/run-glances.py -- --fetch

# JSON stats to stdout
uv run utilities/glances/run-glances.py -- --stdout-json cpu,mem
```
