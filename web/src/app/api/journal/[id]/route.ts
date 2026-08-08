import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sanitizeText, sanitizeString, sanitizeEnum, sanitizeDate } from '@/lib/sanitize'

/** Kept in step with POST /api/journal — the same set the create form writes. */
const MOODS = ['happy', 'grateful', 'peaceful', 'neutral', 'sad'] as const

/**
 * Edit an entry.
 *
 * This route previously had DELETE only, so a journal entry could be written and
 * thrown away but never corrected — the one kind of content in the app where
 * getting a word wrong actually matters, since people reread it.
 *
 * Validation deliberately mirrors POST rather than trusting the client: the
 * create path sanitises every field and constrains `mood` to a fixed set, and an
 * update path that skipped that would be a way around it.
 *
 * Fields absent from the body are left untouched, so a partial save cannot blank
 * the rest of the entry.
 */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    const existing = await prisma.journalEntry.findUnique({ where: { id } })
    // Same 404 whether it is missing or someone else's — a 403 here would
    // confirm that an id exists.
    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Journal entry not found' }, { status: 404 })
    }

    let body: Record<string, unknown>
    try {
      body = (await request.json()) ?? {}
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const data: Record<string, unknown> = {}
    const textFields = [
      'gratitude1',
      'gratitude2',
      'gratitude3',
      'goodDeeds',
      'lessons',
      'duas',
      'reflection',
    ] as const

    for (const field of textFields) {
      if (field in body) {
        const clean = sanitizeText(body[field] as string)
        // Empty means "cleared", which is a legitimate edit — hence null rather
        // than skipping the field.
        data[field] = clean || null
      }
    }

    if ('hijriDate' in body) {
      data.hijriDate = sanitizeString(body.hijriDate as string) || null
    }

    if ('mood' in body) {
      const mood = sanitizeEnum(body.mood as string, MOODS)
      if (!mood) {
        return NextResponse.json({ error: 'Invalid mood' }, { status: 400 })
      }
      data.mood = mood
    }

    if ('date' in body) {
      const date = sanitizeDate(body.date as string)
      if (!date) {
        return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
      }
      data.date = date
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    const entry = await prisma.journalEntry.update({ where: { id }, data })
    return NextResponse.json({ entry })
  } catch (error) {
    console.error('Update journal entry error:', error)
    return NextResponse.json({ error: 'Failed to update journal entry' }, { status: 500 })
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
