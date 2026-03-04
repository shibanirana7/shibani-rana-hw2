import { NextRequest } from 'next/server'
import dbConnect from '@/lib/db'
import Agent, { IAgent } from '@/lib/models/Agent'

export async function getAgentFromRequest(req: NextRequest): Promise<IAgent | null> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.slice(7).trim()
  if (!token) return null

  await dbConnect()
  const agent = await Agent.findOne({ token })
  if (agent) {
    agent.lastSeen = new Date()
    await agent.save()
  }
  return agent
}
