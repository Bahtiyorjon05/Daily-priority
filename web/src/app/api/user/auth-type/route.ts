import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * Get user's authentication type
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Return the authentication type from session
    return NextResponse.json({ 
      authType: session.user.email ? 'credentials' : 'oauth',
      provider: session.user.image ? 'google' : 'credentials'
    })
  } catch (error) {
    console.error('Error getting auth type:', error)
    return NextResponse.json(
      { error: 'Failed to get authentication type' },
      { status: 500 }
    )
  }
}
