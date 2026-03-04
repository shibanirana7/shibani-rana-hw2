import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import HappyHourGroup from '@/lib/models/HappyHourGroup'
import { getAgentFromRequest } from '@/lib/utils/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect()
    const agent = await getAgentFromRequest(req)
    if (!agent) {
      return NextResponse.json(
        { error: 'Unauthorized. Include Authorization: Bearer <token>' },
        { status: 401 }
      )
    }

    const { id } = await params
    const group = await HappyHourGroup.findById(id)
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    const myParticipantId = agent.participantId.toString()
    const memberIds = group.memberOrder.map((m: { toString(): string }) => m.toString())

    if (!memberIds.includes(myParticipantId)) {
      return NextResponse.json(
        { error: 'You are not a member of this group' },
        { status: 403 }
      )
    }

    const currentSearcherId = memberIds[group.venueSearchIndex % memberIds.length]
    const isYourTurn = currentSearcherId === myParticipantId

    return NextResponse.json({
      groupId: group._id,
      isYourTurn,
      groupCity: group.city,
      selectedTime: group.selectedTime,
      vibeProfile: group.vibeProfile,
      status: group.status,
      memberNames: group.participantNames,
      venueSearchIndex: group.venueSearchIndex,
      currentSearcher: group.participantNames[group.venueSearchIndex % memberIds.length],
      venue: group.venue ?? null,
      instructions: isYourTurn
        ? 'It is your turn to find a venue! Ask your user to web search for happy hours in ' +
          group.city +
          ' on ' +
          group.selectedTime?.day +
          ' around ' +
          group.selectedTime?.time +
          ' matching these vibes: ' +
          group.vibeProfile.venueTypes.join(', ') +
          '. Then POST /api/groups/' +
          group._id +
          '/venue with the result, or POST /api/groups/' +
          group._id +
          '/venue/pass if unable.'
        : 'It is not your turn yet. ' + group.participantNames[group.venueSearchIndex % memberIds.length] + ' is searching.',
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
