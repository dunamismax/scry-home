"""Deterministic filesystem fingerprinting for backup change detection."""

from __future__ import annotations

import hashlib
from dataclasses import dataclass
from pathlib import Path


@dataclass
class Snapshot:
    fingerprint: str
    file_count: int
    total_bytes: int


def _add_entries(
    abs_path: Path,
    rel_path: str,
    entries: list[str],
    counters: dict[str, int],
) -> None:
    if abs_path.is_symlink():
        mode = oct(abs_path.lstat().st_mode & 0o777).replace("0o", "").zfill(3)
        counters["file_count"] += 1
        entries.append(f"symlink {rel_path} mode={mode} -> {abs_path.readlink()}")
        return

    if abs_path.is_dir():
        mode = oct(abs_path.stat().st_mode & 0o777).replace("0o", "").zfill(3)
        entries.append(f"dir {rel_path} mode={mode}")
        for child in sorted(abs_path.iterdir(), key=lambda c: c.name):
            child_rel = f"{rel_path}/{child.name}" if rel_path else child.name
            _add_entries(child, child_rel, entries, counters)
        return

    if abs_path.is_file():
        stat = abs_path.stat()
        mode = oct(stat.st_mode & 0o777).replace("0o", "").zfill(3)
        counters["file_count"] += 1
        counters["total_bytes"] += stat.st_size
        file_hash = hashlib.sha256(abs_path.read_bytes()).hexdigest()
        entries.append(
            f"file {rel_path} mode={mode} size={stat.st_size} sha256={file_hash}"
        )
        return

    mode = oct(abs_path.stat().st_mode & 0o777).replace("0o", "").zfill(3)
    entries.append(f"other {rel_path} mode={mode}")


def source_snapshot(root: str | Path, relative_paths: list[str]) -> Snapshot:
    """Compute a deterministic fingerprint over a set of paths relative to a root."""
    root_path = Path(root)
    entries: list[str] = []
    counters = {"file_count": 0, "total_bytes": 0}

    for rel_path in relative_paths:
        _add_entries(root_path / rel_path, rel_path, entries, counters)

    fingerprint = hashlib.sha256("\n".join(entries).encode()).hexdigest()
    return Snapshot(
        fingerprint=fingerprint,
        file_count=counters["file_count"],
        total_bytes=counters["total_bytes"],
    )


def directory_snapshot(root: str | Path) -> Snapshot:
    """Compute a fingerprint for all contents of a single directory root."""
    root_path = Path(root)
    entries: list[str] = []
    counters = {"file_count": 0, "total_bytes": 0}

    for child in sorted(root_path.iterdir(), key=lambda c: c.name):
        _add_entries(child, child.name, entries, counters)

    fingerprint = hashlib.sha256("\n".join(entries).encode()).hexdigest()
    return Snapshot(
        fingerprint=fingerprint,
        file_count=counters["file_count"],
        total_bytes=counters["total_bytes"],
    )
