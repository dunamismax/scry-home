import { type CipherGCM, createCipheriv, createHash, pbkdf2Sync, randomBytes } from "node:crypto";
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { hostname, tmpdir } from "node:os";
import { dirname, relative, resolve } from "node:path";
import { commandExists, ensureDir, logStep, runOrThrow } from "./lib";

const passphrase = process.env.SCRY_SSH_BACKUP_PASSPHRASE ?? "";
const home = process.env.HOME ?? "/home/sawyer";
const sshDir = resolve(home, ".ssh");
const repoRoot = resolve(import.meta.dir, "..");
const vaultDir = resolve(repoRoot, "vault/ssh");
const encryptedBackupFile = process.env.SCRY_SSH_BACKUP_FILE
  ? resolve(process.env.SCRY_SSH_BACKUP_FILE)
  : resolve(vaultDir, "ssh-keys.tar.enc");
const metadataFile = process.env.SCRY_SSH_METADATA_FILE
  ? resolve(process.env.SCRY_SSH_METADATA_FILE)
  : resolve(vaultDir, "ssh-keys.meta.json");
const kdfIterations = 250000;
const kdfDigest = "sha256";
const keyLengthBytes = 32;
const saltLengthBytes = 16;
const ivLengthBytes = 12;
const authTagLengthBytes = 16;
const encryptedFormatMagic = Buffer.from("SCRYSSH2", "ascii");

type SourceSnapshot = {
  fingerprint: string;
  fileCount: number;
  totalBytes: number;
};

type BackupMetadata = {
  createdAt: string;
  host: string;
  sourceDir: string;
  encryptedBackupFile: string;
  cipher: "aes-256-gcm";
  kdf: "pbkdf2";
  kdfDigest: "sha256";
  kdfIterations: number;
  sourceFingerprint: string;
  sourceFileCount: number;
  sourceTotalBytes: number;
  encryptedBackupSha256: string;
};

function ensurePrereqs(): void {
  logStep("Checking SSH backup prerequisites");
  const requiredTools = ["tar"];
  for (const tool of requiredTools) {
    if (!commandExists(tool)) {
      throw new Error(`Missing required tool: ${tool}`);
    }
    console.log(`ok: ${tool}`);
  }

  if (!existsSync(sshDir)) {
    throw new Error(`SSH directory not found: ${sshDir}`);
  }

  if (passphrase.length < 16) {
    throw new Error(
      "Set SCRY_SSH_BACKUP_PASSPHRASE with at least 16 characters before creating backups.",
    );
  }
}

function computeSha256(path: string): string {
  const hash = createHash("sha256");
  hash.update(readFileSync(path));
  return hash.digest("hex");
}

function computeSourceSnapshot(path: string): SourceSnapshot {
  const entries: string[] = [];
  let fileCount = 0;
  let totalBytes = 0;

  const visit = (currentPath: string): void => {
    const names = readdirSync(currentPath).sort((a, b) => a.localeCompare(b));

    for (const name of names) {
      const entryPath = resolve(currentPath, name);
      const stats = lstatSync(entryPath);
      const rel = relative(path, entryPath).split("\\").join("/");
      const mode = (stats.mode & 0o777).toString(8).padStart(3, "0");

      if (stats.isSymbolicLink()) {
        fileCount += 1;
        entries.push(`symlink ${rel} mode=${mode} -> ${readlinkSync(entryPath)}`);
        continue;
      }

      if (stats.isDirectory()) {
        entries.push(`dir ${rel} mode=${mode}`);
        visit(entryPath);
        continue;
      }

      if (stats.isFile()) {
        fileCount += 1;
        totalBytes += stats.size;
        const fileHash = computeSha256(entryPath);
        entries.push(`file ${rel} mode=${mode} size=${stats.size} sha256=${fileHash}`);
        continue;
      }

      entries.push(`other ${rel} mode=${mode}`);
    }
  };

  visit(path);

  const fingerprint = createHash("sha256").update(entries.join("\n")).digest("hex");
  return { fingerprint, fileCount, totalBytes };
}

function readMetadata(): BackupMetadata | null {
  if (!existsSync(metadataFile)) {
    return null;
  }

  try {
    return JSON.parse(readFileSync(metadataFile, "utf8")) as BackupMetadata;
  } catch {
    return null;
  }
}

function backupIsCurrent(sourceSnapshot: SourceSnapshot): boolean {
  if (!existsSync(encryptedBackupFile)) {
    return false;
  }

  const metadata = readMetadata();
  if (!metadata) {
    return false;
  }

  return metadata.sourceFingerprint === sourceSnapshot.fingerprint;
}

function deriveKey(salt: Buffer): Buffer {
  return pbkdf2Sync(passphrase, salt, kdfIterations, keyLengthBytes, kdfDigest);
}

function encryptArchive(plainTarPath: string, encryptedPath: string): void {
  const plaintext = readFileSync(plainTarPath);
  const salt = randomBytes(saltLengthBytes);
  const iv = randomBytes(ivLengthBytes);
  const key = deriveKey(salt);

  const cipher = createCipheriv("aes-256-gcm", key, iv) as CipherGCM;
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const payload = Buffer.concat([encryptedFormatMagic, salt, iv, authTag, ciphertext]);
  writeFileSync(encryptedPath, payload);
}

function createEncryptedArchive(tempDir: string): void {
  logStep("Creating encrypted SSH archive");
  ensureDir(vaultDir);
  ensureDir(dirname(encryptedBackupFile));
  const tempTarFile = resolve(tempDir, "ssh-keys.tar");
  const tempEncryptedFile = resolve(tempDir, "ssh-keys.tar.enc");

  runOrThrow(["tar", "-C", home, "-cf", tempTarFile, ".ssh"]);
  encryptArchive(tempTarFile, tempEncryptedFile);

  chmodSync(tempEncryptedFile, 0o600);
  renameSync(tempEncryptedFile, encryptedBackupFile);
}

function writeMetadata(sourceSnapshot: SourceSnapshot): void {
  logStep("Writing backup metadata");
  const metadata = {
    createdAt: new Date().toISOString(),
    host: hostname(),
    sourceDir: sshDir,
    encryptedBackupFile,
    cipher: "aes-256-gcm",
    kdf: "pbkdf2",
    kdfDigest,
    kdfIterations,
    sourceFingerprint: sourceSnapshot.fingerprint,
    sourceFileCount: sourceSnapshot.fileCount,
    sourceTotalBytes: sourceSnapshot.totalBytes,
    encryptedBackupSha256: computeSha256(encryptedBackupFile),
  } satisfies BackupMetadata;

  ensureDir(dirname(metadataFile));
  writeFileSync(metadataFile, `${JSON.stringify(metadata, null, 2)}\n`);
  chmodSync(metadataFile, 0o600);
}

function cleanup(tempDir: string): void {
  rmSync(tempDir, { recursive: true, force: true });
}

function main(): void {
  ensurePrereqs();
  const sourceSnapshot = computeSourceSnapshot(sshDir);
  if (backupIsCurrent(sourceSnapshot)) {
    logStep("SSH backup unchanged");
    console.log(`source fingerprint: ${sourceSnapshot.fingerprint}`);
    console.log("backup is already current; no files changed");
    return;
  }

  const tempDir = mkdtempSync(resolve(tmpdir(), "scry-ssh-backup-"));
  try {
    createEncryptedArchive(tempDir);
    writeMetadata(sourceSnapshot);
  } finally {
    cleanup(tempDir);
  }

  logStep("SSH backup complete");
  console.log(`created: ${encryptedBackupFile}`);
  console.log(`created: ${metadataFile}`);
}

main();
