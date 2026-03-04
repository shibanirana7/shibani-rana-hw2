import { Suspense } from 'react'

interface Participant {
  _id: string
  name: string
  email: string
  city: string
  preferredContact: string
  contactHandle: string
  availability: Array<{ day: string; startTime: string; endTime: string }>
  vibePreferences: {
    venueTypes: string[]
    drinkTypes: string[]
    budgetRange: string
    groupSizePreference: string
  }
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

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

async function ParticipantsList() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/participants`, { cache: 'no-store' })
  const data = await res.json()
  const participants: Participant[] = data.participants ?? []

  if (participants.length === 0) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
        <p className="text-slate-400 text-lg">No participants yet.</p>
        <p className="text-slate-500 text-sm mt-2">
          Have agents POST to /api/agents/claim to register.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {participants.map((p) => (
        <div
          key={p._id}
          className="bg-slate-800 border border-slate-700 rounded-lg p-5 hover:border-amber-500/50 transition-colors"
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-slate-100">{p.name}</h3>
              <p className="text-xs text-slate-500">{p.email}</p>
              {p.city && (
                <span className="inline-block mt-1 text-xs bg-blue-500/15 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded">
                  📍 {p.city}
                </span>
              )}
            </div>
            <span className="text-lg font-bold text-amber-400">
              {p.vibePreferences?.budgetRange ?? '$$'}
            </span>
          </div>

          {/* Availability */}
          {p.availability?.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Available</p>
              <div className="flex flex-wrap gap-1">
                {p.availability
                  .sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day))
                  .map((slot, i) => (
                    <span
                      key={i}
                      className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded"
                    >
                      {slot.day.slice(0, 3)} {slot.startTime}–{slot.endTime}
                    </span>
                  ))}
              </div>
            </div>
          )}

          {/* Venue Vibes */}
          {p.vibePreferences?.venueTypes?.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Vibes</p>
              <div className="flex flex-wrap gap-1">
                {p.vibePreferences.venueTypes.map((v) => (
                  <span
                    key={v}
                    className="text-xs bg-amber-500/15 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded"
                  >
                    {VIBE_LABELS[v] ?? v}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Drinks */}
          {p.vibePreferences?.drinkTypes?.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Drinks</p>
              <div className="flex flex-wrap gap-1">
                {p.vibePreferences.drinkTypes.map((d) => (
                  <span
                    key={d}
                    className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded"
                  >
                    {DRINK_LABELS[d] ?? d}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-3 border-t border-slate-700">
            <span>
              Group:{' '}
              {p.vibePreferences?.groupSizePreference === 'intimate'
                ? '2–4 people'
                : p.vibePreferences?.groupSizePreference === 'medium'
                ? '5–8 people'
                : '8+ people'}
            </span>
            <span>via {p.preferredContact}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function ParticipantsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-100 mb-6">Participants</h1>
      <Suspense
        fallback={
          <div className="text-slate-400 text-center py-12">Loading participants…</div>
        }
      >
        <ParticipantsList />
      </Suspense>
    </div>
  )
}
