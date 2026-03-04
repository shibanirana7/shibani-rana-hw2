import { Suspense } from 'react'

interface HappyHourGroup {
  _id: string
  participantNames: string[]
  suggestedTimes: Array<{ day: string; time: string }>
  vibeProfile: {
    venueTypes: string[]
    drinkTypes: string[]
    budgetRange: string
    groupSize: number
  }
  averageCompatibilityScore: number
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
        <p className="text-slate-400 text-lg mb-2">No groups matched yet.</p>
        <p className="text-slate-500 text-sm">
          Have agents complete conversations and submit compatibility reports, then trigger:
        </p>
        <code className="text-xs text-amber-400 bg-slate-900 px-3 py-1 rounded mt-3 inline-block">
          POST /api/groups/generate
        </code>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {groups.map((g, i) => (
        <div
          key={g._id}
          className="bg-slate-800 border border-amber-500/30 rounded-lg p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-amber-400 text-lg">Group {i + 1}</h3>
            <ScoreBar score={g.averageCompatibilityScore} />
          </div>

          {/* Members */}
          <div className="mb-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Members</p>
            <div className="flex flex-wrap gap-2">
              {g.participantNames.map((name) => (
                <span
                  key={name}
                  className="px-2 py-1 bg-slate-700 rounded text-sm text-slate-200 font-medium"
                >
                  👤 {name}
                </span>
              ))}
            </div>
          </div>

          {/* Suggested Times */}
          {g.suggestedTimes?.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">
                Suggested Times
              </p>
              <div className="flex flex-wrap gap-1">
                {g.suggestedTimes.map((t, j) => (
                  <span
                    key={j}
                    className="text-xs bg-green-500/15 text-green-400 border border-green-500/20 px-2 py-1 rounded"
                  >
                    📅 {t.day} {t.time}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Vibe Profile */}
          <div className="mb-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Vibe Profile</p>
            <div className="flex flex-wrap gap-1 mb-2">
              {g.vibeProfile.venueTypes.map((v) => (
                <span
                  key={v}
                  className="text-xs bg-amber-500/15 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded"
                >
                  {VIBE_LABELS[v] ?? v}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-1">
              {g.vibeProfile.drinkTypes.map((d) => (
                <span
                  key={d}
                  className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded"
                >
                  {DRINK_LABELS[d] ?? d}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-700">
            <span>Budget: {g.vibeProfile.budgetRange}</span>
            <span>{g.vibeProfile.groupSize} people</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function GroupsPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Happy Hour Groups</h1>
        <code className="text-xs text-slate-500 bg-slate-800 px-3 py-1 rounded border border-slate-700">
          POST /api/groups/generate to refresh
        </code>
      </div>
      <Suspense
        fallback={<div className="text-slate-400 text-center py-12">Loading groups…</div>}
      >
        <GroupsList />
      </Suspense>
    </div>
  )
}
