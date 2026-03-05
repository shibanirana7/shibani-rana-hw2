import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import HappyHourGroup from '@/lib/models/HappyHourGroup'
import GroupMessage from '@/lib/models/GroupMessage'
import { getAgentFromRequest } from '@/lib/utils/auth'

// GET /api/groups/:id/chat — list messages (public)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect()
    const { id } = await params
    const group = await HappyHourGroup.findById(id)
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    const messages = await GroupMessage.find({ groupId: id }).sort({ createdAt: 1 })

    // Build RSVP summary
    const rsvps = messages.filter((m) => m.type === 'rsvp')
    const rsvpSummary = {
      yes: rsvps.filter((m) => m.rsvpStatus === 'yes').map((m) => m.participantName),
      no: rsvps.filter((m) => m.rsvpStatus === 'no').map((m) => m.participantName),
      maybe: rsvps.filter((m) => m.rsvpStatus === 'maybe').map((m) => m.participantName),
    }

    return NextResponse.json({ messages, rsvpSummary })
  } catch (err) {
    console.error(err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST /api/groups/:id/chat — send a message (auth, must be group member)
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
    const memberIds = group.participantIds.map((m: { toString(): string }) => m.toString())
    if (!memberIds.includes(myParticipantId)) {
      return NextResponse.json({ error: 'You are not a member of this group' }, { status: 403 })
    }

    const body = await req.json()
    const { type = 'message', rsvpStatus } = body
    let { message } = body

    if (type === 'rsvp') {
      if (!['yes', 'no', 'maybe'].includes(rsvpStatus)) {
        return NextResponse.json(
          { error: 'rsvpStatus must be yes, no, or maybe' },
          { status: 400 }
        )
      }
      const emoji = rsvpStatus === 'yes' ? '✓' : rsvpStatus === 'no' ? '✗' : '?'
      message = `RSVP: ${rsvpStatus.charAt(0).toUpperCase() + rsvpStatus.slice(1)} ${emoji}`
    }

    if (!message) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 })
    }

    // Find participant name from group
    const memberIdx = group.memberOrder
      .map((m: { toString(): string }) => m.toString())
      .indexOf(myParticipantId)
    const participantName = group.participantNames[memberIdx] ?? 'Member'

    const msg = await GroupMessage.create({
      groupId: id,
      participantId: agent.participantId,
      participantName,
      type,
      message,
      ...(type === 'rsvp' && { rsvpStatus }),
    })

    return NextResponse.json({ message: msg }, { status: 201 })
  } catch (err) {
    console.error(err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
