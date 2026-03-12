import { Schema } from 'effect'

export const CommandOutputSchema = Schema.Struct({
  command: Schema.Array(Schema.String),
  exitCode: Schema.Number,
  stdout: Schema.String,
  stderr: Schema.String,
})

export const ManagedProjectSchema = Schema.Struct({
  name: Schema.String,
  path: Schema.String,
  installCommand: Schema.Array(Schema.String),
  verifyCommands: Schema.Array(Schema.Array(Schema.String)),
})

export const RemoteTargetSchema = Schema.Struct({
  fetchUrl: Schema.String,
  pushUrls: Schema.Array(Schema.String),
})

export const RepoRemotePolicySchema = Schema.Struct({
  cloneUrl: Schema.String,
  origin: RemoteTargetSchema,
  extraRemotes: Schema.Record({
    key: Schema.String,
    value: RemoteTargetSchema,
  }),
  pushDefault: Schema.NullOr(Schema.String),
})

export const SnapshotSchema = Schema.Struct({
  fingerprint: Schema.String,
  fileCount: Schema.Number,
  totalBytes: Schema.Number,
})

export const ConfigBackupMetadataSchema = Schema.Struct({
  includedPaths: Schema.Array(Schema.String),
  encryptedBackupSha256: Schema.optional(Schema.String),
  sourceFingerprint: Schema.optional(Schema.String),
  createdAt: Schema.optional(Schema.String),
})

export const CabRequestSchema = Schema.Struct({
  projectName: Schema.String,
  packetName: Schema.String,
  outputRoot: Schema.String,
  dryRun: Schema.Boolean,
})

export type ManagedProject = Schema.Schema.Type<typeof ManagedProjectSchema>
export type RepoRemotePolicy = Schema.Schema.Type<typeof RepoRemotePolicySchema>
export type Snapshot = Schema.Schema.Type<typeof SnapshotSchema>
export type ConfigBackupMetadata = Schema.Schema.Type<typeof ConfigBackupMetadataSchema>
export type CabRequest = Schema.Schema.Type<typeof CabRequestSchema>
