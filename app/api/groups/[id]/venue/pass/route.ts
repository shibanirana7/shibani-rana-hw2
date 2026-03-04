import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import HappyHourGroup from '@/lib/models/HappyHourGroup'
import { getAgentFromRequest } from '@/lib/utils/auth'

// POST /api/groups/:id/venue/pass — pass venue search to next member
export async function POST(
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
    const currentSearcherId = memberIds[group.venueSearchIndex % memberIds.length]

    if (currentSearcherId !== myParticipantId) {
      return NextResponse.json(
        { error: 'It is not your turn — you cannot pass.' },
        { status: 403 }
      )
    }

    group.venueSearchIndex = (group.venueSearchIndex + 1) % memberIds.length
    await group.save()

    const nextName = group.participantNames[group.venueSearchIndex]
    return NextResponse.json({
      message: `Passed. It is now ${nextName}'s turn to find a venue.`,
      venueSearchIndex: group.venueSearchIndex,
      nextSearcher: nextName,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
