import { type DecipherGCM, createDecipheriv, pbkdf2Sync } from "node:crypto";
import {
  chmodSync,
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { commandExists, logStep, runOrThrow } from "./lib";

const passphrase = process.env.SCRY_SSH_BACKUP_PASSPHRASE ?? "";
const home = process.env.HOME ?? "/home/sawyer";
const sshDir = resolve(home, ".ssh");
const sshConfigPath = resolve(sshDir, "config");
const repoRoot = resolve(import.meta.dir, "..");
const encryptedBackupFile = process.env.SCRY_SSH_BACKUP_FILE
  ? resolve(process.env.SCRY_SSH_BACKUP_FILE)
  : resolve(repoRoot, "vault/ssh/ssh-keys.tar.enc");
const githubIdentity = process.env.SCRY_GITHUB_IDENTITY ?? "~/.ssh/id_ed25519";
const codebergIdentity = process.env.SCRY_CODEBERG_IDENTITY ?? "~/.ssh/id_ed25519";
const managedBlockStart = "# >>> scry managed git hosts >>>";
const managedBlockEnd = "# <<< scry managed git hosts <<<";
const kdfIterations = 250000;
const kdfDigest = "sha256";
const keyLengthBytes = 32;
const saltLengthBytes = 16;
const ivLengthBytes = 12;
const authTagLengthBytes = 16;
const encryptedFormatMagic = Buffer.from("SCRYSSH2", "ascii");
const legacyOpenSslMagic = Buffer.from("Salted__", "ascii");

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function ensurePrereqs(): void {
  logStep("Checking SSH restore prerequisites");
  const requiredTools = ["tar"];
  for (const tool of requiredTools) {
    if (!commandExists(tool)) {
      throw new Error(`Missing required tool: ${tool}`);
    }
    console.log(`ok: ${tool}`);
  }

  if (!existsSync(encryptedBackupFile)) {
    throw new Error(`Encrypted backup not found: ${encryptedBackupFile}`);
  }

  if (passphrase.length < 16) {
    throw new Error(
      "Set SCRY_SSH_BACKUP_PASSPHRASE with at least 16 characters before restoring backups.",
    );
  }

  if (isLegacyOpenSslArchive(encryptedBackupFile) && !commandExists("openssl")) {
    throw new Error(
      `Legacy backup detected at ${encryptedBackupFile}, but openssl is not installed. Install openssl or re-create backup with the current setup:ssh:backup command.`,
    );
  }
}

function deriveKey(salt: Buffer): Buffer {
  return pbkdf2Sync(passphrase, salt, kdfIterations, keyLengthBytes, kdfDigest);
}

function isLegacyOpenSslArchive(path: string): boolean {
  const payload = readFileSync(path);
  if (payload.length < legacyOpenSslMagic.length) {
    return false;
  }
  return payload.subarray(0, legacyOpenSslMagic.length).equals(legacyOpenSslMagic);
}

function decryptArchiveToTar(encryptedPath: string, tarPath: string): void {
  const payload = readFileSync(encryptedPath);
  if (payload.length >= legacyOpenSslMagic.length) {
    const magic = payload.subarray(0, legacyOpenSslMagic.length);
    if (magic.equals(legacyOpenSslMagic)) {
      runOrThrow([
        "openssl",
        "enc",
        "-d",
        "-aes-256-cbc",
        "-pbkdf2",
        "-iter",
        `${kdfIterations}`,
        "-in",
        encryptedPath,
        "-out",
        tarPath,
        "-pass",
        "env:SCRY_SSH_BACKUP_PASSPHRASE",
      ]);
      return;
    }
  }

  const minimumLength =
    encryptedFormatMagic.length + saltLengthBytes + ivLengthBytes + authTagLengthBytes + 1;

  if (payload.length < minimumLength) {
    throw new Error("Encrypted SSH backup is malformed or truncated.");
  }

  const magic = payload.subarray(0, encryptedFormatMagic.length);
  if (!magic.equals(encryptedFormatMagic)) {
    throw new Error("Encrypted SSH backup format is unsupported.");
  }

  let offset = encryptedFormatMagic.length;
  const salt = payload.subarray(offset, offset + saltLengthBytes);
  offset += saltLengthBytes;
  const iv = payload.subarray(offset, offset + ivLengthBytes);
  offset += ivLengthBytes;
  const authTag = payload.subarray(offset, offset + authTagLengthBytes);
  offset += authTagLengthBytes;
  const ciphertext = payload.subarray(offset);

  const key = deriveKey(salt);

  try {
    const decipher = createDecipheriv("aes-256-gcm", key, iv) as DecipherGCM;
    decipher.setAuthTag(authTag);
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    writeFileSync(tarPath, plaintext);
  } catch {
    throw new Error(
      "Failed to decrypt and authenticate SSH backup. Check SCRY_SSH_BACKUP_PASSPHRASE and backup integrity.",
    );
  }
}

function decryptAndExtract(tempDir: string): void {
  const tempTarFile = resolve(tempDir, "ssh-keys.tar");
  const extractRoot = resolve(tempDir, "extract-root");

  logStep("Decrypting and authenticating SSH archive");
  decryptArchiveToTar(encryptedBackupFile, tempTarFile);

  logStep("Restoring ~/.ssh from decrypted archive");
  mkdirSync(home, { recursive: true });
  mkdirSync(extractRoot, { recursive: true });
  runOrThrow(["tar", "-C", extractRoot, "-xf", tempTarFile]);

  const extractedSshDir = resolve(extractRoot, ".ssh");
  if (!existsSync(extractedSshDir)) {
    throw new Error("Decrypted archive does not contain a .ssh directory.");
  }

  rmSync(sshDir, { recursive: true, force: true });
  cpSync(extractedSshDir, sshDir, { recursive: true, force: true });
}

function setPermissionsRecursive(path: string): void {
  const stats = lstatSync(path);

  if (stats.isSymbolicLink()) {
    return;
  }

  if (stats.isDirectory()) {
    chmodSync(path, 0o700);
    const entries = readdirSync(path);
    for (const entry of entries) {
      setPermissionsRecursive(resolve(path, entry));
    }
    return;
  }

  if (!stats.isFile()) {
    return;
  }

  const mode = path.endsWith(".pub") || path.includes("known_hosts") ? 0o644 : 0o600;
  chmodSync(path, mode);
}

function buildManagedHostBlock(host: string, identityFile: string): string {
  return [
    `Host ${host}`,
    `  HostName ${host}`,
    "  User git",
    `  IdentityFile ${identityFile}`,
    "  IdentitiesOnly yes",
  ].join("\n");
}

function ensureManagedHostConfig(): void {
  const managedBlock = [
    managedBlockStart,
    buildManagedHostBlock("github.com", githubIdentity),
    "",
    buildManagedHostBlock("codeberg.org", codebergIdentity),
    managedBlockEnd,
    "",
  ].join("\n");

  const existingRaw = existsSync(sshConfigPath) ? readFileSync(sshConfigPath, "utf8") : "";
  const existing = existingRaw.replace(/\r\n/g, "\n");
  const managedPattern = new RegExp(
    `${escapeRegExp(managedBlockStart)}[\\s\\S]*?${escapeRegExp(managedBlockEnd)}\\n?`,
    "g",
  );
  const withoutManagedBlock = existing.replace(managedPattern, "").trim();

  const nextConfig =
    withoutManagedBlock.length > 0
      ? `${managedBlock}\n${withoutManagedBlock}${withoutManagedBlock.endsWith("\n") ? "" : "\n"}`
      : managedBlock;

  if (existing === nextConfig) {
    return;
  }

  writeFileSync(sshConfigPath, nextConfig);
}

function normalizePermissionsAndConfig(): void {
  logStep("Normalizing ~/.ssh permissions");
  if (!existsSync(sshDir)) {
    throw new Error(`Restore completed but SSH directory is missing: ${sshDir}`);
  }
  setPermissionsRecursive(sshDir);

  logStep("Ensuring managed Git host entries in ~/.ssh/config");
  ensureManagedHostConfig();
  chmodSync(sshConfigPath, 0o600);
}

function cleanup(tempDir: string): void {
  rmSync(tempDir, { recursive: true, force: true });
}

function main(): void {
  ensurePrereqs();
  const tempDir = mkdtempSync(resolve(tmpdir(), "scry-ssh-restore-"));
  try {
    decryptAndExtract(tempDir);
    normalizePermissionsAndConfig();
  } finally {
    cleanup(tempDir);
  }

  logStep("SSH restore complete");
  console.log(`restored: ${sshDir}`);
  console.log("next: ssh -T git@github.com");
  console.log("next: ssh -T git@codeberg.org");
}

main();
