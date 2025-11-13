'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Zap, Coffee, Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react'

interface FocusTimerProps {
  mode: 'focus' | 'shortBreak' | 'longBreak'
  timeLeft: number
  isActive: boolean
  completedSessions: number
  settings: {
    focusDuration: number
    shortBreakDuration: number
    longBreakDuration: number
  }
  isMuted: boolean
  onStart: () => void
  onPause: () => void
  onReset: () => void
  onSwitchMode: (mode: 'focus' | 'shortBreak' | 'longBreak') => void
  onToggleMute: () => void
}

export function FocusTimer({
  mode,
  timeLeft,
  isActive,
  completedSessions,
  settings,
  isMuted,
  onStart,
  onPause,
  onReset,
  onSwitchMode,
  onToggleMute
}: FocusTimerProps) {
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const totalSeconds = mode === 'focus' ? settings.focusDuration * 60 : 
                       mode === 'shortBreak' ? settings.shortBreakDuration * 60 : 
                       settings.longBreakDuration * 60
  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100

  const modeColors = {
    focus: { 
      from: 'from-purple-500', 
      to: 'to-indigo-500', 
      text: 'text-purple-600 dark:text-purple-400',
      lightText: 'text-purple-700 dark:text-purple-300',
      gradient: 'from-purple-50 to-indigo-100 dark:from-purple-950/40 dark:to-indigo-950/40',
      border: 'border-purple-300 dark:border-purple-700',
      buttonText: 'text-purple-900 dark:text-white',
      buttonBg: 'bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-500 dark:to-indigo-500',
      activeText: 'text-purple-900 dark:text-white'
    },
    shortBreak: { 
      from: 'from-emerald-500', 
      to: 'to-teal-500', 
      text: 'text-emerald-600 dark:text-emerald-400',
      lightText: 'text-emerald-700 dark:text-emerald-300',
      gradient: 'from-emerald-50 to-teal-100 dark:from-emerald-950/40 dark:to-teal-950/40',
      border: 'border-emerald-300 dark:border-emerald-700',
      buttonText: 'text-emerald-900 dark:text-white',
      buttonBg: 'bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-500 dark:to-teal-500',
      activeText: 'text-emerald-900 dark:text-white'
    },
    longBreak: { 
      from: 'from-blue-500', 
      to: 'to-cyan-500', 
      text: 'text-blue-600 dark:text-blue-400',
      lightText: 'text-blue-700 dark:text-blue-300',
      gradient: 'from-blue-50 to-cyan-100 dark:from-blue-950/40 dark:to-cyan-950/40',
      border: 'border-blue-300 dark:border-blue-700',
      buttonText: 'text-blue-900 dark:text-white',
      buttonBg: 'bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-500 dark:to-cyan-500',
      activeText: 'text-blue-900 dark:text-white'
    }
  }

  const currentColor = modeColors[mode]

  return (
    <Card className={`border-2 ${currentColor.border} shadow-2xl bg-gradient-to-br from-white via-purple-50/20 to-indigo-50/20 dark:from-gray-800/90 dark:via-gray-800/90 dark:to-gray-800/90 backdrop-blur`}>
      <CardHeader className="text-center pb-4">
        <div className="flex justify-center gap-2 mb-4 flex-wrap">
          <Button
            variant={mode === 'focus' ? 'default' : 'outline'}
            onClick={() => onSwitchMode('focus')}
            disabled={isActive}
            className={mode === 'focus' 
              ? `${modeColors.focus.buttonBg} ${modeColors.focus.buttonText} shadow-xl shadow-purple-500/40 hover:shadow-2xl hover:shadow-purple-500/50 hover:scale-105 transition-all duration-300 font-bold disabled:opacity-50 disabled:cursor-not-allowed` 
              : 'bg-gradient-to-br from-white to-purple-50 dark:from-gray-800 dark:to-gray-700 text-slate-800 dark:text-gray-300 border-2 border-purple-300 dark:border-gray-600 hover:border-purple-500 dark:hover:border-purple-500 hover:shadow-lg hover:shadow-purple-200/50 dark:hover:shadow-purple-900/30 hover:scale-105 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
            }
          >
            <Zap className="h-4 w-4 mr-2" />
            Focus ({settings.focusDuration}m)
          </Button>
          <Button
            variant={mode === 'shortBreak' ? 'default' : 'outline'}
            onClick={() => onSwitchMode('shortBreak')}
            disabled={isActive}
            className={mode === 'shortBreak' 
              ? `${modeColors.shortBreak.buttonBg} ${modeColors.shortBreak.buttonText} shadow-xl shadow-emerald-500/40 hover:shadow-2xl hover:shadow-emerald-500/50 hover:scale-105 transition-all duration-300 font-bold disabled:opacity-50 disabled:cursor-not-allowed` 
              : 'bg-gradient-to-br from-white to-emerald-50 dark:from-gray-800 dark:to-gray-700 text-slate-800 dark:text-gray-300 border-2 border-emerald-300 dark:border-gray-600 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-200/50 dark:hover:shadow-emerald-900/30 hover:scale-105 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
            }
          >
            <Coffee className="h-4 w-4 mr-2" />
            Short ({settings.shortBreakDuration}m)
          </Button>
          <Button
            variant={mode === 'longBreak' ? 'default' : 'outline'}
            onClick={() => onSwitchMode('longBreak')}
            disabled={isActive}
            className={mode === 'longBreak' 
              ? `${modeColors.longBreak.buttonBg} ${modeColors.longBreak.buttonText} shadow-xl shadow-blue-500/40 hover:shadow-2xl hover:shadow-blue-500/50 hover:scale-105 transition-all duration-300 font-bold disabled:opacity-50 disabled:cursor-not-allowed` 
              : 'bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-700 text-slate-800 dark:text-gray-300 border-2 border-blue-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg hover:shadow-blue-200/50 dark:hover:shadow-blue-900/30 hover:scale-105 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
            }
          >
            <Coffee className="h-4 w-4 mr-2" />
            Long ({settings.longBreakDuration}m)
          </Button>
        </div>
      </CardHeader>
      <CardContent className="py-12">
        <div className="flex flex-col items-center space-y-8">
          {/* Timer Circle */}
          <div className="relative w-80 h-80">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="160" cy="160" r="140" stroke="currentColor" strokeWidth="12" fill="none" className="text-slate-200 dark:text-gray-700" />
              <motion.circle
                cx="160" cy="160" r="140" stroke="currentColor" strokeWidth="12" fill="none" strokeLinecap="round"
                className={`${currentColor.text} transition-colors`}
                initial={{ strokeDashoffset: 880 }}
                animate={{ strokeDashoffset: 880 - (880 * progress) / 100 }}
                style={{ strokeDasharray: 880 }}
                transition={{ duration: 0.5 }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.div
                key={timeLeft}
                initial={{ scale: 1 }}
                animate={{ scale: timeLeft <= 10 && timeLeft > 0 ? [1, 1.05, 1] : 1 }}
                transition={{ duration: 1, repeat: timeLeft <= 10 && timeLeft > 0 ? Infinity : 0 }}
              >
                <p className={`text-7xl font-bold ${currentColor.lightText}`}>
                  {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </p>
              </motion.div>
              <p className="text-sm text-slate-600 dark:text-gray-400 mt-4 capitalize font-semibold">
                {mode === 'shortBreak' ? 'Short Break' : mode === 'longBreak' ? 'Long Break' : mode}
              </p>
              {completedSessions > 0 && (
                <p className="text-xs text-slate-500 dark:text-gray-500 mt-2 font-medium">
                  Session {completedSessions + 1}
                </p>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-4">
            <Button
              size="lg"
              onClick={isActive ? onPause : onStart}
              className={`${currentColor.buttonBg} ${currentColor.buttonText} hover:scale-110 transition-all duration-300 shadow-xl hover:shadow-2xl font-bold text-lg px-8`}
            >
              {isActive ? (
                <>
                  <Pause className="h-5 w-5 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  Start
                </>
              )}
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={onReset} 
              className="bg-gradient-to-br from-white to-slate-50 dark:from-gray-800 dark:to-gray-700 text-slate-800 dark:text-gray-300 border-2 border-slate-400 dark:border-gray-600 hover:border-slate-600 dark:hover:border-gray-500 hover:shadow-xl hover:shadow-slate-300/50 dark:hover:shadow-gray-700/50 hover:scale-105 transition-all duration-300 font-semibold"
            >
              <RotateCcw className="h-5 w-5 mr-2" />
              Reset
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={onToggleMute} 
              className="bg-gradient-to-br from-white to-slate-50 dark:from-gray-800 dark:to-gray-700 text-slate-800 dark:text-gray-300 border-2 border-slate-400 dark:border-gray-600 hover:border-slate-600 dark:hover:border-gray-500 hover:shadow-xl hover:shadow-slate-300/50 dark:hover:shadow-gray-700/50 hover:scale-105 transition-all duration-300 font-semibold"
            >
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
