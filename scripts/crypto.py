"""AES-256-GCM encryption/decryption with PBKDF2 key derivation.

Format-compatible with the original TypeScript implementation.
Requires the `cryptography` package: pip install cryptography
"""

from __future__ import annotations

import hashlib
import os
from dataclasses import dataclass

KDF_ITERATIONS = 250_000
KEY_LENGTH = 32
SALT_LENGTH = 16
IV_LENGTH = 12
AUTH_TAG_LENGTH = 16


@dataclass
class CryptoFormat:
    magic: str


def _derive_key(passphrase: str, salt: bytes) -> bytes:
    return hashlib.pbkdf2_hmac(
        "sha256", passphrase.encode(), salt, KDF_ITERATIONS, dklen=KEY_LENGTH
    )


def encrypt(plaintext: bytes, passphrase: str, fmt: CryptoFormat) -> bytes:
    try:
        from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    except ImportError as exc:
        raise RuntimeError(
            "The 'cryptography' package is required for encryption. Install with: pip install cryptography"
        ) from exc

    salt = os.urandom(SALT_LENGTH)
    iv = os.urandom(IV_LENGTH)
    key = _derive_key(passphrase, salt)

    aesgcm = AESGCM(key)
    # AESGCM.encrypt returns ciphertext + auth_tag (16 bytes appended)
    ct_with_tag = aesgcm.encrypt(iv, plaintext, None)
    ciphertext = ct_with_tag[:-AUTH_TAG_LENGTH]
    auth_tag = ct_with_tag[-AUTH_TAG_LENGTH:]

    return fmt.magic.encode() + salt + iv + auth_tag + ciphertext


def decrypt(payload: bytes, passphrase: str, fmt: CryptoFormat) -> bytes:
    try:
        from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    except ImportError as exc:
        raise RuntimeError(
            "The 'cryptography' package is required for decryption. Install with: pip install cryptography"
        ) from exc

    magic_len = len(fmt.magic)
    min_length = magic_len + SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH

    if len(payload) < min_length:
        raise RuntimeError("Encrypted payload is malformed or truncated.")

    magic = payload[:magic_len].decode("utf-8")
    if magic != fmt.magic:
        raise RuntimeError(f"Unexpected format magic: {magic} (expected {fmt.magic})")

    offset = magic_len
    salt = payload[offset : offset + SALT_LENGTH]
    offset += SALT_LENGTH
    iv = payload[offset : offset + IV_LENGTH]
    offset += IV_LENGTH
    auth_tag = payload[offset : offset + AUTH_TAG_LENGTH]
    offset += AUTH_TAG_LENGTH
    ciphertext = payload[offset:]

    key = _derive_key(passphrase, salt)
    aesgcm = AESGCM(key)

    # Reconstruct ciphertext + tag as AESGCM.decrypt expects
    ct_with_tag = ciphertext + auth_tag

    try:
        return aesgcm.decrypt(iv, ct_with_tag, None)
    except Exception as exc:
        raise RuntimeError(
            "Failed to decrypt and authenticate payload. Check passphrase and integrity."
        ) from exc
