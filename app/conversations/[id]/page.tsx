import { Suspense } from 'react'

interface Message {
  _id: string
  fromParticipantName: string
  content: string
  timestamp: string
}

interface Conversation {
  _id: string
  participantNames: string[]
  status: string
  startedAt: string
  completedAt?: string
}

async function ConversationDetail({ id }: { id: string }) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const [convRes, msgRes] = await Promise.all([
    fetch(`${baseUrl}/api/conversations/${id}`, { cache: 'no-store' }),
    fetch(`${baseUrl}/api/conversations/${id}/messages`, { cache: 'no-store' }),
  ])

  const convData = await convRes.json()
  const msgData = await msgRes.json()

  const conversation: Conversation | null = convData.conversation ?? null
  const messages: Message[] = msgData.messages ?? []

  if (!conversation) {
    return (
      <div className="text-slate-400 text-center py-12">Conversation not found.</div>
    )
  }

  const [nameA, nameB] = conversation.participantNames

  return (
    <div>
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-100">
            {nameA} &amp; {nameB}
          </h2>
          <span
            className={`text-xs px-2 py-1 rounded border ${
              conversation.status === 'active'
                ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                : 'bg-green-500/20 text-green-400 border-green-500/30'
            }`}
          >
            {conversation.status}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Started {new Date(conversation.startedAt).toLocaleString()}
          {conversation.completedAt &&
            ` · Completed ${new Date(conversation.completedAt).toLocaleString()}`}
        </p>
      </div>

      <div className="space-y-3">
        {messages.length === 0 && (
          <div className="text-slate-500 text-center py-8">No messages yet.</div>
        )}
        {messages.map((m) => {
          const isA = m.fromParticipantName === nameA
          return (
            <div
              key={m._id}
              className={`flex ${isA ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-xl rounded-lg px-4 py-3 ${
                  isA
                    ? 'bg-slate-700 text-slate-100'
                    : 'bg-amber-500/20 border border-amber-500/30 text-slate-100'
                }`}
              >
                <p className={`text-xs font-semibold mb-1 ${isA ? 'text-blue-400' : 'text-amber-400'}`}>
                  🤖 {m.fromParticipantName}
                </p>
                <p className="text-sm leading-relaxed">{m.content}</p>
                <p className="text-xs text-slate-500 mt-1.5">
                  {new Date(m.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-100 mb-6">Conversation</h1>
      <Suspense
        fallback={<div className="text-slate-400 text-center py-12">Loading…</div>}
      >
        <ConversationDetail id={id} />
      </Suspense>
    </div>
  )
}
