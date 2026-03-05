import dbConnect from '@/lib/db'
import { IParticipant } from '@/lib/models/Participant'
import { IHappyHourGroup } from '@/lib/models/HappyHourGroup'
import HappyHourGroup from '@/lib/models/HappyHourGroup'
import CompatibilityReport from '@/lib/models/CompatibilityReport'
import {
  calculateCompatibility,
  findEarliestUniversalOverlap,
  minimumGroupSize,
} from '@/lib/utils/compatibility'

const BUDGETS = ['$', '$$', '$$$', '$$$$']

function vibeProfile(members: IParticipant[]) {
  const allVenues = members.map((p) => p.vibePreferences?.venueTypes ?? [])
  const commonVenues = allVenues[0]?.filter((v) => allVenues.every((t) => t.includes(v))) ?? []

  const allDrinks = members.map((p) => p.vibePreferences?.drinkTypes ?? [])
  const commonDrinks = allDrinks[0]?.filter((d) => allDrinks.every((t) => t.includes(d))) ?? []

  const budgetIndices = members
    .map((p) => BUDGETS.indexOf(p.vibePreferences?.budgetRange ?? '$$'))
    .filter((i) => i >= 0)
  const minBudget = BUDGETS[Math.min(...(budgetIndices.length ? budgetIndices : [1]))]

  return {
    venueTypes: commonVenues.length > 0 ? commonVenues : [...new Set(allVenues.flat())].slice(0, 3),
    drinkTypes: commonDrinks.length > 0 ? commonDrinks : [...new Set(allDrinks.flat())].slice(0, 3),
    budgetRange: minBudget,
    groupSize: members.length,
  }
}

function isProfileComplete(p: IParticipant): boolean {
  return !!(
    p.city &&
    p.availability?.length > 0 &&
    p.vibePreferences?.venueTypes?.length > 0
  )
}

/**
 * Called when a participant updates their profile.
 * Tries to join an existing group or create a new one (same city only).
 * Saves results to DB and returns the updated/created group (or null).
 */
export async function autoJoinGroup(
  participant: IParticipant,
  allParticipants: IParticipant[]
): Promise<IHappyHourGroup | null> {
  await dbConnect()

  if (!isProfileComplete(participant)) return null

  const pId = participant._id.toString()
  const city = participant.city

  // Candidates: same city, complete profile, not self
  const candidates = allParticipants.filter(
    (p) => p._id.toString() !== pId && p.city === city && isProfileComplete(p)
  )

  if (candidates.length === 0) return null

  // Calculate compatibility with all candidates
  const compatMap = new Map<string, ReturnType<typeof calculateCompatibility>>()
  for (const c of candidates) {
    compatMap.set(c._id.toString(), calculateCompatibility(participant, c))
  }

  // Save CompatibilityReport for each pair (upsert)
  for (const [cId, compat] of compatMap.entries()) {
    const existing = await CompatibilityReport.findOne({
      fromParticipantId: pId,
      toParticipantId: cId,
    })
    if (!existing) {
      const cParticipant = candidates.find((c) => c._id.toString() === cId)
      await CompatibilityReport.create({
        fromParticipantId: pId,
        fromParticipantName: participant.name,
        toParticipantId: cId,
        toParticipantName: cParticipant?.name ?? 'Unknown',
        scores: compat.scores,
        overallScore: compat.overallScore,
        suggestedTimes: compat.overlappingSlots
          .slice(0, 3)
          .map((s) => ({ day: s.day, time: s.startTime })),
        notes: 'Auto-generated from profile matching',
      })
    }
  }

  // Check if already in a group
  const alreadyIn = await HappyHourGroup.findOne({
    participantIds: participant._id,
    city,
  })
  if (alreadyIn) {
    // Recalculate selectedTime and vibeProfile with updated profile
    const memberDocs = allParticipants.filter((p) =>
      alreadyIn.participantIds.map((id: { toString(): string }) => id.toString()).includes(p._id.toString())
    )
    const newTime = findEarliestUniversalOverlap(memberDocs)
    alreadyIn.selectedTime = newTime
    alreadyIn.vibeProfile = vibeProfile(memberDocs)

    // Recalculate minimumGroupSize based on all members' preferences (most demanding wins)
    const newMinSize = Math.max(
      ...memberDocs.map((p) => minimumGroupSize(p.vibePreferences?.groupSizePreference ?? 'medium'))
    )
    alreadyIn.minimumGroupSize = newMinSize

    const currentCount = alreadyIn.participantIds.length
    if (alreadyIn.status === 'forming' && currentCount >= newMinSize) {
      alreadyIn.status = 'ready_for_venue_search'
    } else if (alreadyIn.status === 'ready_for_venue_search' && currentCount < newMinSize) {
      alreadyIn.status = 'forming'
    }

    await alreadyIn.save()
    return alreadyIn
  }

  // Find a suitable existing 'forming' group to join
  const formingGroups = await HappyHourGroup.find({ city, status: 'forming' })

  for (const group of formingGroups) {
    if (group.participantIds.length >= 6) continue

    const memberIds = group.participantIds.map((id: { toString(): string }) => id.toString())
    const members = allParticipants.filter((p) => memberIds.includes(p._id.toString()))

    // Check avg compatibility with all current members
    const scores = members.map((m) => {
      const c = compatMap.get(m._id.toString())
      return c?.overallScore ?? 0
    })
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
    if (avgScore < 6) continue

    // Check universal time overlap
    const allMembers = [...members, participant]
    const newTime = findEarliestUniversalOverlap(allMembers)
    if (!newTime) continue

    // Join this group
    group.participantIds.push(participant._id)
    group.participantNames.push(participant.name)
    group.memberOrder.push(participant._id)
    group.selectedTime = newTime
    group.averageCompatibilityScore =
      Math.round(((group.averageCompatibilityScore * members.length + avgScore) / allMembers.length) * 10) / 10
    group.vibeProfile = vibeProfile(allMembers)

    // Check minimum size (most demanding member's preference wins)
    const minSize = Math.max(
      ...allMembers.map((p) => minimumGroupSize(p.vibePreferences?.groupSizePreference ?? 'medium'))
    )
    group.minimumGroupSize = minSize
    if (group.participantIds.length >= minSize) {
      group.status = 'ready_for_venue_search'
    }

    await group.save()
    return group
  }

  // No suitable group — find best compatible candidate to start a new group with
  const compatiblePairs = candidates
    .map((c) => ({ candidate: c, compat: compatMap.get(c._id.toString())! }))
    .filter((x) => x.compat.overallScore >= 6 && x.compat.overlappingSlots.length > 0)
    .sort((a, b) => b.compat.overallScore - a.compat.overallScore)

  if (compatiblePairs.length === 0) return null

  const { candidate, compat } = compatiblePairs[0]
  const members = [participant, candidate]
  const selectedTime = findEarliestUniversalOverlap(members)
  const minSize = minimumGroupSize(participant.vibePreferences?.groupSizePreference ?? 'medium')

  const newGroup = await HappyHourGroup.create({
    city,
    participantIds: [participant._id, candidate._id],
    participantNames: [participant.name, candidate.name],
    memberOrder: [participant._id, candidate._id],
    leaderParticipantId: participant._id,
    selectedTime,
    minimumGroupSize: minSize,
    status: members.length >= minSize ? 'ready_for_venue_search' : 'forming',
    venueSearchIndex: 0,
    venue: null,
    vibeProfile: vibeProfile(members),
    averageCompatibilityScore: compat.overallScore,
  })

  return newGroup
}
