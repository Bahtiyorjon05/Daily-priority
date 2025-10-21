import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

let cachedQuote: { quote: any; timestamp: number } | null = null
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export async function GET() {
  try {
    // Check if we have a cached quote that's still valid
    const now = Date.now()
    if (cachedQuote && now - cachedQuote.timestamp < CACHE_DURATION) {
      return NextResponse.json({ quote: cachedQuote.quote })
    }

    // Get quote of the day (based on day of year)
    const today = new Date()
    const startOfYear = new Date(today.getFullYear(), 0, 0)
    const diff = today.getTime() - startOfYear.getTime()
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24))

    const quotes = await prisma.islamicQuote.findMany()

    if (quotes.length === 0) {
      const fallbackQuote = {
        text: 'Verily, with hardship comes ease.',
        source: 'Quran 94:6',
        category: 'PATIENCE'
      };
      
      // Cache the fallback quote
      cachedQuote = { quote: fallbackQuote, timestamp: now };
      
      return NextResponse.json({ quote: fallbackQuote })
    }

    // Use day of year to pick a consistent quote for today
    const quoteIndex = dayOfYear % quotes.length
    const quote = quotes[quoteIndex]

    // Cache the quote
    cachedQuote = { quote, timestamp: now };

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
