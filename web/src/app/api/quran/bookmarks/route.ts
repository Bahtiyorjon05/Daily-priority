import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { QURAN_PAGES, surahByNumber } from '@/lib/quran/surahs'

/**
 * Saved verses.
 *
 * The bookmark icon on each ayah used to write to the reading POSITION — one
 * moving pointer — so tapping it replaced the previous one, changed nothing on
 * screen, and left no way to see what you had saved. It read as a broken button
 * because the only thing it did was invisible.
 *
 * These are a set, not a pointer: many verses, each removable, each openable at
 * the exact chunk it lives on. The reading position stays where it was and keeps
 * doing its own job.
 */

/** One person is not going to curate ten thousand verses, and a runaway client
 *  should not be able to fill a table. */
const MAX_BOOKMARKS = 500

type Parsed =
  | { ok: true; surah: number; ayah: number; page: number }
  | { ok: false; error: string }

/**
 * Validate against the bundled surah data.
 *
 * The ayah bound comes from the same list the reader renders from, so a bad
 * client cannot store a verse that will never resolve to anything on reopen.
 */
function parse(body: Record<string, unknown>): Parsed {
  const surahNumber = Math.trunc(Number(body.surah))
  const ayah = Math.trunc(Number(body.ayah))
  const page = Math.trunc(Number(body.page ?? 1))

  const surah = surahByNumber(surahNumber)
  if (!surah) return { ok: false, error: 'No such surah' }
  if (!Number.isFinite(ayah) || ayah < 1 || ayah > surah.ayahs) {
    return { ok: false, error: 'Ayah out of range' }
  }
  if (!Number.isFinite(page) || page < 1 || page > QURAN_PAGES) {
    return { ok: false, error: 'Page out of range' }
  }
  return { ok: true, surah: surahNumber, ayah, page }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const bookmarks = await prisma.quranBookmark.findMany({
      where: { userId: session.user.id },
      select: { surah: true, ayah: true, page: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: MAX_BOOKMARKS,
    })

    return NextResponse.json({ success: true, data: bookmarks })
  } catch (error) {
    console.error('[quran] bookmark read failed', error)
    return NextResponse.json({ error: 'Failed to load bookmarks' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id

    const body = await request.json().catch(() => ({}))
    const parsed = parse(body)
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }

    /*
      Toggle, because the icon is a toggle.

      A separate DELETE would mean the client has to know which state it is in
      before it can act, and a stale list would then either double-save or fail
      to remove. The server owns the answer and returns it.
    */
    const existing = await prisma.quranBookmark.findUnique({
      where: {
        userId_surah_ayah: { userId, surah: parsed.surah, ayah: parsed.ayah },
      },
      select: { id: true },
    })

    if (existing) {
      await prisma.quranBookmark.delete({ where: { id: existing.id } })
      return NextResponse.json({ success: true, saved: false })
    }

    const count = await prisma.quranBookmark.count({ where: { userId } })
    if (count >= MAX_BOOKMARKS) {
      return NextResponse.json({ error: 'Too many bookmarks' }, { status: 409 })
    }

    await prisma.quranBookmark.create({
      data: { userId, surah: parsed.surah, ayah: parsed.ayah, page: parsed.page },
    })
    return NextResponse.json({ success: true, saved: true })
  } catch (error) {
    console.error('[quran] bookmark write failed', error)
    return NextResponse.json({ error: 'Failed to save bookmark' }, { status: 500 })
  }
}
