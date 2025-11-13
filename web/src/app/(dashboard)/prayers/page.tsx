'use client'



import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Card } from '@/components/ui/card'

import { Button } from '@/components/ui/button'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { Moon, Sun, Clock, MapPin, Compass, Calendar as CalendarIcon, CheckCircle2, Circle, BarChart3, History, RefreshCw } from 'lucide-react'
import {
  fetchPrayerTimes,
  getNextPrayerFromTimes,
  getQiblaDirection,
  getStoredPrayerTimes,
  savePrayerTimes,
  type PrayerTimes,
} from '@/lib/prayer-times'
import {
  getUserLocation,
  requestGPSLocation,
  formatLocationForDisplay,
  hasLocationChanged,
  type UnifiedLocation,
} from '@/lib/location-service'
import { gregorianToHijri, getSpecialDay, type HijriDate, type SpecialDay } from '@/lib/hijri'

import { toast } from 'sonner'

import PrayerStatistics from './components/PrayerStatistics'

import PrayerHistory from './components/PrayerHistory'

import PrayerChart from './components/PrayerChart'

import PrayerStreak from './components/PrayerStreak'

import { LoadingSpinner } from '@/components/ui/loading-spinner'



type PrayerName = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'



type PrayerLog = {

  id: string

  date: string

  prayerName: string

  completedAt: string | null

  onTime: boolean

}



type HistoryEntry = {

  date: Date

  prayers: Record<PrayerName, { completed: boolean; onTime: boolean }>

  completionRate: number

}



type ChartPoint = {

  date: string

  completion: number

  onTime: number

}



const PRAYER_SEQUENCE: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']
const LOCATION_REFRESH_INTERVAL_MS = 2 * 60 * 60 * 1000 // 2 hours
const STREAK_MILESTONES = [
  { days: 7, label: '7 day streak' },
  { days: 30, label: '30 day streak' },
  { days: 100, label: '100 day streak' }
]




interface PrayerStatus {

  [key: string]: boolean

}



