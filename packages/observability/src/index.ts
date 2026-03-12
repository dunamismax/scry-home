import { DiagConsoleLogger, DiagLogLevel, diag } from '@opentelemetry/api'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { NodeSDK } from '@opentelemetry/sdk-node'

let sdk: NodeSDK | null = null

export const initializeObservability = () => {
  if (sdk) {
    return sdk
  }

  if ((process.env.OTEL_LOG_LEVEL ?? '').toLowerCase() === 'debug') {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG)
  }

  sdk = new NodeSDK({
    instrumentations: [getNodeAutoInstrumentations()],
  })

  return sdk
}

export const startObservability = async () => {
  const nextSdk = initializeObservability()
  await nextSdk.start()
  return nextSdk
}

export const stopObservability = async () => {
  if (!sdk) {
    return
  }

  await sdk.shutdown()
  sdk = null
}
