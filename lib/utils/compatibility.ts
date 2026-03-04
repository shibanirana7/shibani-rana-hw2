import { IParticipant, IAvailabilitySlot } from '@/lib/models/Participant'

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const BUDGETS = ['$', '$$', '$$$', '$$$$']
const SIZES = ['intimate', 'medium', 'large']

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + (m || 0)
}

function minutesToTime(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

export interface OverlapSlot {
  day: string
  startTime: string
  endTime: string
  time: string  // formatted "HH:MM – HH:MM"
}

export function getOverlappingSlots(
  slotsA: IAvailabilitySlot[],
  slotsB: IAvailabilitySlot[]
): OverlapSlot[] {
  const overlaps: OverlapSlot[] = []
  for (const a of slotsA) {
    for (const b of slotsB) {
      if (a.day !== b.day) continue
      const startA = timeToMinutes(a.startTime)
      const endA = timeToMinutes(a.endTime)
      const startB = timeToMinutes(b.startTime)
      const endB = timeToMinutes(b.endTime)
      const start = Math.max(startA, startB)
      const end = Math.min(endA, endB)
      if (end - start >= 60) {
        overlaps.push({
          day: a.day,
          startTime: minutesToTime(start),
          endTime: minutesToTime(end),
          time: `${minutesToTime(start)} – ${minutesToTime(end)}`,
        })
      }
    }
  }
  return overlaps
}

export interface CompatibilityResult {
  scores: {
    scheduleOverlap: number
    vibeCompatibility: number
    drinkCompatibility: number
    budgetCompatibility: number
    groupSizeCompatibility: number
  }
  overallScore: number
  overlappingSlots: OverlapSlot[]
}

export function calculateCompatibility(
  a: IParticipant,
  b: IParticipant
): CompatibilityResult {
  const slots = getOverlappingSlots(a.availability ?? [], b.availability ?? [])
  const scheduleScore = slots.length === 0 ? 0 : Math.min(10, slots.length * 3 + 4)

  const sharedVenues = (a.vibePreferences?.venueTypes ?? []).filter((v) =>
    (b.vibePreferences?.venueTypes ?? []).includes(v)
  )
  const vibeScore = sharedVenues.length === 0 ? 2 : Math.min(10, sharedVenues.length * 3 + 4)

  const sharedDrinks = (a.vibePreferences?.drinkTypes ?? []).filter((d) =>
    (b.vibePreferences?.drinkTypes ?? []).includes(d)
  )
  const drinkScore = sharedDrinks.length === 0 ? 3 : Math.min(10, sharedDrinks.length * 3 + 4)

  const budgetDiff = Math.abs(
    BUDGETS.indexOf(a.vibePreferences?.budgetRange ?? '$$') -
    BUDGETS.indexOf(b.vibePreferences?.budgetRange ?? '$$')
  )
  const budgetScore = ([10, 7, 5, 2][budgetDiff] ?? 2)

  const sizeDiff = Math.abs(
    SIZES.indexOf(a.vibePreferences?.groupSizePreference ?? 'medium') -
    SIZES.indexOf(b.vibePreferences?.groupSizePreference ?? 'medium')
  )
  const sizeScore = ([10, 5, 0][sizeDiff] ?? 0)

  const overallScore = Math.round(
    (scheduleScore * 0.4 +
      vibeScore * 0.25 +
      drinkScore * 0.15 +
      budgetScore * 0.1 +
      sizeScore * 0.1) * 10
  ) / 10

  return {
    scores: {
      scheduleOverlap: scheduleScore,
      vibeCompatibility: vibeScore,
      drinkCompatibility: drinkScore,
      budgetCompatibility: budgetScore,
      groupSizeCompatibility: sizeScore,
    },
    overallScore,
    overlappingSlots: slots,
  }
}

/** Find earliest universal overlap across all member slots */
export function findEarliestUniversalOverlap(
  members: IParticipant[]
): { day: string; time: string } | null {
  if (members.length === 0) return null
  if (members.length === 1) {
    const s = members[0].availability?.[0]
    if (!s) return null
    return { day: s.day, time: s.startTime }
  }

  // Collect all candidate day+time windows from first member
  let candidates: OverlapSlot[] = (members[0].availability ?? []).map((s) => ({
    day: s.day,
    startTime: s.startTime,
    endTime: s.endTime,
    time: `${s.startTime} – ${s.endTime}`,
  }))

  // Intersect with each subsequent member
  for (let i = 1; i < members.length; i++) {
    const next = members[i].availability ?? []
    const intersected: OverlapSlot[] = []
    for (const c of candidates) {
      for (const n of next) {
        if (c.day !== n.day) continue
        const start = Math.max(timeToMinutes(c.startTime), timeToMinutes(n.startTime))
        const end = Math.min(timeToMinutes(c.endTime), timeToMinutes(n.endTime))
        if (end - start >= 60) {
          intersected.push({
            day: c.day,
            startTime: minutesToTime(start),
            endTime: minutesToTime(end),
            time: `${minutesToTime(start)} – ${minutesToTime(end)}`,
          })
        }
      }
    }
    candidates = intersected
    if (candidates.length === 0) return null
  }

  // Sort by day order then start time, return earliest
  candidates.sort((a, b) => {
    const dayDiff = DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day)
    if (dayDiff !== 0) return dayDiff
    return timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  })

  const earliest = candidates[0]
  return { day: earliest.day, time: earliest.startTime }
}

export function minimumGroupSize(pref: string): number {
  if (pref === 'intimate') return 2
  if (pref === 'large') return 4
  return 3 // medium
}
