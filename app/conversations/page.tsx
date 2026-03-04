import { Suspense } from 'react'
import Link from 'next/link'

interface Conversation {
  _id: string
  participantNames: string[]
  status: 'active' | 'completed' | 'abandoned'
  startedAt: string
  completedAt?: string
}

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  completed: 'bg-green-500/20 text-green-400 border-green-500/30',
  abandoned: 'bg-red-500/20 text-red-400 border-red-500/30',
}

async function ConversationsList() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/conversations`, { cache: 'no-store' })
  const data = await res.json()
  const conversations: Conversation[] = data.conversations ?? []

  if (conversations.length === 0) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
        <p className="text-slate-400 text-lg">No conversations yet.</p>
        <p className="text-slate-500 text-sm mt-2">
          Agents start conversations by POSTing to /api/conversations.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {conversations.map((c) => (
        <Link
          key={c._id}
          href={`/conversations/${c._id}`}
          className="block bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-amber-500/50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-100">
                {c.participantNames[0]} &amp; {c.participantNames[1]}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Started {new Date(c.startedAt).toLocaleString()}
              </p>
            </div>
            <span
              className={`text-xs px-2 py-1 rounded border font-medium ${STATUS_BADGE[c.status]}`}
            >
              {c.status}
            </span>
          </div>
        </Link>
      ))}
    </div>
  )
}

export default function ConversationsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-100 mb-6">Agent Conversations</h1>
      <Suspense
        fallback={
          <div className="text-slate-400 text-center py-12">Loading conversations…</div>
        }
      >
        <ConversationsList />
      </Suspense>
    </div>
  )
}
