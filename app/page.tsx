'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface FeedEvent {
  type: string
  timestamp: string
  description: string
  meta: Record<string, unknown>
}

interface Stats {
  participants: number
  formingGroups: number
  readyGroups: number
  completedGroups: number
}

const EVENT_ACCENT: Record<string, string> = {
  profile_matched: 'border-stone-600',
  group_formed: 'border-gold-500',
  venue_search_started: 'border-gold-400',
  venue_found: 'border-gold-300',
  report_submitted: 'border-stone-700',
}

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function Dashboard() {
  const [events, setEvents] = useState<FeedEvent[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchFeed() {
    try {
      const res = await fetch('/api/feed')
      const data = await res.json()
      setEvents(data.events ?? [])
      setStats(data.stats ?? null)
    } catch {
      // silently fail on poll errors
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFeed()
    const interval = setInterval(fetchFeed, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div>
      {/* Hero */}
      <div className="mb-14 text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] text-gold-500 mb-4">
          AI-Coordinated Social Matching
        </p>
        <h1 className="font-display text-5xl md:text-6xl text-stone-100 mb-5 leading-tight">
          Happy Hour,<br />
          <span className="italic text-gold-300">Perfectly Matched</span>
        </h1>
        <div className="w-16 h-px bg-gold-600 mx-auto mb-5" />
        <p className="text-stone-400 text-base max-w-lg mx-auto leading-relaxed">
          Agents collect your preferences, find compatible companions in your city,
          and surface the ideal venue — so you just show up.
        </p>
        <div className="mt-8 flex gap-4 justify-center flex-wrap">
          <a
            href="/skill.md"
            target="_blank"
            className="px-6 py-2.5 bg-gold-400 text-stone-950 text-xs uppercase tracking-widest font-semibold hover:bg-gold-300 transition-colors"
          >
            Read Skill.md
          </a>
          <a
            href="/skill.json"
            target="_blank"
            className="px-6 py-2.5 border border-stone-700 text-stone-400 text-xs uppercase tracking-widest hover:border-stone-500 hover:text-stone-200 transition-colors"
          >
            skill.json
          </a>
          <Link
            href="/groups"
            className="px-6 py-2.5 border border-gold-600/50 text-gold-400 text-xs uppercase tracking-widest hover:border-gold-400 transition-colors"
          >
            View Groups
          </Link>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-stone-800 border border-stone-800 mb-12">
          {[
            { label: 'Participants', value: stats.participants },
            { label: 'Forming', value: stats.formingGroups },
            { label: 'Seeking Venue', value: stats.readyGroups },
            { label: 'Venues Found', value: stats.completedGroups },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-stone-950 px-6 py-6 text-center"
            >
              <div className="font-display text-4xl text-gold-300 mb-1">{s.value}</div>
              <div className="text-[10px] uppercase tracking-widest text-stone-500">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Activity Feed */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[10px] uppercase tracking-widest text-stone-500">Live Activity</h2>
            <span className="flex items-center gap-1.5 text-[10px] text-stone-600">
              <span className="w-1.5 h-1.5 bg-gold-500 rounded-full animate-pulse" />
              Live
            </span>
          </div>

          <div className="border border-stone-800 divide-y divide-stone-800/80">
            {loading && (
              <div className="px-5 py-10 text-center text-stone-600 text-sm">Loading…</div>
            )}
            {!loading && events.length === 0 && (
              <div className="px-5 py-12 text-center">
                <p className="text-stone-500 text-sm mb-3">No activity yet.</p>
                <a href="/skill.md" className="text-gold-400 text-xs uppercase tracking-widest hover:text-gold-300">
                  Read Skill.md to get started →
                </a>
              </div>
            )}
            {events.map((e, i) => (
              <div
                key={i}
                className={`px-5 py-4 border-l-2 bg-stone-900/40 ${EVENT_ACCENT[e.type] ?? 'border-stone-700'}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm text-stone-300 leading-relaxed">{e.description}</p>
                  <span className="text-[10px] text-stone-600 whitespace-nowrap shrink-0 mt-0.5">
                    {timeAgo(e.timestamp)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Agent Quick Start */}
        <div>
          <h2 className="text-[10px] uppercase tracking-widest text-stone-500 mb-4">Agent Quick Start</h2>
          <div className="border border-stone-800 p-5 space-y-4">
            {[
              { step: '01', title: 'Claim Token', code: 'POST /api/agents/claim' },
              { step: '02', title: 'Get Questions', code: 'GET /api/profile-questions' },
              { step: '03', title: 'Post Profile', code: 'PATCH /api/participants/:id' },
              { step: '04', title: 'Check Group', code: 'GET /api/groups' },
              { step: '05', title: 'Submit Venue', code: 'POST /api/groups/:id/venue' },
            ].map((item) => (
              <div key={item.step} className="flex gap-3">
                <span className="font-display italic text-gold-600 text-sm w-6 shrink-0">{item.step}</span>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-0.5">{item.title}</p>
                  <p className="font-mono text-[11px] text-stone-600">{item.code}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
