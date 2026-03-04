import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Conversation from '@/lib/models/Conversation'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect()
    const { id } = await params
    const conversation = await Conversation.findById(id)
    if (!conversation) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({ conversation })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
