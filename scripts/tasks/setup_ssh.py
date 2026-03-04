"""Encrypted SSH backup and restore with atomic swap."""

from __future__ import annotations

import hashlib
import json
import os
import re
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
from scripts.crypto import CryptoFormat, decrypt, encrypt
from scripts.snapshot import directory_snapshot

SSH_FORMAT = CryptoFormat(magic="SCRYSSH2")


def _build_managed_block(
    github_host_alias: str,
    github_host_name: str,
    github_identity: str,
    codeberg_host_alias: str,
    codeberg_host_name: str,
    codeberg_identity: str,
) -> str:
    def block(host_alias: str, host_name: str, identity: str) -> str:
        return "\n".join(
            [
                f"Host {host_alias}",
                f"  HostName {host_name}",
                "  User git",
                f"  IdentityFile {identity}",
                "  IdentitiesOnly yes",
            ]
        )

    return "\n".join(
        [
            "# >>> scry managed git hosts >>>",
            block(github_host_alias, github_host_name, github_identity),
            "",
            block(codeberg_host_alias, codeberg_host_name, codeberg_identity),
            "# <<< scry managed git hosts <<<",
            "",
        ]
    )


def setup_ssh_backup() -> None:
    passphrase = os.environ.get("SCRY_SSH_BACKUP_PASSPHRASE", "")
    home = Path(os.environ.get("HOME", str(Path.home())))
    ssh_dir = home / ".ssh"
    repo_root = Path.cwd().resolve()
    vault_dir = repo_root / "vault" / "ssh"
    encrypted_file = Path(
        os.environ.get("SCRY_SSH_BACKUP_FILE", str(vault_dir / "ssh-keys.tar.enc"))
    )
    metadata_file = Path(
        os.environ.get("SCRY_SSH_METADATA_FILE", str(vault_dir / "ssh-keys.meta.json"))
    )

    log_step("Checking SSH backup prerequisites")
    if not command_exists("tar"):
        raise RuntimeError("Missing required tool: tar")
    print("ok: tar")

    if not ssh_dir.exists():
        raise RuntimeError(f"SSH directory not found: {ssh_dir}")

    if len(passphrase) < 16:
        raise RuntimeError(
            "Set SCRY_SSH_BACKUP_PASSPHRASE with at least 16 characters."
        )

    snap = directory_snapshot(str(ssh_dir))

    if encrypted_file.exists() and metadata_file.exists():
        try:
            metadata = json.loads(metadata_file.read_text())
            if metadata.get("sourceFingerprint") == snap.fingerprint:
                log_step("SSH backup unchanged")
                print(f"source fingerprint: {snap.fingerprint}")
                print("backup is already current; no files changed")
                return
        except (json.JSONDecodeError, KeyError):
            pass

    temp_dir = Path(tempfile.mkdtemp(prefix="scry-ssh-backup-"))

    try:
        log_step("Creating encrypted SSH archive")
        ensure_dir(vault_dir)
        ensure_parent_dir(str(encrypted_file))

        temp_tar = temp_dir / "ssh-keys.tar"
        run_or_throw(["tar", "-C", str(home), "-cf", str(temp_tar), ".ssh"])

        plaintext = temp_tar.read_bytes()
        payload = encrypt(plaintext, passphrase, SSH_FORMAT)
        encrypted_file.write_bytes(payload)
        encrypted_file.chmod(0o600)

        log_step("Writing backup metadata")
        metadata = {
            "createdAt": __import__("datetime")
            .datetime.now(__import__("datetime").timezone.utc)
            .isoformat(),
            "host": hostname(),
            "sourceDir": "~/.ssh",
            "encryptedBackupFile": str(encrypted_file.relative_to(repo_root)),
            "cipher": "aes-256-gcm",
            "kdf": "pbkdf2",
            "kdfDigest": "sha256",
            "kdfIterations": 250_000,
            "sourceFingerprint": snap.fingerprint,
            "sourceFileCount": snap.file_count,
            "sourceTotalBytes": snap.total_bytes,
            "encryptedBackupSha256": hashlib.sha256(
                encrypted_file.read_bytes()
            ).hexdigest(),
        }

        ensure_dir(metadata_file.parent)
        metadata_file.write_text(json.dumps(metadata, indent=2) + "\n")
        metadata_file.chmod(0o600)
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)

    log_step("SSH backup complete")
    print(f"created: {encrypted_file}")
    print(f"created: {metadata_file}")


