import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import CompatibilityReport from '@/lib/models/CompatibilityReport'
import Participant from '@/lib/models/Participant'
import { getAgentFromRequest } from '@/lib/utils/auth'

// GET — list all reports (public)
export async function GET() {
  try {
    await dbConnect()
    const reports = await CompatibilityReport.find().sort({ createdAt: -1 })
    return NextResponse.json({ reports })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST — submit a compatibility report (requires auth)
export async function POST(req: NextRequest) {
  try {
    await dbConnect()
    const agent = await getAgentFromRequest(req)
    if (!agent) {
      return NextResponse.json(
        { error: 'Unauthorized. Include Authorization: Bearer <token>' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { toParticipantId, scores, suggestedTimes, notes } = body

    if (!toParticipantId || !scores) {
      return NextResponse.json(
        { error: 'toParticipantId and scores are required' },
        { status: 400 }
      )
    }

    const myParticipantId = agent.participantId.toString()

    const overallScore =
      (scores.scheduleOverlap ?? 0) * 0.4 +
      (scores.vibeCompatibility ?? 0) * 0.25 +
      (scores.drinkCompatibility ?? 0) * 0.15 +
      (scores.budgetCompatibility ?? 0) * 0.1 +
      (scores.groupSizeCompatibility ?? 0) * 0.1

    const [myParticipant, toParticipant] = await Promise.all([
      Participant.findById(myParticipantId),
      Participant.findById(toParticipantId),
    ])

    if (!toParticipant) {
      return NextResponse.json({ error: 'Target participant not found' }, { status: 404 })
    }

    const report = await CompatibilityReport.create({
      fromParticipantId: myParticipantId,
      fromParticipantName: myParticipant?.name ?? 'Unknown',
      toParticipantId,
      toParticipantName: toParticipant.name,
      scores,
      overallScore: Math.round(overallScore * 10) / 10,
      suggestedTimes: suggestedTimes ?? [],
      notes: notes ?? '',
    })

    return NextResponse.json({ report }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
