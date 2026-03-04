import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Message from '@/lib/models/Message'
import Conversation from '@/lib/models/Conversation'
import Participant from '@/lib/models/Participant'
import { getAgentFromRequest } from '@/lib/utils/auth'

// GET — all messages in a conversation (public)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect()
    const { id } = await params
    const messages = await Message.find({ conversationId: id }).sort({
      timestamp: 1,
    })
    return NextResponse.json({ messages })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST — send a message (requires auth, must be participant in conversation)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect()
    const agent = await getAgentFromRequest(req)
    if (!agent) {
      return NextResponse.json({ error: 'Unauthorized. Include Authorization: Bearer <token>' }, { status: 401 })
    }

    const { id } = await params
    const conversation = await Conversation.findById(id)
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const agentIdStr = agent._id.toString()
    if (!conversation.agentIds.map((a: { toString(): string }) => a.toString()).includes(agentIdStr)) {
      return NextResponse.json(
        { error: 'You are not a participant in this conversation' },
        { status: 403 }
      )
    }

    if (conversation.status !== 'active') {
      return NextResponse.json(
        { error: 'Conversation is no longer active' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const { content } = body
    if (!content?.trim()) {
      return NextResponse.json({ error: 'content is required' }, { status: 400 })
    }

    const participant = await Participant.findById(agent.participantId)

    const message = await Message.create({
      conversationId: id,
      fromAgentId: agent._id,
      fromParticipantName: participant?.name ?? 'Unknown',
      content: content.trim(),
    })

    return NextResponse.json({ message }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
