'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Brain, Settings, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { clientCache } from '@/lib/performance'

import { FocusTimer } from '@/components/focus/FocusTimer'
import { FocusStatistics } from '@/components/focus/FocusStatistics'
import { FocusSettingsPanel } from '@/components/focus/FocusSettingsPanel'

interface FocusStats {
  today: { focusTime: number; sessions: number }
  week: { focusTime: number; sessions: number; avgDailyFocusTime: number; avgDailySessions: number }
  month: { focusTime: number; sessions: number; avgDailyFocusTime: number; avgDailySessions: number }
  allTime: { totalSessions: number; totalFocusTime: number; currentStreak: number; longestStreak: number }
  last7Days: Array<{ date: string; sessions: number; focusTime: number }>
  last30Days: Array<{ date: string; sessions: number; focusTime: number }>
  typeBreakdown: Array<{ type: string; count: number; totalTime: number }>
}

interface FocusSettings {
  focusDuration: number
  shortBreakDuration: number
  longBreakDuration: number
  autoStartBreaks: boolean
  autoStartFocus: boolean
  enableMusic: boolean
  musicVolume: number
}

type TimerMode = 'focus' | 'shortBreak' | 'longBreak'

export default function FocusPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<FocusStats | null>(null)
  const [settings, setSettings] = useState<FocusSettings>({
    focusDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    autoStartBreaks: false,
    autoStartFocus: false,
    enableMusic: true,
    musicVolume: 50
  })
  const [mode, setMode] = useState<TimerMode>('focus')
  const [timeLeft, setTimeLeft] = useState(1500)
  const [isActive, setIsActive] = useState(false)
  const [sessionStart, setSessionStart] = useState<Date | null>(null)
  const [completedSessions, setCompletedSessions] = useState(0)
  const [activeTab, setActiveTab] = useState('timer')
  const [showSettings, setShowSettings] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [showCompletionBadge, setShowCompletionBadge] = useState(false)
  
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (session?.user?.email) {
      fetchStats()
      fetchSettings()
    }
  }, [session?.user?.email])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else if (timeLeft === 0 && isActive) {
      // Timer just hit zero, handle completion
      handleTimerComplete()
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActive, timeLeft])

  // Music management - initialize audio once
  useEffect(() => {
    // Initialize audio element once
    if (!audioRef.current) {
      audioRef.current = new Audio('/music/focus/sea.mp3')
      audioRef.current.loop = true
      audioRef.current.volume = settings.musicVolume / 100
    }

    // Cleanup on unmount only
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
        audioRef.current.load()
        audioRef.current = null
      }
    }
  }, []) // Run only once on mount

  // Handle music playback based on state
  useEffect(() => {
    if (!audioRef.current) return

    const playMusic = () => {
      audioRef.current!.play().catch(() => {
        // Silently fail if no music file
      })
    }

    const stopMusic = () => {
      audioRef.current!.pause()
      // Don't reset currentTime - let it continue from where it was paused
    }

    if (isActive && mode === 'focus' && settings.enableMusic && !isMuted) {
      playMusic()
    } else {
      stopMusic()
    }
  }, [isActive, mode, settings.enableMusic, isMuted])

  // Update volume dynamically without stopping playback
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = settings.musicVolume / 100
    }
  }, [settings.musicVolume])

  const stopMusic = () => {
    if (audioRef.current) {
      audioRef.current.pause()
    }
  }

  const toggleMute = () => {
    const newMutedState = !isMuted
    setIsMuted(newMutedState)

    // Just toggle the muted property without stopping playback
    if (audioRef.current) {
      audioRef.current.muted = newMutedState
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/focus')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch focus stats:', error)
    }
  }

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/focus/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
        setTimeLeft(data.focusDuration * 60)
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    }
  }

  const saveSettings = async () => {
    try {
      const response = await fetch('/api/focus/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        toast.success('Settings saved!')
        setShowSettings(false)
        if (!isActive) {
          const durations = {
            focus: settings.focusDuration * 60,
            shortBreak: settings.shortBreakDuration * 60,
            longBreak: settings.longBreakDuration * 60
          }
          setTimeLeft(durations[mode])
        }
      }
    } catch (error) {
      toast.error('Failed to save settings')
    }
  }

  const handleTimerComplete = async () => {
    setIsActive(false)
    stopMusic()

    // Calculate duration and save to database for all session types
    if (sessionStart) {
      const duration = Math.round((Date.now() - sessionStart.getTime()) / 60000)
      
      // Ensure duration is at least 1 minute
      if (duration < 1) {
        console.log('Session too short, not recording')
        return
      }

      try {
        await fetch('/api/focus', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            duration, 
            sessionType: mode,
            completedAt: new Date() 
          })
        })

        if (mode === 'focus') {
          const newCompletedCount = completedSessions + 1
          setCompletedSessions(newCompletedCount)
          toast.success('🎉 Focus session completed!', {
            description: `${duration} minutes of deep focus!`
          })
          
          // Show completion badge briefly
          setShowCompletionBadge(true)
          setTimeout(() => setShowCompletionBadge(false), 5000)
          
          // Auto-switch to next mode after focus
          const nextMode = newCompletedCount % 4 === 0 ? 'longBreak' : 'shortBreak'
          setMode(nextMode)
          setTimeLeft(nextMode === 'longBreak' ? settings.longBreakDuration * 60 : settings.shortBreakDuration * 60)
          
          // Only show break notification if not auto-starting
          if (!settings.autoStartBreaks) {
            toast.info('Time for a break! 🧘‍♂️')
          } else {
            setTimeout(() => startTimer(), 3000)
          }
        } else {
          toast.success(`✅ ${mode === 'shortBreak' ? 'Short' : 'Long'} break completed!`)
          
          // Auto-switch back to focus after break
          setMode('focus')
          setTimeLeft(settings.focusDuration * 60)
          
          // Only show focus notification if not auto-starting
          if (!settings.autoStartFocus) {
            toast.info('Break complete! Ready to focus? 💪')
          } else {
            setTimeout(() => startTimer(), 3000)
          }
        }
        
        // Clear cache to ensure dashboard gets fresh data
        clientCache.delete('focus_stats')
        await fetchStats()
      } catch (error) {
        console.error('Failed to record session:', error)
        toast.error('Failed to save session')
      }
    } else {
      console.warn('No session start time recorded')
    }

    setSessionStart(null)
  }

  const startTimer = () => {
    setIsActive(true)
    // Track start time for all session types
    setSessionStart(new Date())
  }

  const pauseTimer = () => {
    setIsActive(false)
    // Music will pause automatically via useEffect when isActive changes
  }

  const resetTimer = () => {
    setIsActive(false)
    stopMusic()
    // Reset music to start when explicitly resetting timer
    if (audioRef.current) {
      audioRef.current.currentTime = 0
    }
    const durations = {
      focus: settings.focusDuration * 60,
      shortBreak: settings.shortBreakDuration * 60,
      longBreak: settings.longBreakDuration * 60
    }
    setTimeLeft(durations[mode])
    setSessionStart(null)
  }

  const switchMode = (newMode: TimerMode) => {
    setMode(newMode)
    const durations = {
      focus: settings.focusDuration * 60,
      shortBreak: settings.shortBreakDuration * 60,
      longBreak: settings.longBreakDuration * 60
    }
    setTimeLeft(durations[newMode])
    setIsActive(false)
    stopMusic()
    // Reset music to start when switching modes
    if (audioRef.current) {
      audioRef.current.currentTime = 0
    }
    setSessionStart(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/40 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8 text-slate-900 dark:text-gray-100">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-gray-100 bg-gradient-to-r from-purple-700 to-indigo-700 dark:from-white dark:to-gray-100 bg-clip-text [text-shadow:none] [-webkit-background-clip:text] [-webkit-text-fill-color:transparent] supports-[background-clip:text]:text-transparent">Focus Session</h1>
              <p className="text-slate-600 dark:text-gray-400">Deep work timer with statistics</p>
            </div>
          </div>
          <Button
            onClick={() => setShowSettings(!showSettings)}
            variant="outline"
            size="lg"
            className="bg-white dark:bg-gray-800 text-slate-700 dark:text-gray-300 border-2 border-slate-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors shadow-sm"
          >
            <Settings className="h-5 w-5 mr-2 text-slate-700 dark:text-gray-300" />
            Settings
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white dark:bg-gray-800 shadow-lg border border-slate-200 dark:border-gray-700">
            <TabsTrigger 
              value="timer" 
              className="text-slate-700 dark:text-gray-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-100 data-[state=active]:to-indigo-100 dark:data-[state=active]:from-purple-600 dark:data-[state=active]:to-indigo-600 data-[state=active]:text-purple-900 dark:data-[state=active]:text-white data-[state=active]:shadow-md font-semibold"
            >
              Timer
            </TabsTrigger>
            <TabsTrigger 
              value="statistics" 
              className="text-slate-700 dark:text-gray-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-100 data-[state=active]:to-indigo-100 dark:data-[state=active]:from-purple-600 dark:data-[state=active]:to-indigo-600 data-[state=active]:text-purple-900 dark:data-[state=active]:text-white data-[state=active]:shadow-md font-semibold"
            >
              Statistics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="timer" className="space-y-6">
            <FocusSettingsPanel
              show={showSettings}
              settings={settings}
              onSettingsChange={setSettings}
              onSave={saveSettings}
            />

            <FocusTimer
              mode={mode}
              timeLeft={timeLeft}
              isActive={isActive}
              completedSessions={completedSessions}
              settings={settings}
              isMuted={isMuted}
              onStart={startTimer}
              onPause={pauseTimer}
              onReset={resetTimer}
              onSwitchMode={switchMode}
              onToggleMute={toggleMute}
            />
          </TabsContent>

          <TabsContent value="statistics" className="space-y-6">
            <FocusStatistics stats={stats} />
          </TabsContent>
        </Tabs>

        {/* Completion Badge - Shows briefly after completing a session */}
        <AnimatePresence>
          {showCompletionBadge && completedSessions > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="fixed bottom-8 right-8 z-50"
            >
              <Card className="border-2 border-emerald-300 dark:border-emerald-600 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/80 dark:to-teal-900/80 shadow-2xl">
                <CardContent className="p-4 flex items-center gap-3">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <p className="font-semibold text-emerald-900 dark:text-emerald-100">
                      {completedSessions} Session{completedSessions > 1 ? 's' : ''}!
                    </p>
                    <p className="text-sm text-emerald-700 dark:text-emerald-300">Keep going! 🔥</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
