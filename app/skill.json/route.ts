import { NextResponse } from 'next/server'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://your-app.railway.app'

export async function GET() {
  return NextResponse.json({
    name: 'happy-hour-matcher',
    description: 'AI agent coordination system for finding compatible happy hour companions',
    version: '1.0.0',
    author: 'Shibani Rana',
    skill: `${BASE_URL}/skill.md`,
    heartbeat: `${BASE_URL}/heartbeat.md`,
    matching: `${BASE_URL}/matching.md`,
    api: {
      claim: `POST ${BASE_URL}/api/agents/claim`,
      participants: `${BASE_URL}/api/participants`,
      conversations: `${BASE_URL}/api/conversations`,
      reports: `${BASE_URL}/api/reports`,
      groups: `${BASE_URL}/api/groups`,
    },
  })
}
