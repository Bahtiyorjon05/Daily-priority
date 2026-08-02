import { NextRequest, NextResponse } from 'next/server'
import { ADHKAR_LIST } from '../data'

// GET /api/adhkar/list - Get adhkar list by category
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    // Static reference content (no user data) — safe to cache hard at the edge.
    const headers = { 'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800' }

    if (category && ADHKAR_LIST[category as keyof typeof ADHKAR_LIST]) {
      return NextResponse.json({
        category,
        adhkar: ADHKAR_LIST[category as keyof typeof ADHKAR_LIST]
      }, { headers })
    }

    // Return all categories
    return NextResponse.json({ adhkar: ADHKAR_LIST }, { headers })
  } catch (error) {
    console.error('Error fetching adhkar list:', error)
    return NextResponse.json(
      { error: 'Failed to fetch adhkar list' },
      { status: 500 }
    )
  }
}
