from __future__ import annotations

import hashlib
import json
import os
import socket
import tempfile
from pathlib import Path

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.hashes import SHA256
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

from scripts.lib import command_exists, ensure_dir, log_step, run_or_throw

PASSPHRASE = os.environ.get("SCRY_SSH_BACKUP_PASSPHRASE", "")
HOME = os.environ.get("HOME", "/home/sawyer")
SSH_DIR = Path(HOME, ".ssh")
REPO_ROOT = Path(__file__).resolve().parent.parent
VAULT_DIR = REPO_ROOT / "vault" / "ssh"
ENCRYPTED_BACKUP_FILE = Path(
    os.environ.get("SCRY_SSH_BACKUP_FILE", str(VAULT_DIR / "ssh-keys.tar.enc"))
)
METADATA_FILE = Path(
    os.environ.get("SCRY_SSH_METADATA_FILE", str(VAULT_DIR / "ssh-keys.meta.json"))
)

KDF_ITERATIONS = 250_000
KEY_LENGTH = 32
SALT_LENGTH = 16
IV_LENGTH = 12
FORMAT_MAGIC = b"SCRYSSH2"


def _derive_key(salt: bytes) -> bytes:
    kdf = PBKDF2HMAC(algorithm=SHA256(), length=KEY_LENGTH, salt=salt, iterations=KDF_ITERATIONS)
    return kdf.derive(PASSPHRASE.encode())


def _sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    h.update(path.read_bytes())
    return h.hexdigest()


def _compute_source_snapshot(root: Path) -> tuple[str, int, int]:
    """Returns (fingerprint, file_count, total_bytes)."""
    entries: list[str] = []
    file_count = 0
    total_bytes = 0

    def visit(current: Path) -> None:
        nonlocal file_count, total_bytes
        for entry in sorted(current.iterdir(), key=lambda p: p.name):
            rel = entry.relative_to(root).as_posix()
            mode = oct(entry.lstat().st_mode & 0o777).lstrip("0o").zfill(3)
            if entry.is_symlink():
                file_count += 1
                entries.append(f"symlink {rel} mode={mode} -> {os.readlink(entry)}")
            elif entry.is_dir():
                entries.append(f"dir {rel} mode={mode}")
                visit(entry)
            elif entry.is_file():
                file_count += 1
                size = entry.stat().st_size
                total_bytes += size
                file_hash = _sha256_file(entry)
                entries.append(f"file {rel} mode={mode} size={size} sha256={file_hash}")
            else:
                entries.append(f"other {rel} mode={mode}")

    visit(root)
    fingerprint = hashlib.sha256("\n".join(entries).encode()).hexdigest()
    return fingerprint, file_count, total_bytes


def _ensure_prereqs() -> None:
    log_step("Checking SSH backup prerequisites")
    if not command_exists("tar"):
        raise RuntimeError("Missing required tool: tar")
    print("ok: tar")
    if not SSH_DIR.is_dir():
        raise RuntimeError(f"SSH directory not found: {SSH_DIR}")
    if len(PASSPHRASE) < 16:
        raise RuntimeError(
            "Set SCRY_SSH_BACKUP_PASSPHRASE with at least 16 characters before creating backups."
        )


def _backup_is_current(fingerprint: str) -> bool:
    if not ENCRYPTED_BACKUP_FILE.exists():
        return False
    if not METADATA_FILE.exists():
        return False
    try:
        meta = json.loads(METADATA_FILE.read_text())
        return bool(meta.get("sourceFingerprint") == fingerprint)
    except (json.JSONDecodeError, OSError):
        return False


def _encrypt_archive(plain_tar: Path, encrypted_path: Path) -> None:
    plaintext = plain_tar.read_bytes()
    salt = os.urandom(SALT_LENGTH)
    iv = os.urandom(IV_LENGTH)
    key = _derive_key(salt)
    aesgcm = AESGCM(key)
    ciphertext_with_tag = aesgcm.encrypt(iv, plaintext, None)
    # AESGCM.encrypt appends the 16-byte tag to ciphertext.
    # Our format: MAGIC + salt + iv + authTag(16) + ciphertext
    auth_tag = ciphertext_with_tag[-16:]
    ciphertext = ciphertext_with_tag[:-16]
    payload = FORMAT_MAGIC + salt + iv + auth_tag + ciphertext
    encrypted_path.write_bytes(payload)


def _create_encrypted_archive(temp_dir: Path) -> None:
    log_step("Creating encrypted SSH archive")
    ensure_dir(VAULT_DIR)
    ensure_dir(ENCRYPTED_BACKUP_FILE.parent)
    temp_tar = temp_dir / "ssh-keys.tar"
    temp_enc = temp_dir / "ssh-keys.tar.enc"
    run_or_throw(["tar", "-C", HOME, "-cf", str(temp_tar), ".ssh"])
    _encrypt_archive(temp_tar, temp_enc)
    temp_enc.chmod(0o600)
    temp_enc.rename(ENCRYPTED_BACKUP_FILE)


def _write_metadata(fingerprint: str, file_count: int, total_bytes: int) -> None:
    log_step("Writing backup metadata")
    meta = {
        "createdAt": __import__("datetime").datetime.now().isoformat(),
        "host": socket.gethostname(),
        "sourceDir": str(SSH_DIR),
        "encryptedBackupFile": str(ENCRYPTED_BACKUP_FILE),
        "cipher": "aes-256-gcm",
        "kdf": "pbkdf2",
        "kdfDigest": "sha256",
        "kdfIterations": KDF_ITERATIONS,
        "sourceFingerprint": fingerprint,
        "sourceFileCount": file_count,
        "sourceTotalBytes": total_bytes,
        "encryptedBackupSha256": _sha256_file(ENCRYPTED_BACKUP_FILE),
    }
    ensure_dir(METADATA_FILE.parent)
    METADATA_FILE.write_text(json.dumps(meta, indent=2) + "\n")
    METADATA_FILE.chmod(0o600)


def main() -> None:
    _ensure_prereqs()
    fingerprint, file_count, total_bytes = _compute_source_snapshot(SSH_DIR)
    if _backup_is_current(fingerprint):
        log_step("SSH backup unchanged")
        print(f"source fingerprint: {fingerprint}")
        print("backup is already current; no files changed")
        return

    temp_dir = Path(tempfile.mkdtemp(prefix="scry-ssh-backup-"))
    try:
        _create_encrypted_archive(temp_dir)
        _write_metadata(fingerprint, file_count, total_bytes)
    finally:
        import shutil

        shutil.rmtree(temp_dir, ignore_errors=True)

    log_step("SSH backup complete")
    print(f"created: {ENCRYPTED_BACKUP_FILE}")
    print(f"created: {METADATA_FILE}")


if __name__ == "__main__":
    main()
