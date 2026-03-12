import { orchestrationProfile } from '@scry-home/ai'
import type { MessagePart } from '@tanstack/ai'
import { fetchServerSentEvents } from '@tanstack/ai-client'
import { useChat } from '@tanstack/ai-react'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/assistant')({
  component: AssistantPage,
})

const messageText = (parts: ReadonlyArray<MessagePart>) =>
  parts
    .filter(
      (part): part is { content: string; type: 'text' } =>
        part.type === 'text' && typeof part.content === 'string',
    )
    .map((part) => part.content)
    .join(' ')

function AssistantPage() {
  const [draft, setDraft] = useState('')
  const chat = useChat({
    connection: fetchServerSentEvents('/api/ai/chat'),
  })

  return (
    <main className="page-wrap px-4 pb-12 pt-10">
      <section className="panel assistant-shell">
        <div className="section-head">
          <div>
            <p className="eyebrow">Operator Copilot</p>
            <h1>TanStack AI on the front end, Mastra-ready orchestration behind it.</h1>
          </div>
          <p className="lede">{orchestrationProfile.description}</p>
        </div>

        <div className="assistant-layout">
          <div className="assistant-transcript">
            {chat.messages.length === 0 ? (
              <div className="assistant-empty">
                Ask about project health, backup status, or next operational moves.
              </div>
            ) : (
              chat.messages.map((message) => (
                <article key={message.id} className={`bubble ${message.role}`}>
                  <span className="bubble-role">{message.role}</span>
                  <div className="bubble-content">{messageText(message.parts)}</div>
                </article>
              ))
            )}
          </div>

          <form
            className="assistant-form"
            onSubmit={async (event) => {
              event.preventDefault()
              if (!draft.trim()) {
                return
              }
              await chat.sendMessage(draft)
              setDraft('')
            }}
          >
            <textarea
              className="assistant-input"
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask the control plane what changed, what failed, or what to run next."
              rows={5}
              value={draft}
            />
            <div className="assistant-actions">
              <button className="ghost-button" onClick={() => chat.clear()} type="button">
                Clear
              </button>
              <button className="primary-button" disabled={chat.isLoading} type="submit">
                {chat.isLoading ? 'Thinking…' : 'Send'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  )
}
