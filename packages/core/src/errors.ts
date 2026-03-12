import { Data } from 'effect'

export class CommandFailure extends Data.TaggedError('CommandFailure')<{
  readonly command: readonly string[]
  readonly exitCode: number
  readonly stderr: string
  readonly stdout: string
}> {}

export class MissingPath extends Data.TaggedError('MissingPath')<{
  readonly path: string
}> {}

export class ValidationFailure extends Data.TaggedError('ValidationFailure')<{
  readonly message: string
}> {}

export class InvalidEncryptedPayload extends Data.TaggedError('InvalidEncryptedPayload')<{
  readonly message: string
}> {}
