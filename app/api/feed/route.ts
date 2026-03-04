import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import CompatibilityReport from '@/lib/models/CompatibilityReport'
import HappyHourGroup from '@/lib/models/HappyHourGroup'
import Participant from '@/lib/models/Participant'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await dbConnect()

    const [reports, groups, participantCount] = await Promise.all([
      CompatibilityReport.find().sort({ createdAt: -1 }).limit(20),
      HappyHourGroup.find().sort({ createdAt: -1 }).limit(20),
      Participant.countDocuments(),
    ])

    const events: Array<{
      type: string
      timestamp: Date
      description: string
      meta: Record<string, unknown>
    }> = []

    for (const r of reports) {
      events.push({
        type: 'profile_matched',
        timestamp: r.createdAt,
        description: `🤝 ${r.fromParticipantName} matched with ${r.toParticipantName} — compatibility score: ${r.overallScore}/10`,
        meta: { reportId: r._id, score: r.overallScore },
      })
    }

    for (const g of groups) {
      events.push({
        type: 'group_formed',
        timestamp: g.createdAt,
        description: `🍻 Group formed in ${g.city}: ${g.participantNames.join(', ')} — ${g.selectedTime ? g.selectedTime.day + ' @ ' + g.selectedTime.time : 'time TBD'}`,
        meta: { groupId: g._id, city: g.city, status: g.status },
      })

      if (g.status === 'ready_for_venue_search') {
        events.push({
          type: 'venue_search_started',
          timestamp: g.createdAt,
          description: `🔍 ${g.participantNames[0]}'s agent is searching for a happy hour venue in ${g.city}`,
          meta: { groupId: g._id },
        })
      }

      if (g.status === 'venue_found' && g.venue) {
        events.push({
          type: 'venue_found',
          timestamp: g.createdAt,
          description: `📍 Venue found for ${g.city} group: ${g.venue.name} at ${g.venue.address} — submitted by ${g.venue.submittedBy}`,
          meta: { groupId: g._id, venue: g.venue },
        })
      }
    }

    events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    return NextResponse.json({
      events: events.slice(0, 50),
      stats: {
        participants: participantCount,
        formingGroups: groups.filter((g) => g.status === 'forming').length,
        readyGroups: groups.filter((g) => g.status === 'ready_for_venue_search').length,
        completedGroups: groups.filter((g) => g.status === 'venue_found').length,
      },
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
