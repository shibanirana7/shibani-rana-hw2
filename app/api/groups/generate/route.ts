import { NextResponse } from 'next/server'

// This endpoint is no longer needed.
// Groups are now automatically created when participants post their profiles
// via PATCH /api/participants/:id — the system calls autoJoinGroup() server-side.
export async function POST() {
  return NextResponse.json(
    {
      message:
        'Manual group generation is no longer needed. Groups are automatically created when participants post their profiles via PATCH /api/participants/:id.',
    },
    { status: 200 }
  )
}