export default function PrayersPage() {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null)

  const [nextPrayer, setNextPrayer] = useState<{ name: string; time: string; timeUntil: string } | null>(null)

  const [location, setLocation] = useState<UnifiedLocation | null>(null)
  const [qiblaDirection, setQiblaDirection] = useState<number | null>(null)
  const [hijriDate, setHijriDate] = useState<HijriDate | null>(null)
  const [specialDay, setSpecialDay] = useState<SpecialDay | null>(null)
  const [prayerStatus, setPrayerStatus] = useState<PrayerStatus>({})
  const [loading, setLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [locationError, setLocationError] = useState(false)
  const [activeTab, setActiveTab] = useState('today')
  const [prayerLogs, setPrayerLogs] = useState<PrayerLog[]>([])
  const [isRefreshingLocation, setIsRefreshingLocation] = useState(false)
  const [selectedHistoryDays, setSelectedHistoryDays] = useState(30)
  const [statistics, setStatistics] = useState({

    dailyCompletionRate: 0,

    weeklyCompletionRate: 0,

    monthlyCompletionRate: 0,

    onTimePercentage: 0,

    currentStreak: 0,

    longestStreak: 0,

    totalPrayers: 0,

    totalPrayersCompleted: 0

  })

  const [prayerTimesError, setPrayerTimesError] = useState<string | null>(null)

  const prayerTimesRef = useRef<PrayerTimes | null>(null)
  const locationRef = useRef<UnifiedLocation | null>(null)


  const historyData = useMemo<HistoryEntry[]>(() => buildHistoryData(prayerLogs, selectedHistoryDays), [prayerLogs, selectedHistoryDays])

  const chartData = useMemo<ChartPoint[]>(() => buildChartData(prayerLogs), [prayerLogs])

  const streakMilestones = useMemo(
    () =>
      STREAK_MILESTONES.map(milestone => ({
        ...milestone,
        achieved: statistics.longestStreak >= milestone.days
      })),
    [statistics.longestStreak]
  )

  const loadPrayerData = useCallback(
    async (options: { forceGPS?: boolean; showToast?: boolean; suppressSpinner?: boolean } = {}) => {
      const { forceGPS = false, showToast = false, suppressSpinner = false } = options

      try {
        if (!suppressSpinner) {
          setLoading(true)
        }
        setLocationError(false)

        let userLocation: UnifiedLocation | null = null

        if (forceGPS) {
          // User explicitly requested GPS update
          try {
            userLocation = await requestGPSLocation()
            if (showToast) {
              toast.success('Location updated successfully')
            }
          } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to get GPS location')
            // Fall back to automatic detection
            userLocation = await getUserLocation()
          }
        } else {
          // Use smart location detection (database → cache → IP)
          userLocation = await getUserLocation()
        }

        if (!userLocation) {
          setLocationError(true)
          toast.error('Unable to determine your location. Please enable location access.')
          return
        }

        // Update state
        locationRef.current = userLocation
        setLocation(userLocation)

        // Load prayer times for this location
        await loadPrayerTimesForLocation(userLocation.latitude, userLocation.longitude)
      } catch (error) {
        console.error('Error loading prayer data:', error)
        setLocationError(true)
        toast.error('Failed to load prayer data')
      } finally {
        if (!suppressSpinner) {
          setLoading(false)
        }
      }
    },
    []
  )



  useEffect(() => {

    prayerTimesRef.current = prayerTimes

  }, [prayerTimes])



  useEffect(() => {
    loadPrayerData()
    loadStoredPrayerStatus()
    loadHistoricalData(selectedHistoryDays)

    // Update time every second for countdown
    const interval = setInterval(() => {
      setCurrentTime(new Date())
      if (prayerTimesRef.current) {
        const next = getNextPrayerFromTimes(prayerTimesRef.current)
        setNextPrayer(next)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [loadPrayerData])

  // Reload historical data when selectedHistoryDays changes
  useEffect(() => {
    loadHistoricalData(selectedHistoryDays)
  }, [selectedHistoryDays])

  useEffect(() => {
    if (prayerTimes) {
      const next = getNextPrayerFromTimes(prayerTimes)
      setNextPrayer(next)
    }
  }, [prayerTimes])

  useEffect(() => {
    locationRef.current = location
  }, [location])

  useEffect(() => {
    // Periodically check if location needs refresh (every hour)
    const interval = setInterval(() => {
      if (locationRef.current) {
        const age = Date.now() - locationRef.current.timestamp
        if (age > LOCATION_REFRESH_INTERVAL_MS) {
          loadPrayerData({ suppressSpinner: true })
        }
      }
    }, LOCATION_REFRESH_INTERVAL_MS / 2)
    return () => clearInterval(interval)
  }, [loadPrayerData])

  const handleRefreshLocation = async () => {
    setIsRefreshingLocation(true)
    try {
      await loadPrayerData({ forceGPS: true, showToast: true, suppressSpinner: true })
    } finally {
      setIsRefreshingLocation(false)
    }
  }


  async function loadPrayerTimesForLocation(latitude: number, longitude: number) {

    try {

      setPrayerTimesError(null)

      const cachedTimes = getStoredPrayerTimes(latitude, longitude)

      if (cachedTimes) {

        setPrayerTimes(cachedTimes)

      } else {

        const times = await fetchPrayerTimes(latitude, longitude, undefined, 1) // Always use Hanafi calculation

        if (!times) {

          setPrayerTimesError('Unable to fetch prayer times for your location right now.')

          return

        }

        setPrayerTimes(times)

        savePrayerTimes(times, latitude, longitude)

      }



      const qibla = await getQiblaDirection(latitude, longitude)

      setQiblaDirection(qibla)



      const hijri = await gregorianToHijri(new Date())

      setHijriDate(hijri)



      const special = await getSpecialDay(new Date())

      setSpecialDay(special)

    } catch (error) {

      console.error('Error loading prayer times:', error)

      setPrayerTimesError('Failed to load prayer times. Please try again.')

    }

  }



  function loadStoredPrayerStatus() {

    const today = new Date().toDateString()

    const stored = localStorage.getItem('prayer-status-' + (today))

    if (stored) {

      setPrayerStatus(JSON.parse(stored))

    }

  }



  async function togglePrayerStatus(prayerName: PrayerName) {

    const today = new Date()

    const isCurrentlyCompleted = prayerStatus[prayerName]

    const isCompleting = !isCurrentlyCompleted



    // If completing (not uncompleting), check if prayer time has passed

    if (isCompleting && prayerTimes) {

      const prayerTime = prayerTimes[prayerName]

      if (prayerTime) {

        const [prayerHours, prayerMinutes] = prayerTime.split(':').map(Number)

        const now = new Date()

        const currentHours = now.getHours()

        const currentMinutes = now.getMinutes()

        const currentTimeInMinutes = currentHours * 60 + currentMinutes

        const prayerTimeInMinutes = prayerHours * 60 + prayerMinutes



        // Prevent marking future prayers as completed

        if (currentTimeInMinutes < prayerTimeInMinutes) {

          toast.error(`Cannot complete ${prayerName.charAt(0).toUpperCase() + prayerName.slice(1)} prayer yet. Prayer time is at ${prayerTime}`)

          return

        }

      }

    }



    const newStatus = {

      ...prayerStatus,

      [prayerName]: isCompleting

    }

    setPrayerStatus(newStatus)

    localStorage.setItem('prayer-status-' + (today.toDateString()), JSON.stringify(newStatus))



    // Calculate if prayer is being marked on time

    let isOnTime = false

    if (isCompleting && prayerTimes) {

      const currentTime = new Date()

      const currentHours = currentTime.getHours()

      const currentMinutes = currentTime.getMinutes()



      const currentPrayerIndex = PRAYER_SEQUENCE.indexOf(prayerName)



      if (currentPrayerIndex !== -1) {

        let nextPrayerTime: string | null = null

        if (currentPrayerIndex < PRAYER_SEQUENCE.length - 1) {

          const nextPrayerName = PRAYER_SEQUENCE[currentPrayerIndex + 1]

          nextPrayerTime = prayerTimes[nextPrayerName]

        }



        if (nextPrayerTime) {

          const [nextHours, nextMinutes] = nextPrayerTime.split(':').map(Number)

          const currentTimeInMinutes = currentHours * 60 + currentMinutes

          const nextTimeInMinutes = nextHours * 60 + nextMinutes

          isOnTime = currentTimeInMinutes < nextTimeInMinutes

        } else {

          isOnTime = currentHours < 24

        }

      }

    }



    // Save to database

    try {

      await fetch('/api/prayers/track', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({

          date: today.toISOString(),

          prayerName: prayerName.toUpperCase(),

          completed: isCompleting,

          onTime: isOnTime

        })

      })

      // Reload statistics after updating

      await loadHistoricalData()

    } catch (error) {

      console.error('Error saving prayer status:', error)

    }

  }



  async function loadHistoricalData(days = 30) {

    try {

      // Calculate date range for the API call
      const endDate = new Date()
      endDate.setHours(23, 59, 59, 999)
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      startDate.setHours(0, 0, 0, 0)

      const response = await fetch(
        `/api/prayers/track?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      )

      if (response.ok) {

        const data = await response.json()

        const logs: PrayerLog[] = data.prayerLogs || []

        setPrayerLogs(logs)

        calculateStatistics(logs)

        syncTodaysPrayerStatus(logs)

      }

    } catch (error) {

      console.error('Error loading historical data:', error)

    }

  }



  function syncTodaysPrayerStatus(prayerLogs: PrayerLog[]) {

    const today = new Date()

    today.setHours(0, 0, 0, 0)

    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    

    const todayLogs = prayerLogs.filter(log => {

      const logDate = new Date(log.date)

      const logStr = `${logDate.getFullYear()}-${String(logDate.getMonth() + 1).padStart(2, '0')}-${String(logDate.getDate()).padStart(2, '0')}`

      return logStr === todayStr

    })

    

    // Build status object from database

    const statusFromDB: PrayerStatus = {}

    todayLogs.forEach(log => {

      const normalizedName = log.prayerName.toLowerCase() as PrayerName

      statusFromDB[normalizedName] = !!log.completedAt

    })

    

    // Update state and localStorage

    setPrayerStatus(statusFromDB)

    if (Object.keys(statusFromDB).length > 0) {

      localStorage.setItem('prayer-status-' + today.toDateString(), JSON.stringify(statusFromDB))

    }

  }



  function calculateStatistics(data: PrayerLog[]) {

    if (!data || data.length === 0) {

      // Set default statistics when no data

      setStatistics({

        dailyCompletionRate: 0,

        weeklyCompletionRate: 0,

        monthlyCompletionRate: 0,

        onTimePercentage: 0,

        currentStreak: 0,

        longestStreak: 0,

        totalPrayers: 0,

        totalPrayersCompleted: 0

      })

      return

    }



    const today = new Date()

    today.setHours(0, 0, 0, 0)

    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    

    const sevenDaysAgo = new Date(today)

    sevenDaysAgo.setDate(today.getDate() - 7)

    const thirtyDaysAgo = new Date(today)

    thirtyDaysAgo.setDate(today.getDate() - 30)



    const todayData = data.filter(d => {

      const dDate = new Date(d.date)

      const dStr = `${dDate.getFullYear()}-${String(dDate.getMonth() + 1).padStart(2, '0')}-${String(dDate.getDate()).padStart(2, '0')}`

      return dStr === todayStr

    })

    const weekData = data.filter(d => new Date(d.date) >= sevenDaysAgo)

    const monthData = data.filter(d => new Date(d.date) >= thirtyDaysAgo)



    // Check completedAt instead of completed

    const dailyCompleted = todayData.filter(d => d.completedAt !== null).length

    const weekCompleted = weekData.filter(d => d.completedAt !== null).length

    const monthCompleted = monthData.filter(d => d.completedAt !== null).length



    const onTimeCount = data.filter(d => d.completedAt !== null && d.onTime).length

    const totalCompleted = data.filter(d => d.completedAt !== null).length



    // Calculate streak - must be CONSECUTIVE days with all 5 prayers

    let currentStreak = 0

    let longestStreak = 0

    let tempStreak = 0



    const daysPrayers = new Map<string, number>()

    data.forEach(d => {

      const dDate = new Date(d.date)

      const dateKey = `${dDate.getFullYear()}-${String(dDate.getMonth() + 1).padStart(2, '0')}-${String(dDate.getDate()).padStart(2, '0')}`

      if (d.completedAt !== null) {

        daysPrayers.set(dateKey, (daysPrayers.get(dateKey) || 0) + 1)

      }

    })



    // Sort days by date (most recent first)

    const sortedDays = Array.from(daysPrayers.entries()).sort((a, b) => 

      new Date(b[0]).getTime() - new Date(a[0]).getTime()

    )



    // Check consecutive days starting from today

    let lastDate: Date | null = null

    for (let i = 0; i < sortedDays.length; i++) {

      const currentDate = new Date(sortedDays[i][0])

      const prayerCount = sortedDays[i][1]

      

      // Check if this day has all 5 prayers

      if (prayerCount === 5) {

        // Check if it's consecutive with previous day

        if (lastDate === null) {

          // First day in sequence

          tempStreak = 1

          if (i === 0) currentStreak = 1 // Start counting from today

        } else {

          const dayDiff = Math.floor((lastDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))

          if (dayDiff === 1) {

            // Consecutive day

            tempStreak++

            if (i === 0 || currentStreak > 0) currentStreak = tempStreak

          } else {

            // Gap in streak, reset

            if (currentStreak === 0) {

              // We already passed today, so this is a historical streak

              longestStreak = Math.max(longestStreak, tempStreak)

            }

            tempStreak = 1

          }

        }

        longestStreak = Math.max(longestStreak, tempStreak)

        lastDate = currentDate

      } else {

        // Incomplete day breaks the streak

        if (i === 0) {

          // Today is incomplete, no current streak

          currentStreak = 0

        }

        if (tempStreak > 0) {

          longestStreak = Math.max(longestStreak, tempStreak)

          tempStreak = 0

        }

        lastDate = null

      }

    }



    setStatistics({

      dailyCompletionRate: (dailyCompleted / 5) * 100,

      weeklyCompletionRate: (weekCompleted / 35) * 100,

      monthlyCompletionRate: (monthCompleted / 150) * 100,

      onTimePercentage: totalCompleted > 0 ? (onTimeCount / totalCompleted) * 100 : 0,

      currentStreak,

      longestStreak,

      totalPrayers: data.length,

      totalPrayersCompleted: totalCompleted

    })

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

      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">

        {/* Islamic Pattern Background */}

        <div

          className="fixed inset-0 opacity-5 pointer-events-none"

          style={{

            backgroundImage: 'url(/islamic-pattern.svg)',

            backgroundSize: '400px 400px',

            backgroundRepeat: 'repeat'

          }}

        />

        <div className="relative z-10 text-center space-y-6 p-8">

          <div className="flex flex-col items-center gap-6">

            <LoadingSpinner size="lg" />

            <div className="space-y-3">

              <p className="text-2xl font-semibold text-emerald-700 dark:text-emerald-300">Loading Prayer Times</p>

              <p className="text-lg text-gray-600 dark:text-gray-300 font-arabic" dir="rtl" lang="ar">جاري تحميل أوقات الصلاة</p>

            </div>

          </div>

        </div>

      </div>

    )

  }



  if (!prayerTimes || !location) {

    if (locationError) {

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

            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center shadow-xl">

              <MapPin className="h-10 w-10 text-white drop-shadow-sm" />

            </div>

            <div>

              <h2 className="text-2xl font-bold bg-gradient-to-r from-red-700 via-orange-700 to-red-800 bg-clip-text text-transparent mb-2 dark:from-red-300 dark:via-orange-300 dark:to-red-400">

                Location Access Required

              </h2>

              <p className="text-gray-700 dark:text-gray-300 mb-2">

                Please enable location access to view accurate prayer times for your area.

              </p>

              <p className="text-sm text-gray-600 dark:text-gray-400">

                This app requires your location to calculate precise prayer times based on your geographic coordinates.

              </p>

            </div>

            <Button

              onClick={() => loadPrayerData()}

              className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 dark:from-emerald-500 dark:to-teal-500 dark:hover:from-emerald-600 dark:hover:to-teal-600"

            >

              <MapPin className="mr-2 h-5 w-5" />

              Enable Location

            </Button>

          </Card>

        </div>

      )

    }

    if (prayerTimesError) {

      return (

        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">

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

            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center shadow-xl">

              <Clock className="h-10 w-10 text-white drop-shadow-sm" />

            </div>

            <div>

              <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 bg-clip-text text-transparent mb-2 dark:from-emerald-300 dark:via-teal-300 dark:to-emerald-400">

                Prayer Times Unavailable

              </h2>

              <p className="text-gray-700 dark:text-gray-300 mb-2">

                We couldn&apos;t fetch the latest timings. Please check your connection and try again.

              </p>

              <p className="text-sm text-gray-600 dark:text-gray-400">

                The request might have timed out or the service is temporarily unavailable.

              </p>

            </div>

            <Button

              onClick={() => loadPrayerData()}

              className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 dark:from-emerald-500 dark:to-teal-500 dark:hover:from-emerald-600 dark:hover:to-teal-600"

            >

              <Clock className="mr-2 h-5 w-5" />

              Retry

            </Button>

          </Card>

        </div>

      )

    }

    return null

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

          <div className="flex items-center gap-4">

            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center shadow-xl animate-float dark:from-emerald-500 dark:to-teal-500">

              <Compass className="h-8 w-8 text-white drop-shadow-sm" />

            </div>

            <div>

              <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 bg-clip-text text-transparent dark:from-emerald-300 dark:via-teal-300 dark:to-emerald-400">

                Prayer Times

              </h1>

              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mt-1">
                <MapPin className="h-4 w-4" />
                <span className="font-medium">
                  {formatLocationForDisplay(location)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Refresh location"
                  title="Refresh location"
                  onClick={handleRefreshLocation}
                  disabled={isRefreshingLocation}
                  className="h-8 w-8 text-gray-600 dark:text-gray-300 hover:text-emerald-600"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshingLocation ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>

          </div>

        </div>



        {/* Tabs for different views */}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

          <TabsList className="grid w-full grid-cols-3 bg-white dark:bg-gray-800 p-1 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">

            <TabsTrigger 

              value="today" 

              className="rounded-lg data-[state=active]:bg-emerald-100 dark:data-[state=active]:bg-emerald-900/30 data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-300 transition-all"

            >

              <Clock className="h-4 w-4 mr-2" />

              Today

            </TabsTrigger>

            <TabsTrigger 

              value="history" 

              className="rounded-lg data-[state=active]:bg-emerald-100 dark:data-[state=active]:bg-emerald-900/30 data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-300 transition-all"

            >

              <History className="h-4 w-4 mr-2" />

              History

            </TabsTrigger>

            <TabsTrigger 

              value="statistics" 

              className="rounded-lg data-[state=active]:bg-emerald-100 dark:data-[state=active]:bg-emerald-900/30 data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-300 transition-all"

            >

              <BarChart3 className="h-4 w-4 mr-2" />

              Statistics

            </TabsTrigger>

          </TabsList>



          {/* Today Tab */}

          <TabsContent value="today" className="space-y-8 mt-6">

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

                ? All prayers completed! May Allah accept your prayers.

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
                    <span className="font-medium">Up next &rarr;</span>
                    <span className="sr-only">Time until next prayer</span>
                    <span>{nextPrayer?.timeUntil}</span>
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

                {qiblaDirection !== null ? `${qiblaDirection.toFixed(2)} deg` : 'Calculating...'}

              </p>

            </div>

          </div>

          <div className="text-sm text-gray-700 dark:text-gray-300 italic">

            From your location to Makkah

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

          </TabsContent>



          {/* History Tab */}

          <TabsContent value="history" className="mt-6">

            <PrayerHistory
              historyData={historyData}
              daysToShow={selectedHistoryDays}
              onDaysChange={setSelectedHistoryDays}
            />

          </TabsContent>



          {/* Statistics Tab */}

          <TabsContent value="statistics" className="space-y-6 mt-6">

            <PrayerStatistics

              dailyCompletion={formatPercentage(statistics.dailyCompletionRate)}

              weeklyCompletion={formatPercentage(statistics.weeklyCompletionRate)}

              monthlyCompletion={formatPercentage(statistics.monthlyCompletionRate)}

              onTimePercentage={formatPercentage(statistics.onTimePercentage)}

              totalPrayers={statistics.totalPrayers}

              completedPrayers={statistics.totalPrayersCompleted}

              todayCompleted={completedPrayers}

            />

            <PrayerChart data={chartData} period="daily" />

            <PrayerStreak

              currentStreak={statistics.currentStreak}

              longestStreak={statistics.longestStreak}

              milestones={streakMilestones}

            />

          </TabsContent>

        </Tabs>

      </div>

    </div>

  )
}

function formatPercentage(value: number): number {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.max(0, Math.min(100, Math.round(value)))
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function createEmptyPrayerState(): Record<PrayerName, { completed: boolean; onTime: boolean }> {
  return {
    fajr: { completed: false, onTime: false },
    dhuhr: { completed: false, onTime: false },
    asr: { completed: false, onTime: false },
    maghrib: { completed: false, onTime: false },
    isha: { completed: false, onTime: false }
  }
}

function buildHistoryData(logs: PrayerLog[], daysToShow = 30): HistoryEntry[] {
  // Always generate data for the last N days, even if no logs exist
  const grouped = new Map<string, { date: Date; prayers: Record<PrayerName, { completed: boolean; onTime: boolean }> }>()

  // Create entries for the last N days (descending order)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < daysToShow; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateKey = formatDateKey(date)
    grouped.set(dateKey, { date: new Date(date), prayers: createEmptyPrayerState() })
  }

  // Fill in actual prayer data where it exists
  if (logs && logs.length > 0) {
    logs.forEach(log => {
      const logDate = new Date(log.date)
      const dateKey = formatDateKey(logDate)
      if (grouped.has(dateKey)) {
        const entry = grouped.get(dateKey)!
        const normalizedName = log.prayerName?.toLowerCase() as PrayerName
        if (PRAYER_SEQUENCE.includes(normalizedName)) {
          entry.prayers[normalizedName] = {
            completed: Boolean(log.completedAt),
            onTime: Boolean(log.completedAt && log.onTime)
          }
        }
      }
    })
  }

  return Array.from(grouped.values())
    .map(({ date, prayers }) => {
      const completedCount = PRAYER_SEQUENCE.filter(prayer => prayers[prayer].completed).length
      return {
        date,
        prayers,
        completionRate: Math.round((completedCount / PRAYER_SEQUENCE.length) * 100)
      }
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime())
}

function buildChartData(logs: PrayerLog[], days = 14): ChartPoint[] {
  if (!logs || logs.length === 0) {
    return []
  }

  const grouped = new Map<string, { completed: number; onTime: number }>()

  logs.forEach(log => {
    const dateKey = formatDateKey(new Date(log.date))
    const bucket = grouped.get(dateKey) ?? { completed: 0, onTime: 0 }
    if (log.completedAt) {
      bucket.completed += 1
      if (log.onTime) {
        bucket.onTime += 1
      }
    }
    grouped.set(dateKey, bucket)
  })

  return Array.from(grouped.entries())
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .slice(-days)
    .map(([dateKey, values]) => {
      const completion = Math.round((values.completed / PRAYER_SEQUENCE.length) * 100)
      const onTime = values.completed > 0 ? Math.round((values.onTime / values.completed) * 100) : 0
      const label = new Date(dateKey).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      return { date: label, completion, onTime }
    })
}

























