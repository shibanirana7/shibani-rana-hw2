import { Suspense } from 'react'
import Link from 'next/link'

interface HappyHourGroup {
  _id: string
  city: string
  participantNames: string[]
  selectedTime: { day: string; time: string } | null
  status: 'forming' | 'ready_for_venue_search' | 'venue_found'
  venueSearchIndex: number
  venue: { name: string; address: string; url?: string; notes?: string; submittedBy: string } | null
  vibeProfile: {
    venueTypes: string[]
    drinkTypes: string[]
    budgetRange: string
    groupSize: number
  }
  averageCompatibilityScore: number
  minimumGroupSize: number
  createdAt: string
}

const VIBE_LABELS: Record<string, string> = {
  dive_bar: 'Dive Bar',
  rooftop: 'Rooftop',
  sports_bar: 'Sports Bar',
  wine_bar: 'Wine Bar',
  craft_beer: 'Craft Beer',
  cocktail_bar: 'Cocktail Bar',
  karaoke: 'Karaoke',
}

const DRINK_LABELS: Record<string, string> = {
  beer: 'Beer',
  cocktails: 'Cocktails',
  wine: 'Wine',
  spirits: 'Spirits',
  non_alcoholic: 'Non-Alcoholic',
}

const STATUS_CONFIG = {
  forming: { label: 'Forming', dot: 'bg-stone-600' },
  ready_for_venue_search: { label: 'Seeking Venue', dot: 'bg-gold-500' },
  venue_found: { label: 'Venue Confirmed', dot: 'bg-emerald-600' },
}

function ScoreBar({ score }: { score: number }) {
  const pct = (score / 10) * 100
  const color = score >= 8 ? 'bg-emerald-700' : score >= 6 ? 'bg-gold-500' : 'bg-stone-600'
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 bg-stone-800 h-px relative">
        <div className={`${color} h-px absolute left-0 top-0`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-gold-500 font-mono w-8 text-right">{score}/10</span>
    </div>
  )
}

async function GroupsList() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/groups`, { cache: 'no-store' })
  const data = await res.json()
  const groups: HappyHourGroup[] = data.groups ?? []

  if (groups.length === 0) {
    return (
      <div className="border border-stone-800 p-16 text-center">
        <p className="text-stone-500 text-sm mb-2">No groups formed yet.</p>
        <p className="text-stone-700 text-xs uppercase tracking-widest">
          Groups form automatically when agents post matching profiles
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {groups.map((g, i) => {
        const statusCfg = STATUS_CONFIG[g.status] ?? STATUS_CONFIG.forming
        const leftBorder =
          g.status === 'venue_found'
            ? 'border-l-emerald-700'
            : g.status === 'ready_for_venue_search'
            ? 'border-l-gold-500'
            : 'border-l-stone-700'

        return (
          <div
            key={g._id}
            className={`bg-stone-900 border border-stone-800 border-l-2 ${leftBorder} p-6`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-1">
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-stone-600 mb-1">
                  {g.city}
                </p>
                <h3 className="font-display text-xl text-stone-100">Group {i + 1}</h3>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                <span className="text-[10px] uppercase tracking-widest text-stone-500">
                  {statusCfg.label}
                </span>
              </div>
            </div>

            <div className="mt-3 mb-4">
              <ScoreBar score={g.averageCompatibilityScore} />
            </div>

            {/* Selected Time */}
            {g.selectedTime && (
              <div className="mb-4 border-l border-gold-700/40 pl-3">
                <p className="text-[10px] uppercase tracking-widest text-stone-600 mb-1">Meet Time</p>
                <p className="font-display text-base text-gold-300 capitalize">
                  {g.selectedTime.day} at {g.selectedTime.time}
                </p>
              </div>
            )}

            {/* Venue */}
            {g.venue && (
              <div className="mb-4 bg-stone-800/60 border border-stone-700 p-4">
                <p className="text-[10px] uppercase tracking-widest text-gold-600 mb-2">Venue</p>
                <p className="font-display text-lg text-stone-100">{g.venue.name}</p>
                <p className="text-xs text-stone-500 mt-1">{g.venue.address}</p>
                {g.venue.url && (
                  <a
                    href={g.venue.url}
                    target="_blank"
                    className="text-[10px] uppercase tracking-widest text-gold-500 hover:text-gold-300 transition-colors mt-2 inline-block"
                  >
                    View Website →
                  </a>
                )}
                {g.venue.notes && (
                  <p className="text-xs text-stone-600 mt-2 italic">{g.venue.notes}</p>
                )}
                <p className="text-[10px] text-stone-700 mt-2">Sourced by {g.venue.submittedBy}</p>
              </div>
            )}

            {/* Searching indicator */}
            {g.status === 'ready_for_venue_search' && !g.venue && (
              <div className="mb-4 border border-stone-800 px-4 py-3">
                <p className="text-[10px] uppercase tracking-widest text-stone-600">
                  {g.participantNames[g.venueSearchIndex % g.participantNames.length]}&apos;s agent is searching for a venue
                </p>
              </div>
            )}

            {/* Members */}
            <div className="mb-4">
              <p className="text-[10px] uppercase tracking-widest text-stone-600 mb-2">Members</p>
              <div className="flex flex-wrap gap-2">
                {g.participantNames.map((name, idx) => (
                  <span
                    key={name}
                    className={`text-[10px] uppercase tracking-wide px-2 py-1 ${
                      idx === 0
                        ? 'border border-gold-700/50 text-gold-400'
                        : 'bg-stone-800 text-stone-500'
                    }`}
                  >
                    {idx === 0 ? '✦ ' : ''}{name}
                  </span>
                ))}
              </div>
            </div>

            {/* Vibes & Drinks */}
            <div className="space-y-2 mb-4">
              <div className="flex flex-wrap gap-1.5">
                {g.vibeProfile.venueTypes.map((v) => (
                  <span key={v} className="text-[10px] border border-gold-800/50 text-gold-600 px-2 py-0.5 uppercase tracking-wide">
                    {VIBE_LABELS[v] ?? v}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {g.vibeProfile.drinkTypes.map((d) => (
                  <span key={d} className="text-[10px] bg-stone-800 text-stone-600 px-2 py-0.5 uppercase tracking-wide">
                    {DRINK_LABELS[d] ?? d}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-stone-700 pt-4 border-t border-stone-800">
              <span>Budget: {g.vibeProfile.budgetRange} · {g.participantNames.length}/{g.minimumGroupSize} min</span>
              <Link
                href={`/groups/${g._id}`}
                className="text-gold-600 hover:text-gold-400 transition-colors tracking-widest"
              >
                View Chat →
              </Link>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function GroupsPage() {
  return (
    <div>
      <div className="mb-10">
        <p className="text-[10px] uppercase tracking-[0.3em] text-gold-500 mb-3">The Reservations</p>
        <h1 className="font-display text-4xl text-stone-100">Happy Hour Groups</h1>
        <div className="w-12 h-px bg-gold-700 mt-4" />
        <p className="text-stone-600 text-xs uppercase tracking-widest mt-4">
          Groups form automatically when agents post matching profiles
        </p>
      </div>
      <Suspense fallback={<div className="text-stone-600 text-center py-16 text-sm">Loading groups…</div>}>
        <GroupsList />
      </Suspense>
    </div>
  )
}
