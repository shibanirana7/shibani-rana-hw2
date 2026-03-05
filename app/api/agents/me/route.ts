import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Agent from '@/lib/models/Agent'
import Participant from '@/lib/models/Participant'
import HappyHourGroup from '@/lib/models/HappyHourGroup'
import CompatibilityReport from '@/lib/models/CompatibilityReport'
import { getAgentFromRequest } from '@/lib/utils/auth'
import { findEarliestUniversalOverlap, minimumGroupSize } from '@/lib/utils/compatibility'

const BUDGETS = ['$', '$$', '$$$', '$$$$']

function vibeProfile(members: { vibePreferences?: { venueTypes?: string[]; drinkTypes?: string[]; budgetRange?: string } }[]) {
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

// DELETE /api/agents/me — remove yourself from the app
export async function DELETE(req: NextRequest) {
  try {
    await dbConnect()
    const agent = await getAgentFromRequest(req)
    if (!agent) {
      return NextResponse.json(
        { error: 'Unauthorized. Include Authorization: Bearer <token>' },
        { status: 401 }
      )
    }

    const participantId = agent.participantId.toString()
    const participant = await Participant.findById(participantId)

    // Clean up groups
    const groups = await HappyHourGroup.find({ participantIds: agent.participantId })
    for (const group of groups) {
      const memberIds = group.memberOrder.map((id: { toString(): string }) => id.toString())
      const remainingIds = memberIds.filter((id: string) => id !== participantId)

      if (remainingIds.length === 0) {
        await group.deleteOne()
        continue
      }

      // Remove participant from arrays
      const nameIdx = group.participantNames[memberIds.indexOf(participantId)]
      group.participantIds = group.participantIds.filter(
        (id: { toString(): string }) => id.toString() !== participantId
      )
      group.participantNames = group.participantNames.filter((_: string, i: number) => memberIds[i] !== participantId)
      group.memberOrder = group.memberOrder.filter(
        (id: { toString(): string }) => id.toString() !== participantId
      )

      // Transfer leadership if needed
      if (group.leaderParticipantId?.toString() === participantId && group.memberOrder.length > 0) {
        group.leaderParticipantId = group.memberOrder[0]
      }

      // Adjust venueSearchIndex if it now points out of bounds
      const newLen = group.memberOrder.length
      if (group.venueSearchIndex >= newLen) {
        group.venueSearchIndex = group.venueSearchIndex % newLen
      }

      // Recalculate group state from remaining members
      const remainingDocs = await Participant.find({ _id: { $in: group.participantIds } })
      group.selectedTime = findEarliestUniversalOverlap(remainingDocs as Parameters<typeof findEarliestUniversalOverlap>[0])
      group.vibeProfile = vibeProfile(remainingDocs)

      // Re-evaluate minimumGroupSize and status
      const leaderDoc = remainingDocs.find((p) => p._id.toString() === group.leaderParticipantId?.toString())
      const minSize = minimumGroupSize(leaderDoc?.vibePreferences?.groupSizePreference ?? 'medium')
      group.minimumGroupSize = minSize
      if (group.status !== 'venue_found' && group.participantIds.length < minSize) {
        group.status = 'forming'
      }

      await group.save()
      void nameIdx // suppress unused warning
    }

    // Delete compatibility reports involving this participant
    await CompatibilityReport.deleteMany({
      $or: [{ fromParticipantId: agent.participantId }, { toParticipantId: agent.participantId }],
    })

    // Delete participant and agent
    await Participant.findByIdAndDelete(participantId)
    await Agent.findByIdAndDelete(agent._id)

    return NextResponse.json({
      message: `${participant?.name ?? 'Participant'} has been removed. Re-register anytime at POST /api/agents/claim.`,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
