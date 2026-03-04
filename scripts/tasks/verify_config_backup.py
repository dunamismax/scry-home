"""Verify encrypted config backup can be decrypted and contains required paths."""

from __future__ import annotations

import os
import shutil
import tempfile
from pathlib import Path

from scripts.common import log_step, run_or_throw
from scripts.crypto import CryptoFormat, decrypt

CONFIG_FORMAT = CryptoFormat(magic="SCRYCFG1")

REQUIRED_RESTORE_PATHS = [
    ".openclaw/openclaw.json",
    ".openclaw/credentials",
    ".openclaw/cron/jobs.json",
    ".openclaw/identity",
]


def verify_config_backup() -> None:
    passphrase = os.environ.get("SCRY_CONFIG_BACKUP_PASSPHRASE", "")
    repo_root = Path.cwd().resolve()
    encrypted_file = Path(
        os.environ.get(
            "SCRY_CONFIG_BACKUP_FILE",
            str(repo_root / "vault" / "config" / "critical-configs.tar.enc"),
        )
    )

    log_step("Checking config backup verification prerequisites")

    if len(passphrase) < 16:
        raise RuntimeError(
            "Set SCRY_CONFIG_BACKUP_PASSPHRASE with at least 16 characters before verification."
        )

    if not encrypted_file.exists():
        raise RuntimeError(f"Encrypted backup file not found: {encrypted_file}")

    encrypted = encrypted_file.read_bytes()

    log_step("Decrypting and extracting backup payload to temp workspace")

    temp_dir = Path(tempfile.mkdtemp(prefix="scry-config-verify-"))

    try:
        plaintext = decrypt(encrypted, passphrase, CONFIG_FORMAT)
        tar_path = temp_dir / "critical-configs.tar"
        tar_path.write_bytes(plaintext)

        run_or_throw(["tar", "-xf", str(tar_path), "-C", str(temp_dir)])

        log_step("Validating required restore paths")
        missing: list[str] = []

        for rel_path in REQUIRED_RESTORE_PATHS:
            abs_path = temp_dir / rel_path
            if not abs_path.exists():
                missing.append(rel_path)

        if missing:
            raise RuntimeError(
                f"Restore preview missing required paths: {', '.join(missing)}"
            )

        tar_size = tar_path.stat().st_size

        log_step("Config backup verification passed")
        print(f"artifact: {encrypted_file}")
        print(f"decrypted tar bytes: {tar_size}")
        print(f"required restore paths: {len(REQUIRED_RESTORE_PATHS)} present")
        print(f"home reference: {os.environ.get('HOME', str(Path.home()))}")
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)
