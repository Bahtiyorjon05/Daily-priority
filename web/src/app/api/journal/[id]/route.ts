import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    // Verify entry belongs to user
    const existingEntry = await prisma.journalEntry.findUnique({
      where: { id },
    })

    if (!existingEntry || existingEntry.userId !== session.user.id) {
      return NextResponse.json({ error: 'Journal entry not found' }, { status: 404 })
    }

    await prisma.journalEntry.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Journal entry deleted successfully' })
  } catch (error: any) {
    console.error('Delete journal entry error:', error)
    return NextResponse.json(
      { error: 'Failed to delete journal entry', details: error.message },
      { status: 500 }
    )
  }
}
