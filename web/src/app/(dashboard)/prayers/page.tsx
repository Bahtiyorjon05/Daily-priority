'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Moon, Sun, Clock, MapPin, Compass, Calendar as CalendarIcon, CheckCircle2, Circle } from 'lucide-react'
import { fetchPrayerTimes, getNextPrayerFromTimes, getUserLocation, getCityFromCoordinates, getQiblaDirection, type PrayerTimes } from '@/lib/prayer-times'
import { gregorianToHijri, getSpecialDay, type HijriDate, type SpecialDay } from '@/lib/hijri'

type PrayerName = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'

interface PrayerStatus {
  [key: string]: boolean
}

export default function PrayersPage() {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null)
  const [nextPrayer, setNextPrayer] = useState<{ name: string; time: string; timeUntil: string } | null>(null)
  const [location, setLocation] = useState<{ city?: string; country?: string; latitude: number; longitude: number } | null>(null)
  const [qiblaDirection, setQiblaDirection] = useState<number | null>(null)
  const [hijriDate, setHijriDate] = useState<HijriDate | null>(null)
  const [specialDay, setSpecialDay] = useState<SpecialDay | null>(null)
  const [prayerStatus, setPrayerStatus] = useState<PrayerStatus>({})
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    loadPrayerData()
    loadStoredPrayerStatus()

    // Update time every second for countdown
    const interval = setInterval(() => {
      setCurrentTime(new Date())
      if (prayerTimes) {
        const next = getNextPrayerFromTimes(prayerTimes)
        setNextPrayer(next)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (prayerTimes) {
      const next = getNextPrayerFromTimes(prayerTimes)
      setNextPrayer(next)
    }
  }, [prayerTimes])

  async function loadPrayerData() {
    try {
      setLoading(true)
      const userLocation = await getUserLocation()

      if (userLocation) {
        // Fetch city and country from coordinates (always returns a value)
        const cityData = await getCityFromCoordinates(userLocation.latitude, userLocation.longitude)

        setLocation({
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          city: cityData.city,
          country: cityData.country
        })

        const times = await fetchPrayerTimes(userLocation.latitude, userLocation.longitude)
        setPrayerTimes(times)

        const qibla = await getQiblaDirection(userLocation.latitude, userLocation.longitude)
        setQiblaDirection(qibla)

        const hijri = await gregorianToHijri(new Date())
        setHijriDate(hijri)

        const special = await getSpecialDay(new Date())
        setSpecialDay(special)
      }
    } catch (error) {
      console.error('Error loading prayer data:', error)
    } finally {
      setLoading(false)
    }
  }

  function loadStoredPrayerStatus() {
    const today = new Date().toDateString()
    const stored = localStorage.getItem('prayer-status-' + (today))
    if (stored) {
      setPrayerStatus(JSON.parse(stored))
    }
  }

  function togglePrayerStatus(prayerName: PrayerName) {
    const today = new Date().toDateString()
    const newStatus = {
      ...prayerStatus,
      [prayerName]: !prayerStatus[prayerName]
    }
    setPrayerStatus(newStatus)
    localStorage.setItem('prayer-status-' + (today), JSON.stringify(newStatus))
  }

  const prayers: { name: PrayerName; displayName: string; icon: React.ComponentType<any> }[] = [
    { name: 'fajr', displayName: 'Fajr', icon: Moon },
    { name: 'dhuhr', displayName: 'Dhuhr', icon: Sun },
    { name: 'asr', displayName: 'Asr', icon: Sun },
    { name: 'maghrib', displayName: 'Maghrib', icon: Moon },
    { name: 'isha', displayName: 'Isha', icon: Moon }
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Islamic Pattern Background */}
        <div 
          className="fixed inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: 'url(/islamic-pattern.svg)',
            backgroundSize: '400px 400px',
            backgroundRepeat: 'repeat'
          }}
        />
        <div className="fixed inset-0 bg-gradient-to-br from-emerald-50 via-transparent to-teal-50 dark:from-emerald-950 dark:via-transparent dark:to-teal-950 pointer-events-none" />
        
        <div className="relative z-10 text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center shadow-2xl animate-pulse">
            <Compass className="h-10 w-10 text-white drop-shadow-sm" />
          </div>
          <div>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <p className="text-xl font-medium text-emerald-800 dark:text-emerald-200">Loading prayer times...</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ</p>
          </div>
        </div>
      </div>
    )
  }

  if (!prayerTimes || !location) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
        {/* Islamic Pattern Background */}
        <div 
          className="fixed inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: 'url(/islamic-pattern.svg)',
            backgroundSize: '400px 400px',
            backgroundRepeat: 'repeat'
          }}
        />
        <div className="fixed inset-0 bg-gradient-to-br from-emerald-50 via-transparent to-teal-50 dark:from-emerald-950 dark:via-transparent dark:to-teal-950 pointer-events-none" />
        
        <Card className="relative z-10 max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl border border-white/20 dark:border-gray-700/40 p-8 text-center space-y-6 shadow-2xl">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center shadow-xl animate-float">
            <MapPin className="h-10 w-10 text-white drop-shadow-sm" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 bg-clip-text text-transparent mb-2 dark:from-emerald-300 dark:via-teal-300 dark:to-emerald-400">
              Location Access Required
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              Enable location access to display precise prayer times for your area.
            </p>
          </div>
          <Button 
            onClick={loadPrayerData} 
            className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 dark:from-emerald-500 dark:to-teal-500 dark:hover:from-emerald-600 dark:hover:to-teal-600"
          >
            <MapPin className="mr-2 h-5 w-5" />
            Enable Location
          </Button>
        </Card>
      </div>
    )
  }

  const completedPrayers = Object.values(prayerStatus).filter(Boolean).length

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Islamic Pattern Background */}
      <div 
        className="fixed inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: 'url(/islamic-pattern.svg)',
          backgroundSize: '400px 400px',
          backgroundRepeat: 'repeat'
        }}
      />
      
      {/* Gradient Overlays */}
      <div className="fixed inset-0 bg-gradient-to-br from-emerald-50 via-transparent to-teal-50 dark:from-emerald-950 dark:via-transparent dark:to-teal-950 pointer-events-none" />
      
      {/* Floating Orbs */}
      <div className="fixed top-20 -left-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-float pointer-events-none" />
      <div className="fixed bottom-20 -right-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-float pointer-events-none" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-white/20 dark:border-gray-700/40 p-8 shadow-2xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center shadow-xl animate-float dark:from-emerald-500 dark:to-teal-500">
              <Compass className="h-8 w-8 text-white drop-shadow-sm" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 bg-clip-text text-transparent dark:from-emerald-300 dark:via-teal-300 dark:to-emerald-400">
                Prayer Times
              </h1>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mt-1">
                <MapPin className="h-4 w-4" />
                <span className="font-medium">{location.city || 'Unknown'}, {location.country || 'Unknown'}</span>
              </div>
            </div>
          </div>
        </div>

      {/* Special Day Alert */}
      {specialDay && (
        <Card className="p-6 border-l-4 border-emerald-500 dark:border-emerald-400 bg-white dark:bg-gray-800 shadow-lg border border-white/30 dark:border-gray-700/50">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/50">
              <CalendarIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-emerald-700 dark:text-emerald-300">
                {specialDay.name}
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{specialDay.description}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Hijri Date & Next Prayer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hijri Calendar */}
        <Card className="p-6 space-y-4 bg-white dark:bg-gray-800 border border-white/30 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/50 animate-float">
              <CalendarIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">Islamic Date</p>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                {hijriDate ? (hijriDate.day) + ' ' + (hijriDate.month) + ' ' + (hijriDate.year) : 'Loading...'}
              </p>
            </div>
          </div>
        </Card>

        {/* Next Prayer Countdown */}
        <Card className="p-6 space-y-4 bg-white dark:bg-gray-800 border border-white/30 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all ring-1 ring-emerald-500/10 dark:ring-emerald-500/20">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/50 animate-pulse">
              <Clock className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">Next Prayer</p>
              {nextPrayer ? (
                <>
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{nextPrayer.name}</p>
                  <p className="text-lg text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                    {nextPrayer.timeUntil}
                  </p>
                </>
              ) : (
                <p className="text-gray-700 dark:text-gray-300">Calculating...</p>
              )}
            </div>
          </div>
        </Card>
      </div>

        {/* Progress Card */}
        <Card className="bg-white dark:bg-gray-800 rounded-2xl border border-white/30 dark:border-gray-700/50 p-6 shadow-lg">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-emerald-800 dark:text-emerald-300">Today's Progress</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">{completedPrayers} of 5 prayers</p>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-700"
                style={{ width: ((completedPrayers / 5) * 100) + '%' }}
              />
            </div>
            {completedPrayers === 5 && (
              <p className="text-center text-sm text-emerald-700 dark:text-emerald-300 font-medium">
                ✨ All prayers completed! May Allah accept your prayers.
              </p>
            )}
          </div>
        </Card>

        {/* Prayer Times Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {prayers.map((prayer, index) => {
            const Icon = prayer.icon
            const time = prayerTimes[prayer.name]
            const isCompleted = prayerStatus[prayer.name]
            const isNext = nextPrayer?.name.toLowerCase() === prayer.displayName.toLowerCase()

            return (
              <Card
                key={prayer.name}
                className={'bg-white dark:bg-gray-800 rounded-2xl border border-white/30 dark:border-gray-700/40 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer ui-element ' + (isNext ? 'ring-2 ring-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/20' : '') + ' ' + (isCompleted ? 'opacity-75' : '')}
                onClick={() => togglePrayerStatus(prayer.name)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={'w-12 h-12 rounded-xl flex items-center justify-center transition-all ' + (isCompleted
                        ? 'bg-emerald-100 dark:bg-emerald-900/50'
                        : 'bg-gradient-to-br from-emerald-600 to-teal-600 dark:from-emerald-500 dark:to-teal-500')}>
                      <Icon className={'h-6 w-6 ' + (isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-white')} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-emerald-800 dark:text-emerald-300">{prayer.displayName}</h3>
                      <p className="text-2xl font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {time}
                      </p>
                      {isNext && (
                        <p className="text-xs text-emerald-700 dark:text-emerald-500 font-medium mt-1">
                          Next Prayer
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    {isCompleted ? (
                      <div className="relative">
                        <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                        <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping opacity-75"></div>
                      </div>
                    ) : (
                      <Circle className="h-8 w-8 text-gray-500 dark:text-gray-400 hover:text-emerald-500 transition-colors" />
                    )}
                  </div>
                </div>
                {isNext && (
                  <div className="text-sm text-emerald-600 dark:text-emerald-500 font-semibold flex items-center gap-2 animate-pulse mt-3">
                    <Clock className="h-4 w-4" />
                    Up next • {nextPrayer?.timeUntil}
                  </div>
                )}
                {/* Completion indicator */}
                <div className="mt-4 pt-4 border-t border-border/50">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {isCompleted ? 'Completed' : 'Mark as completed'}
                    </span>
                    <div className={`w-3 h-3 rounded-full transition-all duration-300 ${isCompleted ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                  </div>
                </div>
              </Card>
          )
        })}
      </div>

      {/* Qibla Direction */}
      <Card className="p-6 space-y-4 bg-white dark:bg-gray-800 border border-white/30 dark:border-gray-700/50 shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/50">
              <Compass className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">Qibla Direction</p>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                {qiblaDirection !== null ? (qiblaDirection.toFixed(2)) + '°' : 'Calculating...'}
              </p>
            </div>
          </div>
          <div className="text-sm text-gray-700 dark:text-gray-300 italic">
            From your location to Makkah 🕋
          </div>
        </div>
      </Card>

      {/* Current Time */}
      <div className="text-center py-4 bg-white dark:bg-gray-800 rounded-xl border border-white/30 dark:border-gray-700/50">
        <p className="text-sm text-gray-700 dark:text-gray-300">Local Time</p>
        <p className="text-2xl font-mono font-bold text-emerald-700 dark:text-emerald-300">
          {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </p>
      </div>
    </div>
    </div>
  )
}