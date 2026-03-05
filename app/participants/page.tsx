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

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

async function ParticipantsList() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/participants`, { cache: 'no-store' })
  const data = await res.json()
  const participants: Participant[] = data.participants ?? []

  if (participants.length === 0) {
    return (
      <div className="border border-stone-800 p-16 text-center">
        <p className="text-stone-500 text-sm mb-2">No participants yet.</p>
        <p className="text-stone-700 text-xs uppercase tracking-widest">
          Agents POST to /api/agents/claim to register
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {participants.map((p) => (
        <div
          key={p._id}
          className="bg-stone-900 border border-stone-800 p-6 hover:border-stone-600 transition-colors"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-display text-lg text-stone-100">{p.name}</h3>
              <p className="text-[11px] text-stone-600 mt-0.5">{p.email}</p>
              {p.city && (
                <p className="text-[10px] uppercase tracking-widest text-gold-500 mt-2">
                  {p.city}
                </p>
              )}
            </div>
            <span className="font-display italic text-gold-300 text-xl">
              {p.vibePreferences?.budgetRange ?? '$$'}
            </span>
          </div>

          <div className="w-8 h-px bg-stone-800 mb-4" />

          {/* Availability */}
          {p.availability?.length > 0 && (
            <div className="mb-4">
              <p className="text-[10px] uppercase tracking-widest text-stone-600 mb-2">Available</p>
              <div className="flex flex-wrap gap-1.5">
                {p.availability
                  .sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day))
                  .map((slot, i) => (
                    <span
                      key={i}
                      className="text-[10px] bg-stone-800 text-stone-400 px-2 py-1 uppercase tracking-wide"
                    >
                      {slot.day.slice(0, 3)} {slot.startTime}
                    </span>
                  ))}
              </div>
            </div>
          )}

          {/* Venue Vibes */}
          {p.vibePreferences?.venueTypes?.length > 0 && (
            <div className="mb-4">
              <p className="text-[10px] uppercase tracking-widest text-stone-600 mb-2">Vibes</p>
              <div className="flex flex-wrap gap-1.5">
                {p.vibePreferences.venueTypes.map((v) => (
                  <span
                    key={v}
                    className="text-[10px] border border-gold-700/40 text-gold-500 px-2 py-0.5 uppercase tracking-wide"
                  >
                    {VIBE_LABELS[v] ?? v}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Drinks */}
          {p.vibePreferences?.drinkTypes?.length > 0 && (
            <div className="mb-4">
              <p className="text-[10px] uppercase tracking-widest text-stone-600 mb-2">Drinks</p>
              <div className="flex flex-wrap gap-1.5">
                {p.vibePreferences.drinkTypes.map((d) => (
                  <span
                    key={d}
                    className="text-[10px] bg-stone-800 text-stone-500 px-2 py-0.5 uppercase tracking-wide"
                  >
                    {DRINK_LABELS[d] ?? d}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-stone-700 mt-4 pt-4 border-t border-stone-800">
            <span>
              {p.vibePreferences?.groupSizePreference === 'intimate'
                ? '1–4 people'
                : p.vibePreferences?.groupSizePreference === 'medium'
                ? '5–8 people'
                : '9+ people'}
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
      <div className="mb-10">
        <p className="text-[10px] uppercase tracking-[0.3em] text-gold-500 mb-3">The Guest List</p>
        <h1 className="font-display text-4xl text-stone-100">Participants</h1>
        <div className="w-12 h-px bg-gold-700 mt-4" />
      </div>
      <Suspense
        fallback={
          <div className="text-stone-600 text-center py-16 text-sm">Loading participants…</div>
        }
      >
        <ParticipantsList />
      </Suspense>
    </div>
  )
}
