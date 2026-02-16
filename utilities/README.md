# Utilities

Third-party tools, scripts, and non-TypeScript programs that live alongside the Claude repo.

## Setup

After cloning the Claude repo on a new environment, run the setup script for each tool you need:

```bash
# Glances (system monitoring)
./utilities/setup-glances.sh
```

Each `setup-*.sh` script is self-contained -- clones, installs, and configures one tool.

## Tools

| Tool | Description | Run |
|---|---|---|
| **Glances** | Cross-platform system monitoring (CPU, RAM, disk, network, containers) | `./utilities/glances/run-glances.sh` |

### Glances Quick Reference

```bash
# TUI mode (default)
./utilities/glances/run-glances.sh

# Web UI (http://localhost:61208)
./utilities/glances/run-glances.sh -w

# Quick one-shot overview
./utilities/glances/run-glances.sh --fetch

# JSON stats to stdout
./utilities/glances/run-glances.sh --stdout-json cpu,mem
```
