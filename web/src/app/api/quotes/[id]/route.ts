import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const body = await request.json()

    const quote = await prisma.islamicQuote.update({
      where: { id },
      data: {
        text: body.text,
        source: body.source,
        category: body.category,
        author: body.author || null,
        isArabic: body.isArabic || false
      }
    })

    return NextResponse.json({ quote })
  } catch (error) {
    console.error('Update quote error:', error)
    return NextResponse.json(
      { error: 'Failed to update quote' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    await prisma.islamicQuote.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Quote deleted successfully' })
  } catch (error) {
    console.error('Delete quote error:', error)
    return NextResponse.json(
      { error: 'Failed to delete quote' },
      { status: 500 }
    )
  }
}
