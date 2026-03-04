import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import HappyHourGroup from '@/lib/models/HappyHourGroup'

export async function GET() {
  try {
    await dbConnect()
    const groups = await HappyHourGroup.find().sort({ averageCompatibilityScore: -1 })
    return NextResponse.json({ groups })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
