import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Participant from '@/lib/models/Participant'
import { getAgentFromRequest } from '@/lib/utils/auth'
import { autoJoinGroup } from '@/lib/utils/matching'
import GroupMessage from '@/lib/models/GroupMessage'

// GET — one participant (public)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect()
    const { id } = await params
    const participant = await Participant.findById(id, { agentToken: 0 })
    if (!participant) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({ participant })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH — update own profile (requires auth, must be own participant)
export async function PATCH(
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
    if (agent.participantId.toString() !== id) {
      return NextResponse.json(
        { error: 'Forbidden — you can only update your own profile' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const updated = await Participant.findByIdAndUpdate(
      id,
      {
        ...(body.name && { name: body.name }),
        ...(body.city && { city: body.city }),
        ...(body.preferredContact && { preferredContact: body.preferredContact }),
        ...(body.contactHandle !== undefined && { contactHandle: body.contactHandle }),
        ...(body.availability && { availability: body.availability }),
        ...(body.vibePreferences && { vibePreferences: body.vibePreferences }),
      },
      { new: true, runValidators: false, projection: { agentToken: 0 } }
    )

    if (!updated) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Trigger auto-matching
    const allParticipants = await Participant.find()
    const group = await autoJoinGroup(updated, allParticipants)

    // Auto-create system message when group first becomes ready
    if (group && group.status === 'ready_for_venue_search') {
      const existing = await GroupMessage.findOne({ groupId: group._id, type: 'system' })
      if (!existing) {
        const timeStr = group.selectedTime
          ? `${group.selectedTime.day} at ${group.selectedTime.time}`
          : 'a time TBD'
        await GroupMessage.create({
          groupId: group._id,
          participantId: null,
          participantName: 'System',
          type: 'system',
          message: `Group formed! ${group.participantNames[0]} will coordinate the venue for ${timeStr}. Watch this chat for updates and RSVP when the location is confirmed.`,
        })
      }
    }

    return NextResponse.json({
      participant: updated,
      groupUpdate: group
        ? {
            groupId: group._id,
            status: group.status,
            memberCount: group.participantIds.length,
            selectedTime: group.selectedTime,
            message:
              group.status === 'ready_for_venue_search'
                ? 'Group is ready! Check GET /api/groups/' + group._id + '/venue-task'
                : 'Added to group — more members needed.',
          }
        : null,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
