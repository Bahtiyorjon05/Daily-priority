import { NextRequest, NextResponse } from 'next/server'

/**
 * Server-side geocoding API (reverse geocoding)
 * Converts coordinates to city/country names
 * Bypasses CORS by calling from server
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = searchParams.get('lat')
    const lon = searchParams.get('lon')

    if (!lat || !lon) {
      return NextResponse.json(
        { success: false, error: 'Latitude and longitude are required' },
        { status: 400 }
      )
    }

    const latitude = parseFloat(lat)
    const longitude = parseFloat(lon)

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { success: false, error: 'Invalid coordinates' },
        { status: 400 }
      )
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json(
        { success: false, error: 'Coordinates out of range' },
        { status: 400 }
      )
    }

    // Try OpenStreetMap Nominatim (most accurate, free)
    try {
      const osmUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`

      console.log('Geocoding with Nominatim:', osmUrl)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort('Nominatim geocoding timeout'), 8000)

      const osmResponse = await fetch(osmUrl, {
        headers: {
          'User-Agent': 'DailyPriority/1.0 (Islamic Productivity App)',
          'Accept': 'application/json',
        },
        signal: controller.signal,
        next: { revalidate: 2592000 }, // Cache for 30 days
      })

      clearTimeout(timeoutId)

      if (osmResponse.ok) {
        const osmData = await osmResponse.json()
        const address = osmData.address

        if (address) {
          const city =
            address.city ||
            address.town ||
            address.village ||
            address.municipality ||
            address.suburb ||
            address.county ||
            'Unknown'

          const region =
            address.state ||
            address.province ||
            address.region ||
            ''

          const country = address.country || 'Unknown'

          console.log('Nominatim geocoding success:', { city, region, country })

          return NextResponse.json({
            success: true,
            data: {
              city,
              region,
              country,
              displayName: osmData.display_name,
              source: 'nominatim'
            }
          })
        }
      }
    } catch (nominatimError) {
      console.warn('Nominatim failed, trying fallback:', nominatimError)
    }

    // Fallback to BigDataCloud (free, no API key)
    try {
      const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`

      console.log('Geocoding with BigDataCloud fallback')

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort('BigDataCloud geocoding timeout'), 8000)

      const bdcResponse = await fetch(bdcUrl, {
        signal: controller.signal,
        next: { revalidate: 2592000 },
      })

      clearTimeout(timeoutId)

      if (bdcResponse.ok) {
        const bdcData = await bdcResponse.json()

        const city = bdcData.city || bdcData.locality || bdcData.principalSubdivision || 'Unknown'
        const region = bdcData.principalSubdivision || ''
        const country = bdcData.countryName || 'Unknown'

        console.log('BigDataCloud geocoding success:', { city, region, country })

        return NextResponse.json({
          success: true,
          data: {
            city,
            region,
            country,
            displayName: `${city}, ${country}`,
            source: 'bigdatacloud'
          }
        })
      }
    } catch (bdcError) {
      console.warn('BigDataCloud also failed:', bdcError)
    }

    // Final fallback - just return coordinates
    return NextResponse.json({
      success: true,
      data: {
        city: `Location`,
        region: '',
        country: `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`,
        displayName: `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`,
        source: 'coordinates'
      }
    })

  } catch (error) {
    console.error('Geocoding error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Geocoding failed'
      },
      { status: 500 }
    )
  }
}
