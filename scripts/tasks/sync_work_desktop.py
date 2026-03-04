"""Bidirectional sync between Google Drive and OneDrive Work Desktop folders.

After cloud-to-cloud sync, mirrors OneDrive → local git repo.

Usage:
  python3 -m scripts sync:work-desktop              # live run
  python3 -m scripts sync:work-desktop --dry-run     # preview only
"""

from __future__ import annotations

import shutil
import sys
from pathlib import Path

from scripts.common import log_step

HOME = Path.home()
GDRIVE_WD = HOME / "Google Drive" / "My Drive" / "Work Desktop"
ONEDRIVE_WD = HOME / "OneDrive - Imaging Services Inc" / "Work Desktop"
GIT_WD = HOME / "github" / "work" / "Work Desktop"

SKIP_EXACT = {".DS_Store", "Thumbs.db", "desktop.ini"}
SKIP_PREFIX = [".~lock.", "~$"]

MTIME_TOLERANCE_MS = 2_000


def _should_skip(name: str) -> bool:
    if name in SKIP_EXACT:
        return True
    return any(name.startswith(p) for p in SKIP_PREFIX)


def _walk_dir(root: Path) -> dict[str, dict]:
    entries: dict[str, dict] = {}

    def walk(dir_path: Path) -> None:
        try:
            items = sorted(dir_path.iterdir(), key=lambda p: p.name)
        except OSError:
            print(f"  [WARN] cannot read directory: {dir_path}")
            return

        for item in items:
            if _should_skip(item.name):
                continue

            if item.is_symlink():
                continue
            elif item.is_dir():
                walk(item)
            elif item.is_file():
                try:
                    stat = item.stat()
                    rel = str(item.relative_to(root))
                    entries[rel] = {
                        "rel_path": rel,
                        "abs_path": item,
                        "mtime_ms": stat.st_mtime * 1000,
                        "size": stat.st_size,
                    }
                except OSError:
                    print(f"  [WARN] cannot stat: {item}")

    walk(root)
    return entries


def _copy_with_mtime(src: Path, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(str(src), str(dest))


def _sync_clouds(dry_run: bool) -> None:
    log_step("Scanning Google Drive / Work Desktop …")
    g_files = _walk_dir(GDRIVE_WD)
    print(f"  {len(g_files)} files indexed")

    log_step("Scanning OneDrive / Work Desktop …")
    o_files = _walk_dir(ONEDRIVE_WD)
    print(f"  {len(o_files)} files indexed")

    all_paths = sorted(set(g_files) | set(o_files))
    log_step(f"Syncing {len(all_paths)} unique paths (Google Drive ↔ OneDrive) …")

    copied = 0
    updated = 0
    skipped = 0
    tag = "[DRY-RUN] " if dry_run else ""

    for rel in all_paths:
        g = g_files.get(rel)
        o = o_files.get(rel)

        if g and not o:
            dest = ONEDRIVE_WD / rel
            print(f"  {tag}[COPY] gdrive → onedrive: {rel}")
            if not dry_run:
                try:
                    _copy_with_mtime(g["abs_path"], dest)
                except OSError as exc:
                    print(f"  [WARN] copy failed (cloud-only?): {rel} — {exc}")
            copied += 1
            continue

        if o and not g:
            dest = GDRIVE_WD / rel
            print(f"  {tag}[COPY] onedrive → gdrive: {rel}")
            if not dry_run:
                try:
                    _copy_with_mtime(o["abs_path"], dest)
                except OSError as exc:
                    print(f"  [WARN] copy failed (cloud-only?): {rel} — {exc}")
            copied += 1
            continue

        if g and o:
            diff = g["mtime_ms"] - o["mtime_ms"]

            if abs(diff) <= MTIME_TOLERANCE_MS and g["size"] == o["size"]:
                skipped += 1
                continue

            if diff > MTIME_TOLERANCE_MS:
                src, dest_root, src_label, dest_label = (
                    g,
                    ONEDRIVE_WD,
                    "gdrive",
                    "onedrive",
                )
            else:
                src, dest_root, src_label, dest_label = (
                    o,
                    GDRIVE_WD,
                    "onedrive",
                    "gdrive",
                )

            age_secs = round(abs(diff) / 1000)
            print(
                f"  {tag}[UPDATE] {src_label} → {dest_label}: {rel} ({src_label} newer by {age_secs}s)"
            )
            if not dry_run:
                try:
                    _copy_with_mtime(src["abs_path"], dest_root / rel)
                except OSError as exc:
                    print(f"  [WARN] update failed (cloud-only?): {rel} — {exc}")
            updated += 1

    print(
        f"\n  result: {copied} copied, {updated} updated, {skipped} identical/skipped"
    )


def _backup_to_git(dry_run: bool) -> None:
    log_step("Mirroring OneDrive Work Desktop → github/work/Work Desktop …")

    if not dry_run:
        GIT_WD.mkdir(parents=True, exist_ok=True)

    o_files = _walk_dir(ONEDRIVE_WD)
    g_files = _walk_dir(GIT_WD)

    copied = 0
    updated = 0
    deleted = 0
    skipped = 0
    warned = 0
    tag = "[DRY-RUN] " if dry_run else ""

    for rel, o_entry in o_files.items():
        dest = GIT_WD / rel
        g_entry = g_files.get(rel)

        if not g_entry:
            print(f"  {tag}[COPY] onedrive → git: {rel}")
            if not dry_run:
                try:
                    _copy_with_mtime(o_entry["abs_path"], dest)
                    copied += 1
                except OSError as exc:
                    print(f"  [WARN] copy failed (cloud-only?): {rel} — {exc}")
                    warned += 1
            else:
                copied += 1
            continue

        diff = abs(o_entry["mtime_ms"] - g_entry["mtime_ms"])
        if diff <= MTIME_TOLERANCE_MS and o_entry["size"] == g_entry["size"]:
            skipped += 1
            continue

        print(f"  {tag}[UPDATE] onedrive → git: {rel}")
        if not dry_run:
            try:
                _copy_with_mtime(o_entry["abs_path"], dest)
                updated += 1
            except OSError as exc:
                print(f"  [WARN] update failed (cloud-only?): {rel} — {exc}")
                warned += 1
        else:
            updated += 1

    for rel, g_entry in g_files.items():
        if rel not in o_files:
            print(f"  {tag}[DELETE] from git: {rel}")
            if not dry_run:
                try:
                    g_entry["abs_path"].unlink()
                    deleted += 1
                except OSError as exc:
                    print(f"  [WARN] delete failed: {rel} — {exc}")
                    warned += 1
            else:
                deleted += 1

    warn_suffix = f", {warned} warned (cloud-only files skipped)" if warned > 0 else ""
    print(
        f"\n  result: {copied} copied, {updated} updated, {deleted} deleted, {skipped} skipped{warn_suffix}"
    )


def sync_work_desktop() -> None:
    dry_run = "--dry-run" in sys.argv

    if dry_run:
        print("\n[DRY-RUN mode — no files will be written]\n")

    _sync_clouds(dry_run)
    _backup_to_git(dry_run)

    log_step("All done.")
