import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Conversation from '@/lib/models/Conversation'
import Participant from '@/lib/models/Participant'
import Agent from '@/lib/models/Agent'
import { getAgentFromRequest } from '@/lib/utils/auth'

// GET — list conversations (public)
export async function GET(req: NextRequest) {
  try {
    await dbConnect()
    const { searchParams } = new URL(req.url)
    const mine = searchParams.get('mine')

    let query = {}
    if (mine === 'true') {
      const agent = await getAgentFromRequest(req)
      if (!agent) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      query = { agentIds: agent._id }
    }

    const conversations = await Conversation.find(query).sort({ startedAt: -1 })
    return NextResponse.json({ conversations })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST — start a new conversation (requires auth)
export async function POST(req: NextRequest) {
  try {
    await dbConnect()
    const agent = await getAgentFromRequest(req)
    if (!agent) {
      return NextResponse.json({ error: 'Unauthorized. Include Authorization: Bearer <token>' }, { status: 401 })
    }

    const body = await req.json()
    const { targetParticipantId } = body

    if (!targetParticipantId) {
      return NextResponse.json(
        { error: 'targetParticipantId is required' },
        { status: 400 }
      )
    }

    const myParticipantId = agent.participantId.toString()
    if (myParticipantId === targetParticipantId) {
      return NextResponse.json(
        { error: 'Cannot start a conversation with yourself' },
        { status: 400 }
      )
    }

    // Check for existing active conversation between these two
    const existing = await Conversation.findOne({
      participantIds: { $all: [myParticipantId, targetParticipantId] },
      status: 'active',
    })
    if (existing) {
      return NextResponse.json(
        { error: 'Active conversation already exists', conversation: existing },
        { status: 409 }
      )
    }

    const targetParticipant = await Participant.findById(targetParticipantId)
    if (!targetParticipant) {
      return NextResponse.json({ error: 'Target participant not found' }, { status: 404 })
    }

    const myParticipant = await Participant.findById(myParticipantId)
    const targetAgent = await Agent.findOne({ participantId: targetParticipantId })

    if (!targetAgent) {
      return NextResponse.json({ error: 'Target agent not found' }, { status: 404 })
    }

    // Update agent statuses
    await Agent.updateMany(
      { _id: { $in: [agent._id, targetAgent._id] } },
      { status: 'conversing' }
    )

    const conversation = await Conversation.create({
      participantIds: [myParticipantId, targetParticipantId],
      agentIds: [agent._id, targetAgent._id],
      participantNames: [myParticipant?.name ?? 'Unknown', targetParticipant.name],
    })

    return NextResponse.json({ conversation }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
