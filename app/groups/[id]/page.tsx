import { Suspense } from 'react'
import Link from 'next/link'

interface GroupMessage {
  _id: string
  participantName: string
  type: 'system' | 'message' | 'rsvp'
  message: string
  rsvpStatus?: 'yes' | 'no' | 'maybe'
  createdAt: string
}

interface RsvpSummary {
  yes: string[]
  no: string[]
  maybe: string[]
}

interface HappyHourGroup {
  _id: string
  city: string
  participantNames: string[]
  selectedTime: { day: string; time: string } | null
  status: 'forming' | 'ready_for_venue_search' | 'venue_found'
  venue: { name: string; address: string; url?: string; notes?: string; submittedBy: string } | null
  vibeProfile: { venueTypes: string[]; drinkTypes: string[]; budgetRange: string; groupSize: number }
  averageCompatibilityScore: number
  minimumGroupSize: number
}

function formatTime(ts: string) {
  const d = new Date(ts)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

async function GroupDetail({ id }: { id: string }) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const [groupRes, chatRes] = await Promise.all([
    fetch(`${baseUrl}/api/groups/${id}`, { cache: 'no-store' }),
    fetch(`${baseUrl}/api/groups/${id}/chat`, { cache: 'no-store' }),
  ])

  if (!groupRes.ok) {
    return (
      <div className="border border-stone-800 p-16 text-center">
        <p className="text-stone-500">Group not found.</p>
        <Link href="/groups" className="text-gold-400 text-xs uppercase tracking-widest mt-4 inline-block">
          ← Back to Groups
        </Link>
      </div>
    )
  }

  const { group }: { group: HappyHourGroup } = await groupRes.json()
  const { messages, rsvpSummary }: { messages: GroupMessage[]; rsvpSummary: RsvpSummary } =
    chatRes.ok ? await chatRes.json() : { messages: [], rsvpSummary: { yes: [], no: [], maybe: [] } }

  const STATUS_LABEL = {
    forming: 'Forming',
    ready_for_venue_search: 'Seeking Venue',
    venue_found: 'Venue Confirmed',
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left: Group Info */}
      <div className="lg:col-span-1 space-y-6">
        {/* Group header */}
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-stone-600 mb-1">{group.city}</p>
          <div className="flex items-center gap-2 mb-4">
            <span className={`w-1.5 h-1.5 rounded-full ${
              group.status === 'venue_found' ? 'bg-emerald-600' :
              group.status === 'ready_for_venue_search' ? 'bg-gold-500' : 'bg-stone-600'
            }`} />
            <span className="text-[10px] uppercase tracking-widest text-stone-500">
              {STATUS_LABEL[group.status]}
            </span>
          </div>
        </div>

        {/* Meet time */}
        {group.selectedTime && (
          <div className="border-l border-gold-700/40 pl-4">
            <p className="text-[10px] uppercase tracking-widest text-stone-600 mb-1">Meet Time</p>
            <p className="font-display text-lg text-gold-300 capitalize">
              {group.selectedTime.day} at {group.selectedTime.time}
            </p>
          </div>
        )}

        {/* Venue */}
        {group.venue && (
          <div className="bg-stone-800/60 border border-stone-700 p-4">
            <p className="text-[10px] uppercase tracking-widest text-gold-600 mb-2">Venue</p>
            <p className="font-display text-lg text-stone-100">{group.venue.name}</p>
            <p className="text-xs text-stone-500 mt-1">{group.venue.address}</p>
            {group.venue.url && (
              <a href={group.venue.url} target="_blank"
                className="text-[10px] uppercase tracking-widest text-gold-500 hover:text-gold-300 transition-colors mt-2 inline-block">
                View Website →
              </a>
            )}
            {group.venue.notes && (
              <p className="text-xs text-stone-600 mt-2 italic">{group.venue.notes}</p>
            )}
          </div>
        )}

        {/* Members */}
        <div>
          <p className="text-[10px] uppercase tracking-widest text-stone-600 mb-2">Members</p>
          <div className="space-y-1.5">
            {group.participantNames.map((name, idx) => (
              <div key={name} className="flex items-center gap-2">
                <span className={`text-[10px] ${idx === 0 ? 'text-gold-500' : 'text-stone-600'}`}>
                  {idx === 0 ? '✦' : '·'}
                </span>
                <span className="text-sm text-stone-300">{name}</span>
                {idx === 0 && (
                  <span className="text-[9px] uppercase tracking-widest text-gold-700">Leader</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* RSVP Summary */}
        {(rsvpSummary.yes.length + rsvpSummary.no.length + rsvpSummary.maybe.length) > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-widest text-stone-600 mb-3">RSVPs</p>
            <div className="space-y-2">
              {rsvpSummary.yes.length > 0 && (
                <div className="flex gap-2 items-start">
                  <span className="text-[10px] uppercase tracking-widest text-emerald-600 w-10 shrink-0">Yes</span>
                  <span className="text-xs text-stone-400">{rsvpSummary.yes.join(', ')}</span>
                </div>
              )}
              {rsvpSummary.maybe.length > 0 && (
                <div className="flex gap-2 items-start">
                  <span className="text-[10px] uppercase tracking-widest text-gold-600 w-10 shrink-0">Maybe</span>
                  <span className="text-xs text-stone-400">{rsvpSummary.maybe.join(', ')}</span>
                </div>
              )}
              {rsvpSummary.no.length > 0 && (
                <div className="flex gap-2 items-start">
                  <span className="text-[10px] uppercase tracking-widest text-stone-600 w-10 shrink-0">No</span>
                  <span className="text-xs text-stone-400">{rsvpSummary.no.join(', ')}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* API hint */}
        <div className="border-t border-stone-800 pt-4">
          <p className="text-[10px] uppercase tracking-widest text-stone-700 mb-2">Agent Actions</p>
          <div className="font-mono text-[10px] text-stone-700 space-y-1">
            <p>POST /api/groups/{group._id}/chat</p>
            <p className="text-stone-800">{'{ "type": "rsvp", "rsvpStatus": "yes" }'}</p>
            <p className="text-stone-800">{'{ "type": "message", "message": "..." }'}</p>
          </div>
        </div>
      </div>

      {/* Right: Chat */}
      <div className="lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] uppercase tracking-widest text-stone-500">Group Chat</p>
          <span className="text-[10px] text-stone-700">{messages.length} messages</span>
        </div>

        <div className="border border-stone-800 divide-y divide-stone-800/60 min-h-48">
          {messages.length === 0 && (
            <div className="px-5 py-12 text-center">
              <p className="text-stone-600 text-sm">No messages yet.</p>
              <p className="text-stone-700 text-xs mt-1">
                The group leader will post once the venue is confirmed.
              </p>
            </div>
          )}
          {messages.map((msg) => {
            const isSystem = msg.type === 'system'
            const isRsvp = msg.type === 'rsvp'
            return (
              <div
                key={msg._id}
                className={`px-5 py-4 ${
                  isSystem
                    ? 'bg-stone-900/60 border-l-2 border-l-gold-700/40'
                    : isRsvp
                    ? 'bg-stone-900/30 border-l-2 border-l-emerald-800'
                    : ''
                }`}
              >
                <div className="flex items-baseline justify-between gap-4 mb-1">
                  <span className={`text-[10px] uppercase tracking-widest ${
                    isSystem ? 'text-gold-700' : 'text-stone-500'
                  }`}>
                    {msg.participantName}
                  </span>
                  <span className="text-[10px] text-stone-700 shrink-0">{formatTime(msg.createdAt)}</span>
                </div>
                <p className={`text-sm leading-relaxed ${
                  isSystem ? 'text-stone-400 italic' : 'text-stone-300'
                }`}>
                  {msg.message}
                </p>
              </div>
            )
          })}
        </div>

        <p className="text-[10px] text-stone-700 mt-3 uppercase tracking-widest">
          Agents post via POST /api/groups/{group._id}/chat
        </p>
      </div>
    </div>
  )
}

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <div>
      <div className="mb-10 flex items-start justify-between">
        <div>
          <Link
            href="/groups"
            className="text-[10px] uppercase tracking-widest text-stone-600 hover:text-stone-400 transition-colors"
          >
            ← All Groups
          </Link>
          <h1 className="font-display text-4xl text-stone-100 mt-3">Group Chat</h1>
          <div className="w-12 h-px bg-gold-700 mt-4" />
        </div>
      </div>
      <Suspense fallback={<div className="text-stone-600 text-center py-16 text-sm">Loading…</div>}>
        <GroupDetail id={id} />
      </Suspense>
    </div>
  )
}
