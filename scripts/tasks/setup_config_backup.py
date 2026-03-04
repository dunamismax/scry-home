"""Encrypted backup of critical config files (SSH, OpenClaw, dotfiles)."""

from __future__ import annotations

import hashlib
import json
import os
import shutil
import tempfile
from pathlib import Path
from platform import node as hostname

from scripts.common import (
    command_exists,
    ensure_dir,
    ensure_parent_dir,
    log_step,
    run_or_throw,
)
from scripts.crypto import CryptoFormat, encrypt
from scripts.snapshot import source_snapshot

CONFIG_FORMAT = CryptoFormat(magic="SCRYCFG1")

DEFAULT_CONFIG_PATHS = [
    ".ssh",
    ".gitconfig",
    ".zshrc",
    ".zprofile",
    ".codex/.codex-global-state.json",
    ".codex/config.toml",
    ".codex/rules",
    ".codex/auth.json",
    ".codex/state_5.sqlite",
    ".claude/settings.json",
    ".openclaw/openclaw.json",
    ".openclaw/openclaw.json.bak",
    ".openclaw/openclaw.json.bak.1",
    ".openclaw/openclaw.json.bak.2",
    ".openclaw/openclaw.json.bak.3",
    ".openclaw/openclaw.json.bak.4",
    ".openclaw/agents/main/agent",
    ".openclaw/credentials",
    ".openclaw/cron/jobs.json",
    ".openclaw/devices",
    ".openclaw/devices/paired.json",
    ".openclaw/exec-approvals.json",
    ".openclaw/identity",
    "Library/LaunchAgents",
    "Library/Application Support/OpenClaw/identity",
    "Library/Application Support/Code - Insiders/User/mcp.json",
    "Library/Application Support/Code/User/mcp.json",
]


def parse_path_list(value: str) -> list[str]:
    return [
        item.strip() for item in value.replace(",", "\n").split("\n") if item.strip()
    ]


def normalize_home_relative_path(home: str, raw: str) -> str:
    trimmed = raw.strip().removeprefix("~/").removeprefix("./")
    resolved = (Path(home) / trimmed).resolve()
    rel = str(resolved.relative_to(Path(home).resolve()))

    if not trimmed or not rel or rel.startswith("..") or "\0" in rel:
        raise ValueError(f"Invalid config backup path: {raw}")

    return rel


def build_config_path_set(home: str) -> dict[str, list[str]]:
    extra_raw = os.environ.get("SCRY_CONFIG_EXTRA_PATHS", "")
    exclude_raw = os.environ.get("SCRY_CONFIG_EXCLUDE_PATHS", "")

    requested: list[str] = list(DEFAULT_CONFIG_PATHS)
    if extra_raw:
        requested.extend(parse_path_list(extra_raw))

    excludes = {
        normalize_home_relative_path(home, item)
        for item in parse_path_list(exclude_raw)
    }
    deduped: set[str] = set()
    requested_paths: list[str] = []
    included_paths: list[str] = []
    missing_paths: list[str] = []

    for raw_path in requested:
        rel_path = normalize_home_relative_path(home, raw_path)
        if rel_path in deduped:
            continue
        deduped.add(rel_path)
        requested_paths.append(rel_path)

        if rel_path in excludes:
            continue

        abs_path = Path(home) / rel_path
        if abs_path.exists():
            included_paths.append(rel_path)
        else:
            missing_paths.append(rel_path)

    return {
        "requested_paths": requested_paths,
        "included_paths": included_paths,
        "missing_paths": missing_paths,
    }


def setup_config_backup() -> None:
    passphrase = os.environ.get("SCRY_CONFIG_BACKUP_PASSPHRASE", "")
    home = os.environ.get("HOME", str(Path.home()))
    repo_root = Path.cwd().resolve()
    vault_dir = repo_root / "vault" / "config"
    encrypted_file = Path(
        os.environ.get(
            "SCRY_CONFIG_BACKUP_FILE", str(vault_dir / "critical-configs.tar.enc")
        )
    )
    metadata_file = Path(
        os.environ.get(
            "SCRY_CONFIG_METADATA_FILE", str(vault_dir / "critical-configs.meta.json")
        )
    )

    log_step("Checking config backup prerequisites")
    if not command_exists("tar"):
        raise RuntimeError("Missing required tool: tar")
    print("ok: tar")

    if len(passphrase) < 16:
        raise RuntimeError(
            "Set SCRY_CONFIG_BACKUP_PASSPHRASE with at least 16 characters."
        )

    path_set = build_config_path_set(home)
    included_paths = path_set["included_paths"]
    missing_paths = path_set["missing_paths"]
    requested_paths = path_set["requested_paths"]

    if not included_paths:
        raise RuntimeError(
            "No backup paths were found. Check SCRY_CONFIG_EXTRA_PATHS and SCRY_CONFIG_EXCLUDE_PATHS."
        )

    snap = source_snapshot(home, included_paths)

    if encrypted_file.exists() and metadata_file.exists():
        try:
            metadata = json.loads(metadata_file.read_text())
            if (
                metadata.get("sourceFingerprint") == snap.fingerprint
                and metadata.get("includedPaths") == included_paths
            ):
                log_step("Config backup unchanged")
                print(f"source fingerprint: {snap.fingerprint}")
                print("backup is already current; no files changed")
                return
        except (json.JSONDecodeError, KeyError):
            pass

    temp_dir = Path(tempfile.mkdtemp(prefix="scry-config-backup-"))

    try:
        log_step("Creating encrypted critical config archive")
        ensure_dir(vault_dir)
        ensure_parent_dir(str(encrypted_file))

        temp_tar = temp_dir / "critical-configs.tar"
        run_or_throw(["tar", "-C", home, "-cf", str(temp_tar), *included_paths])

        plaintext = temp_tar.read_bytes()
        payload = encrypt(plaintext, passphrase, CONFIG_FORMAT)
        encrypted_file.write_bytes(payload)
        encrypted_file.chmod(0o600)

        log_step("Writing backup metadata")
        from datetime import datetime, timezone

        metadata = {
            "createdAt": datetime.now(timezone.utc).isoformat(),
            "host": hostname(),
            "sourceHome": "~",
            "encryptedBackupFile": str(encrypted_file.relative_to(repo_root)),
            "cipher": "aes-256-gcm",
            "kdf": "pbkdf2",
            "kdfDigest": "sha256",
            "kdfIterations": 250_000,
            "sourceFingerprint": snap.fingerprint,
            "sourceFileCount": snap.file_count,
            "sourceTotalBytes": snap.total_bytes,
            "requestedPaths": requested_paths,
            "includedPaths": included_paths,
            "missingPaths": missing_paths,
            "encryptedBackupSha256": hashlib.sha256(
                encrypted_file.read_bytes()
            ).hexdigest(),
        }

        ensure_dir(metadata_file.parent)
        metadata_file.write_text(json.dumps(metadata, indent=2) + "\n")
        metadata_file.chmod(0o600)
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)

    log_step("Critical config backup complete")
    print(f"created: {encrypted_file}")
    print(f"created: {metadata_file}")
    print(f"included paths: {len(included_paths)}")
    if missing_paths:
        print(f"missing paths: {len(missing_paths)}")
