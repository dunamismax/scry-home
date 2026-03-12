import { createChatResponse } from '@scry-home/ai/chat'
import type { ModelMessage, UIMessage } from '@tanstack/ai'
import { createFileRoute } from '@tanstack/react-router'

const toModelMessages = (messages: Array<UIMessage>): Array<ModelMessage<string>> =>
  messages
    .map((message) => {
      const content = message.parts
        .filter(
          (part): part is { content: string; type: 'text' } =>
            part.type === 'text' && typeof part.content === 'string',
        )
        .map((part) => part.content)
        .join('\n')
        .trim()
      const role: ModelMessage<string>['role'] = message.role === 'assistant' ? 'assistant' : 'user'

      return {
        content,
        role,
      }
    })
    .filter((message) => message.content.length > 0)

export const Route = createFileRoute('/api/ai/chat')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as { messages?: Array<UIMessage> }
        return createChatResponse(toModelMessages(body.messages ?? []))
      },
    },
  },
})
