import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Participant from '@/lib/models/Participant'
import CompatibilityReport from '@/lib/models/CompatibilityReport'
import HappyHourGroup from '@/lib/models/HappyHourGroup'
import { getAgentFromRequest } from '@/lib/utils/auth'
import { generateMatches } from '@/lib/utils/matching'

export async function POST(req: NextRequest) {
  try {
    await dbConnect()
    const agent = await getAgentFromRequest(req)
    if (!agent) {
      return NextResponse.json({ error: 'Unauthorized. Include Authorization: Bearer <token>' }, { status: 401 })
    }

    const participants = await Participant.find()
    const reports = await CompatibilityReport.find()

    if (reports.length === 0) {
      return NextResponse.json(
        { error: 'No compatibility reports yet. Have agents complete conversations first.' },
        { status: 400 }
      )
    }

    // Clear old groups and generate fresh ones
    await HappyHourGroup.deleteMany({})

    const matches = generateMatches(participants, reports)

    const groups = await HappyHourGroup.insertMany(
      matches.map((m) => ({
        participantIds: m.participantIds,
        participantNames: m.participantNames,
        suggestedTimes: m.suggestedTimes,
        vibeProfile: m.vibeProfile,
        averageCompatibilityScore: m.averageCompatibilityScore,
      }))
    )

    return NextResponse.json({
      groups,
      message: `Generated ${groups.length} happy hour group(s)`,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
