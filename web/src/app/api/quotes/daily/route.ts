import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Cache quotes per user per day
const quoteCache = new Map<string, { quote: any; date: string }>()

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    // Get user's timezone (default to UTC if not set)
    let userTimezone = 'UTC'
    if (session?.user?.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { timezone: true }
      })
      userTimezone = user?.timezone || 'UTC'
    }

    // Get current date in user's timezone
    const now = new Date()
    const userDate = new Date(now.toLocaleString('en-US', { timeZone: userTimezone }))
    
    // Create a date string in user's timezone (YYYY-MM-DD)
    const userDateString = userDate.toISOString().split('T')[0]
    
    // Check cache for this user's quote today
    const cacheKey = `${session?.user?.id || 'anonymous'}-${userDateString}`
    const cachedQuote = quoteCache.get(cacheKey)
    if (cachedQuote && cachedQuote.date === userDateString) {
      return NextResponse.json({ quote: cachedQuote.quote })
    }

    // Calculate day of year based on user's timezone
    const startOfYear = new Date(userDate.getFullYear(), 0, 0)
    const diff = userDate.getTime() - startOfYear.getTime()
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24))

    const quotes = await prisma.islamicQuote.findMany()

    if (quotes.length === 0) {
      const fallbackQuote = {
        text: 'Verily, with hardship comes ease.',
        source: 'Quran 94:6',
        category: 'PATIENCE'
      };
      
      // Cache the fallback quote for this user for this day
      quoteCache.set(cacheKey, { quote: fallbackQuote, date: userDateString })
      
      return NextResponse.json({ quote: fallbackQuote })
    }

    // Use day of year to pick a consistent quote for today
    const quoteIndex = dayOfYear % quotes.length
    const quote = quotes[quoteIndex]

    // Cache the quote for this user for this day
    quoteCache.set(cacheKey, { quote, date: userDateString })
    
    // Clean up old cache entries (keep only last 7 days)
    if (quoteCache.size > 100) {
      const keysToDelete: string[] = []
      for (const [key, value] of quoteCache.entries()) {
        const cacheDate = new Date(value.date)
        const daysDiff = Math.floor((userDate.getTime() - cacheDate.getTime()) / (1000 * 60 * 60 * 24))
        if (daysDiff > 7) {
          keysToDelete.push(key)
        }
      }
      keysToDelete.forEach(key => quoteCache.delete(key))
    }

    return NextResponse.json({ quote })
  } catch (error: any) {
    console.error('Get daily quote error:', error)
    // Return fallback quote on error
    return NextResponse.json({
      quote: {
        text: 'And Allah is with those who are patient.',
        source: 'Quran 2:153',
        category: 'PATIENCE'
      },
      fallback: true,
      error: error.message
    })
  }
}
