import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Conversation from '@/lib/models/Conversation'
import Message from '@/lib/models/Message'
import CompatibilityReport from '@/lib/models/CompatibilityReport'
import HappyHourGroup from '@/lib/models/HappyHourGroup'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await dbConnect()

    const [conversations, messages, reports, groups] = await Promise.all([
      Conversation.find().sort({ startedAt: -1 }).limit(20),
      Message.find().sort({ timestamp: -1 }).limit(30),
      CompatibilityReport.find().sort({ createdAt: -1 }).limit(20),
      HappyHourGroup.find().sort({ createdAt: -1 }).limit(10),
    ])

    // Build unified activity feed
    const events: Array<{
      type: string
      timestamp: Date
      description: string
      meta: Record<string, unknown>
    }> = []

    for (const c of conversations) {
      events.push({
        type: 'conversation_started',
        timestamp: c.startedAt,
        description: `🗣️ ${c.participantNames[0]} started a conversation with ${c.participantNames[1]}`,
        meta: { conversationId: c._id, status: c.status },
      })
      if (c.status === 'completed') {
        events.push({
          type: 'conversation_completed',
          timestamp: c.completedAt ?? c.startedAt,
          description: `✅ Conversation between ${c.participantNames[0]} and ${c.participantNames[1]} completed`,
          meta: { conversationId: c._id },
        })
      }
    }

    for (const m of messages) {
      events.push({
        type: 'message_sent',
        timestamp: m.timestamp,
        description: `💬 ${m.fromParticipantName}: "${m.content.slice(0, 80)}${m.content.length > 80 ? '…' : ''}"`,
        meta: { conversationId: m.conversationId, messageId: m._id },
      })
    }

    for (const r of reports) {
      events.push({
        type: 'report_submitted',
        timestamp: r.createdAt,
        description: `📋 ${r.fromParticipantName} rated ${r.toParticipantName} — overall score: ${r.overallScore}/10`,
        meta: { reportId: r._id, score: r.overallScore },
      })
    }

    for (const g of groups) {
      events.push({
        type: 'group_matched',
        timestamp: g.createdAt,
        description: `🍻 New happy hour group: ${g.participantNames.join(', ')} — avg score ${g.averageCompatibilityScore}/10`,
        meta: { groupId: g._id, participantNames: g.participantNames },
      })
    }

    // Sort by timestamp descending
    events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    return NextResponse.json({
      events: events.slice(0, 50),
      stats: {
        participants: await (await import('@/lib/models/Participant')).default.countDocuments(),
        activeConversations: conversations.filter((c) => c.status === 'active').length,
        completedConversations: conversations.filter((c) => c.status === 'completed').length,
        groups: groups.length,
      },
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
