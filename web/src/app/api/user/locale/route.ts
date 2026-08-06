import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, isLocale } from '@/lib/i18n/locales'

/**
 * Persist a language choice.
 *
 * The cookie is set here as well as in the browser so the *server* render after
 * a switch is already correct, and so the choice survives on clients where the
 * document write didn't land.
 *
 * A signed-out visitor gets the cookie and a 200 rather than a 401: they made a
 * real choice, and the only thing we can't do is attach it to an account.
 */
export async function PATCH(request: NextRequest) {
  let locale: unknown
  try {
    locale = (await request.json())?.locale
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!isLocale(locale)) {
    return NextResponse.json({ error: 'Unsupported locale' }, { status: 400 })
  }

  const response = NextResponse.json({ locale, persisted: false })
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: '/',
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: 'lax',
  })

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return response

  try {
    await prisma.userPreference.upsert({
      where: { userId: session.user.id },
      update: { language: locale },
      create: { userId: session.user.id, language: locale },
    })
    return NextResponse.json({ locale, persisted: true }, { headers: response.headers })
  } catch {
    // The cookie already carries the choice, so a write failure is not worth
    // surfacing as an error the user has to act on.
    return response
  }
}
