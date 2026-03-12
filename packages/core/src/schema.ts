import { z } from 'zod'

const commandSchema = z.array(z.string().min(1)).min(1)

export const ManagedProjectSchema = z.object({
  name: z.string().min(1),
  path: z.string().min(1),
  installCommand: commandSchema,
  verifyCommands: z.array(commandSchema),
})

export const ManagedProjectListSchema = z.array(ManagedProjectSchema)

export const RemoteTargetSchema = z.object({
  fetchUrl: z.string().min(1),
  pushUrls: z.array(z.string().min(1)),
})

export const RepoRemotePolicySchema = z.object({
  cloneUrl: z.string().min(1),
  origin: RemoteTargetSchema,
  extraRemotes: z.record(z.string(), RemoteTargetSchema),
  pushDefault: z.string().min(1).nullable(),
})

export const SnapshotSchema = z.object({
  fingerprint: z.string().min(1),
  fileCount: z.number().nonnegative(),
  totalBytes: z.number().nonnegative(),
})

export const ConfigBackupMetadataSchema = z.object({
  includedPaths: z.array(z.string().min(1)).min(1),
  encryptedBackupSha256: z.string().min(1).optional(),
  sourceFingerprint: z.string().min(1).optional(),
  createdAt: z.string().min(1).optional(),
})

export const SshBackupMetadataSchema = z.object({
  sourceFingerprint: z.string().min(1).optional(),
})

export const CabRequestSchema = z.object({
  projectName: z.string().min(1),
  packetName: z.string().min(1),
  outputRoot: z.string().min(1),
  dryRun: z.boolean(),
})

export const formatZodError = (error: z.ZodError) =>
  error.issues
    .map(
      (issue) => `${issue.path.length === 0 ? '(root)' : issue.path.join('.')}: ${issue.message}`,
    )
    .join('; ')

export type ManagedProject = z.infer<typeof ManagedProjectSchema>
export type RepoRemotePolicy = z.infer<typeof RepoRemotePolicySchema>
export type Snapshot = z.infer<typeof SnapshotSchema>
export type ConfigBackupMetadata = z.infer<typeof ConfigBackupMetadataSchema>
export type SshBackupMetadata = z.infer<typeof SshBackupMetadataSchema>
export type CabRequest = z.infer<typeof CabRequestSchema>
