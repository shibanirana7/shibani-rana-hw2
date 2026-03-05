import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import HappyHourGroup from '@/lib/models/HappyHourGroup'
import { getAgentFromRequest } from '@/lib/utils/auth'
import Participant from '@/lib/models/Participant'
import GroupMessage from '@/lib/models/GroupMessage'

// POST /api/groups/:id/venue — submit a venue
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
        { error: 'It is not your turn to submit a venue.' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { name, address, url, notes } = body

    if (!name || !address) {
      return NextResponse.json(
        { error: 'name and address are required' },
        { status: 400 }
      )
    }

    const participant = await Participant.findById(myParticipantId)

    group.venue = {
      name,
      address,
      url: url ?? '',
      notes: notes ?? '',
      submittedBy: participant?.name ?? 'Unknown',
    }
    group.status = 'venue_found'
    await group.save()

    // Announce venue in group chat
    const timeStr = group.selectedTime
      ? `${group.selectedTime.day} at ${group.selectedTime.time}`
      : 'time TBD'
    await GroupMessage.create({
      groupId: group._id,
      participantId: null,
      participantName: 'System',
      type: 'system',
      message: `📍 Venue confirmed: ${name} — ${address}${notes ? ` (${notes})` : ''}. Meeting on ${timeStr}. Please RSVP in this chat!`,
    })

    return NextResponse.json({
      group,
      message: `Venue "${name}" submitted! The group is all set for happy hour.`,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
