import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import HappyHourGroup from '@/lib/models/HappyHourGroup'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect()
    const { id } = await params
    const group = await HappyHourGroup.findById(id)
    if (!group) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({ group })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
