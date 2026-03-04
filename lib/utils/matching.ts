import { IParticipant, IAvailabilitySlot } from '@/lib/models/Participant'
import { ICompatibilityReport } from '@/lib/models/CompatibilityReport'

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

function getOverlappingSlots(
  slotsA: IAvailabilitySlot[],
  slotsB: IAvailabilitySlot[]
): Array<{ day: string; time: string }> {
  const overlaps: Array<{ day: string; time: string }> = []
  for (const a of slotsA) {
    for (const b of slotsB) {
      if (a.day === b.day) {
        const startA = timeToMinutes(a.startTime)
        const endA = timeToMinutes(a.endTime)
        const startB = timeToMinutes(b.startTime)
        const endB = timeToMinutes(b.endTime)
        const overlapStart = Math.max(startA, startB)
        const overlapEnd = Math.min(endA, endB)
        if (overlapEnd - overlapStart >= 60) {
          overlaps.push({
            day: a.day,
            time: `${minutesToTime(overlapStart)} – ${minutesToTime(overlapEnd)}`,
          })
        }
      }
    }
  }
  return overlaps
}

export interface MatchResult {
  participantIds: string[]
  participantNames: string[]
  suggestedTimes: Array<{ day: string; time: string }>
  vibeProfile: {
    venueTypes: string[]
    drinkTypes: string[]
    budgetRange: string
    groupSize: number
  }
  averageCompatibilityScore: number
}

export function generateMatches(
  participants: IParticipant[],
  reports: ICompatibilityReport[]
): MatchResult[] {
  // Build mutual score map: sorted pair key → average mutual score
  const mutualScores = new Map<string, number>()

  for (const r of reports) {
    const aId = r.fromParticipantId.toString()
    const bId = r.toParticipantId.toString()
    const key = [aId, bId].sort().join('|')
    const reverse = reports.find(
      (x) =>
        x.fromParticipantId.toString() === bId &&
        x.toParticipantId.toString() === aId
    )
    const score = reverse
      ? (r.overallScore + reverse.overallScore) / 2
      : r.overallScore
    if (!mutualScores.has(key) || mutualScores.get(key)! < score) {
      mutualScores.set(key, score)
    }
  }

  // Sort pairs by score descending
  const sortedPairs = Array.from(mutualScores.entries()).sort(
    ([, a], [, b]) => b - a
  )

  const assigned = new Set<string>()
  const groups: MatchResult[] = []

  for (const [pairKey, pairScore] of sortedPairs) {
    const [idA, idB] = pairKey.split('|')
    if (assigned.has(idA) || assigned.has(idB)) continue

    const groupIds = [idA, idB]

    // Try to expand the group
    for (const p of participants) {
      const pId = p._id.toString()
      if (assigned.has(pId) || groupIds.includes(pId)) continue
      const scores = groupIds.map((gId) => {
        const k = [pId, gId].sort().join('|')
        return mutualScores.get(k) ?? 0
      })
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length
      if (avg >= 6 && groupIds.length < 6) {
        groupIds.push(pId)
      }
    }

    const members = groupIds
      .map((id) => participants.find((p) => p._id.toString() === id))
      .filter((p): p is IParticipant => !!p)

    // Find overlapping availability
    let slots = members[0]?.availability.map((s) => ({
      day: s.day,
      time: `${s.startTime} – ${s.endTime}`,
    })) ?? []

    for (let i = 1; i < members.length; i++) {
      slots = getOverlappingSlots(members[0].availability, members[i].availability)
    }

    // Vibe profile: intersection then fallback to union
    const allVenues = members.map((p) => p.vibePreferences.venueTypes)
    const commonVenues = allVenues[0]?.filter((v) =>
      allVenues.every((types) => types.includes(v))
    ) ?? []

    const allDrinks = members.map((p) => p.vibePreferences.drinkTypes)
    const commonDrinks = allDrinks[0]?.filter((d) =>
      allDrinks.every((types) => types.includes(d))
    ) ?? []

    const budgets = ['$', '$$', '$$$', '$$$$']
    const budgetIndices = members.map((p) =>
      budgets.indexOf(p.vibePreferences.budgetRange)
    )
    const minBudgetIdx = Math.min(...budgetIndices.filter((i) => i >= 0))
    const minBudget = budgets[minBudgetIdx >= 0 ? minBudgetIdx : 1]

    groups.push({
      participantIds: groupIds,
      participantNames: members.map((p) => p.name),
      suggestedTimes: slots.slice(0, 3),
      vibeProfile: {
        venueTypes:
          commonVenues.length > 0 ? commonVenues : [...new Set(allVenues.flat())].slice(0, 3),
        drinkTypes:
          commonDrinks.length > 0 ? commonDrinks : [...new Set(allDrinks.flat())].slice(0, 3),
        budgetRange: minBudget,
        groupSize: groupIds.length,
      },
      averageCompatibilityScore: Math.round(pairScore * 10) / 10,
    })

    groupIds.forEach((id) => assigned.add(id))
  }

  return groups
}
