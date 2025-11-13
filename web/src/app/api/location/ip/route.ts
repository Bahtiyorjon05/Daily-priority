import { NextRequest, NextResponse } from 'next/server'

/**
 * Get approximate location from IP address
 * No permission needed - useful as fallback
 */
export async function GET(request: NextRequest) {
  try {
    // Get client IP from request headers
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const clientIp = forwarded?.split(',')[0] || realIp || 'unknown'

    console.log('Getting location for IP:', clientIp)

    // Use ip-api.com (free, no API key, 45 requests/minute)
    const ipApiUrl = 'http://ip-api.com/json/' + (clientIp !== 'unknown' ? clientIp : '')

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort('IP location API timeout'), 8000)

    const response = await fetch(ipApiUrl, {
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
      // Don't cache - IP might change
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`IP API returned ${response.status}`)
    }

    const data = await response.json()

    if (data.status === 'success') {
      console.log('IP-based location:', data.city, data.country)

      return NextResponse.json({
        success: true,
        data: {
          latitude: data.lat,
          longitude: data.lon,
          city: data.city || 'Unknown',
          region: data.regionName || '',
          country: data.country || 'Unknown',
          countryCode: data.countryCode,
          timezone: data.timezone,
          isp: data.isp,
          source: 'ip-geolocation'
        }
      })
    }

    throw new Error(data.message || 'IP geolocation failed')

  } catch (error) {
    console.error('IP location error:', error)

    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { success: false, error: 'Request timeout' },
        { status: 504 }
      )
    }

    // Return a very generic fallback
    return NextResponse.json({
      success: true,
      data: {
        latitude: 0,
        longitude: 0,
        city: 'Unknown',
        region: '',
        country: 'Unknown',
        source: 'fallback',
        error: 'Could not determine location from IP'
      }
    })
  }
}
