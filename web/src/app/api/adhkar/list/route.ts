import { NextRequest, NextResponse } from 'next/server'
import { ADHKAR_LIST } from '../data'

// GET /api/adhkar/list - Get adhkar list by category
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    if (category && ADHKAR_LIST[category as keyof typeof ADHKAR_LIST]) {
      return NextResponse.json({
        category,
        adhkar: ADHKAR_LIST[category as keyof typeof ADHKAR_LIST]
      })
    }

    // Return all categories
    return NextResponse.json({ adhkar: ADHKAR_LIST })
  } catch (error) {
    console.error('Error fetching adhkar list:', error)
    return NextResponse.json(
      { error: 'Failed to fetch adhkar list' },
      { status: 500 }
    )
  }
}
