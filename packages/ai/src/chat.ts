import { chat, type ModelMessage, type StreamChunk, toServerSentEventsResponse } from '@tanstack/ai'
import { openaiText } from '@tanstack/ai-openai'

const defaultModel = 'gpt-4.1-mini'

const fallbackText = `Scry Home AI is wired for TanStack AI and ready for a real provider. Set OPENAI_API_KEY to enable live responses. Until then, use the control plane to inspect projects, backups, CAB packets, and sync health.`

const buildFallbackStream = async function* (): AsyncIterable<StreamChunk> {
  const timestamp = Date.now()
  const runId = `fallback-run-${timestamp}`
  const messageId = `fallback-message-${timestamp}`

  yield {
    runId,
    timestamp,
    type: 'RUN_STARTED',
  }

  yield {
    messageId,
    model: 'fallback',
    role: 'assistant',
    timestamp: timestamp + 1,
    type: 'TEXT_MESSAGE_START',
  }

  for (const chunk of fallbackText.split(' ')) {
    yield {
      delta: `${chunk} `,
      messageId,
      model: 'fallback',
      timestamp: Date.now(),
      type: 'TEXT_MESSAGE_CONTENT',
    }
  }

  yield {
    messageId,
    model: 'fallback',
    timestamp: Date.now(),
    type: 'TEXT_MESSAGE_END',
  }

  yield {
    finishReason: 'stop',
    model: 'fallback',
    runId,
    timestamp: Date.now(),
    type: 'RUN_FINISHED',
  }
}

export type ChatPromptMessage = ModelMessage<string>

export const createChatResponse = async (messages: ReadonlyArray<ChatPromptMessage>) => {
  if (!process.env.OPENAI_API_KEY) {
    return toServerSentEventsResponse(buildFallbackStream())
  }

  const stream = chat({
    adapter: openaiText(defaultModel),
    messages: [...messages],
  })

  return toServerSentEventsResponse(stream)
}
