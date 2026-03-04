import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Participant from '@/lib/models/Participant'
import { getAgentFromRequest } from '@/lib/utils/auth'

// GET — list all participants (public read, or filtered for agents)
export async function GET(req: NextRequest) {
  try {
    await dbConnect()
    const participants = await Participant.find({}, { agentToken: 0 }).sort({
      createdAt: -1,
    })
    return NextResponse.json({ participants })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST — (alias) register/update own profile using bearer token
export async function POST(req: NextRequest) {
  try {
    await dbConnect()
    const agent = await getAgentFromRequest(req)
    if (!agent) {
      return NextResponse.json({ error: 'Unauthorized. Include Authorization: Bearer <token>' }, { status: 401 })
    }

    const body = await req.json()
    const updated = await Participant.findByIdAndUpdate(
      agent.participantId,
      {
        ...(body.name && { name: body.name }),
        ...(body.preferredContact && { preferredContact: body.preferredContact }),
        ...(body.contactHandle !== undefined && { contactHandle: body.contactHandle }),
        ...(body.availability && { availability: body.availability }),
        ...(body.vibePreferences && { vibePreferences: body.vibePreferences }),
      },
      { new: true, runValidators: true, projection: { agentToken: 0 } }
    )

    return NextResponse.json({ participant: updated })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
