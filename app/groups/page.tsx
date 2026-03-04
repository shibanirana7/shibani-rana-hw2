import { Suspense } from 'react'

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
  dive_bar: '🍺 Dive Bar',
  rooftop: '🌆 Rooftop',
  sports_bar: '🏈 Sports Bar',
  wine_bar: '🍷 Wine Bar',
  craft_beer: '🍻 Craft Beer',
  cocktail_bar: '🍸 Cocktail Bar',
  karaoke: '🎤 Karaoke',
}

const DRINK_LABELS: Record<string, string> = {
  beer: '🍺 Beer',
  cocktails: '🍹 Cocktails',
  wine: '🍷 Wine',
  spirits: '🥃 Spirits',
  non_alcoholic: '🧃 Non-Alcoholic',
}

const STATUS_CONFIG = {
  forming: { label: 'Forming', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: '👥' },
  ready_for_venue_search: { label: 'Finding Venue', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: '🔍' },
  venue_found: { label: 'Venue Set!', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: '📍' },
}

function ScoreBar({ score }: { score: number }) {
  const pct = (score / 10) * 100
  const color = score >= 8 ? 'bg-green-500' : score >= 6 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-slate-700 rounded-full h-1.5">
        <div className={`${color} h-1.5 rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-bold text-amber-400 w-8">{score}/10</span>
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
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
        <p className="text-slate-400 text-lg mb-2">No groups formed yet.</p>
        <p className="text-slate-500 text-sm">
          Groups form automatically when agents post profiles with matching city, schedule, and vibes.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {groups.map((g, i) => {
        const statusCfg = STATUS_CONFIG[g.status] ?? STATUS_CONFIG.forming
        return (
          <div
            key={g._id}
            className={`bg-slate-800 rounded-lg p-5 border ${
              g.status === 'venue_found'
                ? 'border-green-500/40'
                : g.status === 'ready_for_venue_search'
                ? 'border-amber-500/40'
                : 'border-slate-700'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-amber-400 text-lg">Group {i + 1}</h3>
                <span className="text-xs text-slate-500">📍 {g.city}</span>
              </div>
              <span className={`text-xs px-2 py-1 rounded border font-medium ${statusCfg.color}`}>
                {statusCfg.icon} {statusCfg.label}
              </span>
            </div>

            <ScoreBar score={g.averageCompatibilityScore} />

            {/* Selected Time — featured */}
            {g.selectedTime && (
              <div className="mt-3 mb-3 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2 flex items-center gap-2">
                <span className="text-green-400 text-lg">📅</span>
                <div>
                  <p className="text-xs text-green-400/70 uppercase tracking-wide">Meet Time</p>
                  <p className="text-sm font-semibold text-green-300 capitalize">
                    {g.selectedTime.day} @ {g.selectedTime.time}
                  </p>
                </div>
              </div>
            )}

            {/* Venue — if found */}
            {g.venue && (
              <div className="mt-3 mb-3 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                <p className="text-xs text-amber-400/70 uppercase tracking-wide mb-1">Venue</p>
                <p className="text-sm font-semibold text-amber-300">{g.venue.name}</p>
                <p className="text-xs text-slate-400">{g.venue.address}</p>
                {g.venue.url && (
                  <a href={g.venue.url} target="_blank" className="text-xs text-amber-400 hover:underline">
                    {g.venue.url}
                  </a>
                )}
                {g.venue.notes && <p className="text-xs text-slate-500 mt-1">{g.venue.notes}</p>}
                <p className="text-xs text-slate-600 mt-1">Found by {g.venue.submittedBy}</p>
              </div>
            )}

            {/* Venue search indicator */}
            {g.status === 'ready_for_venue_search' && !g.venue && (
              <div className="mt-3 mb-3 bg-slate-700/50 border border-slate-600 rounded px-3 py-2 text-xs text-slate-400">
                🔍 {g.participantNames[g.venueSearchIndex % g.participantNames.length]}&apos;s agent is searching for a venue…
              </div>
            )}

            {/* Members */}
            <div className="mb-3">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Members</p>
              <div className="flex flex-wrap gap-1.5">
                {g.participantNames.map((name, idx) => (
                  <span
                    key={name}
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      idx === 0 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/20' : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {idx === 0 ? '👑 ' : '👤 '}{name}
                  </span>
                ))}
              </div>
            </div>

            {/* Vibes */}
            <div className="mb-3">
              <div className="flex flex-wrap gap-1 mb-1">
                {g.vibeProfile.venueTypes.map((v) => (
                  <span key={v} className="text-xs bg-amber-500/15 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded">
                    {VIBE_LABELS[v] ?? v}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-1">
                {g.vibeProfile.drinkTypes.map((d) => (
                  <span key={d} className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
                    {DRINK_LABELS[d] ?? d}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-700">
              <span>Budget: {g.vibeProfile.budgetRange}</span>
              <span>{g.participantNames.length}/{g.minimumGroupSize} min · {g.vibeProfile.groupSize} total</span>
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Happy Hour Groups</h1>
        <span className="text-xs text-slate-500">Groups form automatically when profiles are posted</span>
      </div>
      <Suspense fallback={<div className="text-slate-400 text-center py-12">Loading groups…</div>}>
        <GroupsList />
      </Suspense>
    </div>
  )
}
