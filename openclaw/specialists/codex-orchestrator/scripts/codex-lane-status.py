#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
from pathlib import Path

from codex_lane_lib import read_run


def main() -> int:
    if len(sys.argv) not in (2, 3):
        print("Usage: codex-lane-status.py <run-dir-or-stdout-log> [stale-minutes]", file=sys.stderr)
        return 2

    target = Path(sys.argv[1]).expanduser()
    stale_minutes = int(sys.argv[2]) if len(sys.argv) == 3 else 30
    run_dir = target if target.is_dir() else target.parent

    print(json.dumps(read_run(run_dir, stale_minutes=stale_minutes), indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
