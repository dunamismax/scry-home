const errorMessage = (fallback: string, message?: string) => message?.trim() || fallback

export class CommandFailure extends Error {
  readonly command: readonly string[]
  readonly exitCode: number
  readonly stderr: string
  readonly stdout: string

  constructor(options: {
    readonly command: readonly string[]
    readonly exitCode: number
    readonly stderr: string
    readonly stdout: string
  }) {
    super(
      errorMessage(
        `Command failed (${options.exitCode}): ${options.command.join(' ')}`,
        options.stderr || options.stdout,
      ),
    )
    this.name = 'CommandFailure'
    this.command = options.command
    this.exitCode = options.exitCode
    this.stderr = options.stderr
    this.stdout = options.stdout
  }
}

export class InvalidEncryptedPayload extends Error {
  constructor(readonly options: { readonly message: string }) {
    super(options.message)
    this.name = 'InvalidEncryptedPayload'
  }
}