def setup_ssh_restore() -> None:
    passphrase = os.environ.get("SCRY_SSH_BACKUP_PASSPHRASE", "")
    home = Path(os.environ.get("HOME", str(Path.home())))
    ssh_dir = home / ".ssh"
    repo_root = Path.cwd().resolve()
    restore_stamp = str(int(__import__("time").time() * 1000))
    staged_ssh_dir = home / f".ssh.scry-staged-{restore_stamp}"
    backup_ssh_dir = home / f".ssh.scry-backup-{restore_stamp}"

    encrypted_file = Path(
        os.environ.get(
            "SCRY_SSH_BACKUP_FILE",
            str(repo_root / "vault" / "ssh" / "ssh-keys.tar.enc"),
        )
    )
    github_host_alias = os.environ.get(
        "SCRY_GITHUB_HOST_ALIAS", "github.com-dunamismax"
    )
    github_host_name = os.environ.get("SCRY_GITHUB_HOSTNAME", "github.com")
    codeberg_host_alias = os.environ.get(
        "SCRY_CODEBERG_HOST_ALIAS", "codeberg.org-dunamismax"
    )
    codeberg_host_name = os.environ.get("SCRY_CODEBERG_HOSTNAME", "codeberg.org")
    github_identity = os.environ.get("SCRY_GITHUB_IDENTITY", "~/.ssh/id_ed25519")
    codeberg_identity = os.environ.get("SCRY_CODEBERG_IDENTITY", "~/.ssh/id_ed25519")

    log_step("Checking SSH restore prerequisites")
    if not command_exists("tar"):
        raise RuntimeError("Missing required tool: tar")
    print("ok: tar")

    if not encrypted_file.exists():
        raise RuntimeError(f"Encrypted backup not found: {encrypted_file}")

    if len(passphrase) < 16:
        raise RuntimeError(
            "Set SCRY_SSH_BACKUP_PASSPHRASE with at least 16 characters."
        )

    temp_dir = Path(tempfile.mkdtemp(prefix=f"scry-ssh-restore-{restore_stamp}-"))
    staged_ready = False
    backup_created = False
    restore_committed = False

    try:
        temp_tar = temp_dir / "ssh-keys.tar"
        extract_root = temp_dir / "extract-root"

        log_step("Decrypting and authenticating SSH archive")
        payload = encrypted_file.read_bytes()
        plaintext = decrypt(payload, passphrase, SSH_FORMAT)
        temp_tar.write_bytes(plaintext)

        log_step("Preparing staged ~/.ssh restore")
        extract_root.mkdir(parents=True)
        run_or_throw(["tar", "-C", str(extract_root), "-xf", str(temp_tar)])

        extracted_ssh = extract_root / ".ssh"
        if not extracted_ssh.exists():
            raise RuntimeError("Decrypted archive does not contain a .ssh directory.")

        if staged_ssh_dir.exists():
            shutil.rmtree(staged_ssh_dir)
        shutil.copytree(str(extracted_ssh), str(staged_ssh_dir))
        staged_ready = True

        log_step("Normalizing staged ~/.ssh permissions")

        def normalize(path: Path) -> None:
            if path.is_symlink():
                return
            if path.is_dir():
                path.chmod(0o700)
                for child in path.iterdir():
                    normalize(child)
                return
            if path.is_file():
                mode = (
                    0o644
                    if (path.suffix == ".pub" or "known_hosts" in path.name)
                    else 0o600
                )
                path.chmod(mode)

        normalize(staged_ssh_dir)

        log_step("Ensuring managed Git host entries in staged ~/.ssh/config")

        managed_start = "# >>> scry managed git hosts >>>"
        managed_end = "# <<< scry managed git hosts <<<"
        managed_block = _build_managed_block(
            github_host_alias,
            github_host_name,
            github_identity,
            codeberg_host_alias,
            codeberg_host_name,
            codeberg_identity,
        )
        staged_config = staged_ssh_dir / "config"

        existing = (
            staged_config.read_text().replace("\r\n", "\n")
            if staged_config.exists()
            else ""
        )
        pattern = re.compile(
            re.escape(managed_start) + r"[\s\S]*?" + re.escape(managed_end) + r"\n?"
        )
        without_managed = pattern.sub("", existing).strip()

        if not without_managed:
            next_config = managed_block
        else:
            next_config = f"{managed_block}\n{without_managed}"
            if not next_config.endswith("\n"):
                next_config += "\n"

        if next_config != existing:
            staged_config.write_text(next_config)
        staged_config.chmod(0o600)

        log_step("Atomically swapping staged restore into ~/.ssh")
        if ssh_dir.exists():
            ssh_dir.rename(backup_ssh_dir)
            backup_created = True

        try:
            staged_ssh_dir.rename(ssh_dir)
            staged_ready = False
            restore_committed = True
        except Exception:
            if backup_created and not ssh_dir.exists() and backup_ssh_dir.exists():
                backup_ssh_dir.rename(ssh_dir)
            raise

    except Exception:
        if backup_created and not restore_committed and not ssh_dir.exists():
            backup_ssh_dir.rename(ssh_dir)
        if staged_ready and staged_ssh_dir.exists():
            shutil.rmtree(staged_ssh_dir, ignore_errors=True)
        raise
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)

    log_step("SSH restore complete")
    print(f"restored: {ssh_dir}")
    if backup_created:
        print(f"backup: {backup_ssh_dir}")
    print(f"next: ssh -T git@{github_host_alias}")
    print(f"next: ssh -T git@{codeberg_host_alias}")
