import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import CompatibilityReport from '@/lib/models/CompatibilityReport'
import Conversation from '@/lib/models/Conversation'
import Participant from '@/lib/models/Participant'
import Agent from '@/lib/models/Agent'
import { getAgentFromRequest } from '@/lib/utils/auth'
import { generateMatches } from '@/lib/utils/matching'
import HappyHourGroup from '@/lib/models/HappyHourGroup'

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
      return NextResponse.json({ error: 'Unauthorized. Include Authorization: Bearer <token>' }, { status: 401 })
    }

    const body = await req.json()
    const { toParticipantId, conversationId, scores, suggestedTimes, notes } = body

    if (!toParticipantId || !conversationId || !scores) {
      return NextResponse.json(
        { error: 'toParticipantId, conversationId, and scores are required' },
        { status: 400 }
      )
    }

    const myParticipantId = agent.participantId.toString()

    // Calculate weighted overall score
    const overallScore =
      (scores.scheduleOverlap ?? 0) * 0.4 +
      (scores.vibeCompatibility ?? 0) * 0.25 +
      (scores.drinkCompatibility ?? 0) * 0.15 +
      (scores.budgetCompatibility ?? 0) * 0.1 +
      (scores.groupSizeCompatibility ?? 0) * 0.1

    const myParticipant = await Participant.findById(myParticipantId)
    const toParticipant = await Participant.findById(toParticipantId)

    if (!toParticipant) {
      return NextResponse.json({ error: 'Target participant not found' }, { status: 404 })
    }

    const report = await CompatibilityReport.create({
      fromParticipantId: myParticipantId,
      fromParticipantName: myParticipant?.name ?? 'Unknown',
      toParticipantId,
      toParticipantName: toParticipant.name,
      conversationId,
      scores,
      overallScore: Math.round(overallScore * 10) / 10,
      suggestedTimes: suggestedTimes ?? [],
      notes: notes ?? '',
    })

    // Mark conversation as completed and update agent
    await Conversation.findByIdAndUpdate(conversationId, {
      status: 'completed',
      completedAt: new Date(),
    })

    await Agent.findByIdAndUpdate(agent._id, {
      $inc: { conversationsCompleted: 1 },
      status: 'idle',
    })

    // Auto-generate groups after every report
    const [allParticipants, allReports] = await Promise.all([
      Participant.find(),
      CompatibilityReport.find(),
    ])
    const matches = generateMatches(allParticipants, allReports)
    await HappyHourGroup.deleteMany({})
    if (matches.length > 0) await HappyHourGroup.insertMany(matches)

    return NextResponse.json({ report }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
