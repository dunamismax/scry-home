#!/usr/bin/env bash
# Clones, installs, and configures Glances (system monitoring tool).
# Fully automated -- run this on a fresh environment to get Glances ready.
# Requires: Python 3.10+ (prefers 3.13), git
#
# Usage: ./utilities/setup-glances.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=== Glances Setup ==="

# --- Glances ---
GLANCES_DIR="$SCRIPT_DIR/glances"
if [ ! -d "$GLANCES_DIR" ]; then
  echo "[glances] Cloning..."
  git clone https://github.com/nicolargo/glances.git "$GLANCES_DIR"
else
  echo "[glances] Already cloned. Pulling latest..."
  git -C "$GLANCES_DIR" pull --ff-only || true
fi

# Detect best available Python (prefer 3.13+)
PYTHON=""
for candidate in python3.13 python3.12 python3; do
  if command -v "$candidate" &>/dev/null; then
    PYTHON="$candidate"
    break
  fi
done

if [ -z "$PYTHON" ]; then
  echo "[glances] ERROR: No Python 3 found. Install Python 3.10+ first."
  exit 1
fi

echo "[glances] Using $PYTHON ($($PYTHON --version))"

if [ ! -d "$GLANCES_DIR/.venv" ]; then
  echo "[glances] Creating venv..."
  "$PYTHON" -m venv "$GLANCES_DIR/.venv"
fi

echo "[glances] Installing Glances with all features..."
source "$GLANCES_DIR/.venv/bin/activate"
pip install --upgrade pip -q
pip install 'glances[all]' -q
deactivate

echo "[glances] Done. Run with: $GLANCES_DIR/run-glances.sh"

echo ""
echo "=== Setup Complete ==="
