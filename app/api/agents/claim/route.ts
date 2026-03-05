import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import dbConnect from '@/lib/db'
import Participant from '@/lib/models/Participant'
import Agent from '@/lib/models/Agent'

export async function POST(req: NextRequest) {
  try {
    await dbConnect()
    const body = await req.json()
    const { name, email } = body

    if (!name || !email) {
      return NextResponse.json(
        { error: 'name and email are required' },
        { status: 400 }
      )
    }

    // Check if participant already exists
    const existing = await Participant.findOne({ email })
    if (existing) {
      const agent = await Agent.findOne({ participantId: existing._id })
      return NextResponse.json({
        token: existing.agentToken,
        participantId: existing._id,
        agentId: agent?._id,
        message: 'Existing participant found — use your token to update your profile.',
      })
    }

    const token = nanoid(32)

    const participant = await Participant.create({
      name,
      email,
      agentToken: token,
      vibePreferences: {
        venueTypes: [],
        drinkTypes: [],
        budgetRange: '$$',
        groupSizePreference: 'medium',
      },
      availability: [],
    })

    const agent = await Agent.create({
      participantId: participant._id,
      token,
    })

    return NextResponse.json({
      token,
      participantId: participant._id,
      agentId: agent._id,
      message:
        'Token claimed! Use this token as your Bearer token. Next: PATCH /api/participants/' +
        participant._id +
        ' to set your full profile.',
    })
  } catch (err) {
    console.error(err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
