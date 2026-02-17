from __future__ import annotations

import os
import re
import shutil
import stat
import tempfile
from pathlib import Path

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.hashes import SHA256
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

from scripts.lib import command_exists, log_step, run_or_throw

PASSPHRASE = os.environ.get("SCRY_SSH_BACKUP_PASSPHRASE", "")
HOME = os.environ.get("HOME", "/home/sawyer")
SSH_DIR = Path(HOME, ".ssh")
SSH_CONFIG = SSH_DIR / "config"
REPO_ROOT = Path(__file__).resolve().parent.parent
ENCRYPTED_BACKUP_FILE = Path(
    os.environ.get("SCRY_SSH_BACKUP_FILE", str(REPO_ROOT / "vault" / "ssh" / "ssh-keys.tar.enc"))
)
GITHUB_IDENTITY = os.environ.get("SCRY_GITHUB_IDENTITY", "~/.ssh/id_ed25519")
CODEBERG_IDENTITY = os.environ.get("SCRY_CODEBERG_IDENTITY", "~/.ssh/id_ed25519")
MANAGED_BLOCK_START = "# >>> scry managed git hosts >>>"
MANAGED_BLOCK_END = "# <<< scry managed git hosts <<<"

KDF_ITERATIONS = 250_000
KEY_LENGTH = 32
SALT_LENGTH = 16
IV_LENGTH = 12
AUTH_TAG_LENGTH = 16
FORMAT_MAGIC = b"SCRYSSH2"


def _derive_key(salt: bytes) -> bytes:
    kdf = PBKDF2HMAC(algorithm=SHA256(), length=KEY_LENGTH, salt=salt, iterations=KDF_ITERATIONS)
    return kdf.derive(PASSPHRASE.encode())


def _ensure_prereqs() -> None:
    log_step("Checking SSH restore prerequisites")
    if not command_exists("tar"):
        raise RuntimeError("Missing required tool: tar")
    print("ok: tar")
    if not ENCRYPTED_BACKUP_FILE.exists():
        raise RuntimeError(f"Encrypted backup not found: {ENCRYPTED_BACKUP_FILE}")
    if len(PASSPHRASE) < 16:
        raise RuntimeError(
            "Set SCRY_SSH_BACKUP_PASSPHRASE with at least 16 characters before restoring backups."
        )


def _decrypt_archive_to_tar(encrypted_path: Path, tar_path: Path) -> None:
    payload = encrypted_path.read_bytes()
    magic_len = len(FORMAT_MAGIC)
    min_len = magic_len + SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH + 1
    if len(payload) < min_len:
        raise RuntimeError("Encrypted SSH backup is malformed or truncated.")
    if payload[:magic_len] != FORMAT_MAGIC:
        raise RuntimeError("Encrypted SSH backup format is unsupported.")

    offset = magic_len
    salt = payload[offset : offset + SALT_LENGTH]
    offset += SALT_LENGTH
    iv = payload[offset : offset + IV_LENGTH]
    offset += IV_LENGTH
    auth_tag = payload[offset : offset + AUTH_TAG_LENGTH]
    offset += AUTH_TAG_LENGTH
    ciphertext = payload[offset:]

    key = _derive_key(salt)
    aesgcm = AESGCM(key)

    # Reconstruct the combined ciphertext+tag that AESGCM.decrypt expects.
    combined = ciphertext + auth_tag
    try:
        plaintext = aesgcm.decrypt(iv, combined, None)
    except Exception as exc:
        raise RuntimeError(
            "Failed to decrypt and authenticate SSH backup. "
            "Check SCRY_SSH_BACKUP_PASSPHRASE and backup integrity."
        ) from exc
    tar_path.write_bytes(plaintext)


def _decrypt_and_extract(temp_dir: Path) -> None:
    temp_tar = temp_dir / "ssh-keys.tar"
    extract_root = temp_dir / "extract-root"

    log_step("Decrypting and authenticating SSH archive")
    _decrypt_archive_to_tar(ENCRYPTED_BACKUP_FILE, temp_tar)

    log_step("Restoring ~/.ssh from decrypted archive")
    Path(HOME).mkdir(parents=True, exist_ok=True)
    extract_root.mkdir(parents=True, exist_ok=True)
    run_or_throw(["tar", "-C", str(extract_root), "-xf", str(temp_tar)])

    extracted_ssh = extract_root / ".ssh"
    if not extracted_ssh.is_dir():
        raise RuntimeError("Decrypted archive does not contain a .ssh directory.")

    if SSH_DIR.exists():
        shutil.rmtree(SSH_DIR)
    shutil.copytree(extracted_ssh, SSH_DIR, dirs_exist_ok=True)


def _set_permissions_recursive(path: Path) -> None:
    st = path.lstat()
    if stat.S_ISLNK(st.st_mode):
        return
    if path.is_dir():
        path.chmod(0o700)
        for child in path.iterdir():
            _set_permissions_recursive(child)
        return
    if not path.is_file():
        return
    mode = 0o644 if (path.suffix == ".pub" or "known_hosts" in path.name) else 0o600
    path.chmod(mode)


def _build_managed_host_block(host: str, identity_file: str) -> str:
    return "\n".join(
        [
            f"Host {host}",
            f"  HostName {host}",
            "  User git",
            f"  IdentityFile {identity_file}",
            "  IdentitiesOnly yes",
        ]
    )


def _ensure_managed_host_config() -> None:
    managed_block = "\n".join(
        [
            MANAGED_BLOCK_START,
            _build_managed_host_block("github.com", GITHUB_IDENTITY),
            "",
            _build_managed_host_block("codeberg.org", CODEBERG_IDENTITY),
            MANAGED_BLOCK_END,
            "",
        ]
    )

    existing = SSH_CONFIG.read_text() if SSH_CONFIG.exists() else ""
    existing = existing.replace("\r\n", "\n")
    pattern = re.compile(
        re.escape(MANAGED_BLOCK_START) + r"[\s\S]*?" + re.escape(MANAGED_BLOCK_END) + r"\n?"
    )
    without = pattern.sub("", existing).strip()

    if without:
        next_config = managed_block + "\n" + without
        if not next_config.endswith("\n"):
            next_config += "\n"
    else:
        next_config = managed_block

    if existing == next_config:
        return

    SSH_CONFIG.write_text(next_config)


def _normalize_permissions_and_config() -> None:
    log_step("Normalizing ~/.ssh permissions")
    if not SSH_DIR.is_dir():
        raise RuntimeError(f"Restore completed but SSH directory is missing: {SSH_DIR}")
    _set_permissions_recursive(SSH_DIR)

    log_step("Ensuring managed Git host entries in ~/.ssh/config")
    _ensure_managed_host_config()
    SSH_CONFIG.chmod(0o600)


def main() -> None:
    _ensure_prereqs()
    temp_dir = Path(tempfile.mkdtemp(prefix="scry-ssh-restore-"))
    try:
        _decrypt_and_extract(temp_dir)
        _normalize_permissions_and_config()
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)

    log_step("SSH restore complete")
    print(f"restored: {SSH_DIR}")
    print("next: ssh -T git@github.com")
    print("next: ssh -T git@codeberg.org")


if __name__ == "__main__":
    main()
