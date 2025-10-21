'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Play, Pause, RotateCcw } from 'lucide-react'

export function FocusSession() {
  const [minutes, setMinutes] = useState(25)
  const [seconds, setSeconds] = useState(0)
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isActive && (minutes > 0 || seconds > 0)) {
      interval = setInterval(() => {
        if (seconds === 0) {
          if (minutes === 0) {
            setIsActive(false)
          } else {
            setMinutes(minutes - 1)
            setSeconds(59)
          }
        } else {
          setSeconds(seconds - 1)
        }
      }, 1000)
    } else if (!isActive && interval) {
      clearInterval(interval)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActive, minutes, seconds])

  const toggleTimer = () => setIsActive(!isActive)

  const resetTimer = () => {
    setIsActive(false)
    setMinutes(25)
    setSeconds(0)
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center space-y-8">
          {/* Timer Display */}
          <div className="text-8xl font-bold tabular-nums">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>

          {/* Controls */}
          <div className="flex gap-4">
            <Button
              size="lg"
              onClick={toggleTimer}
              className="w-32"
            >
              {isActive ? (
                <>
                  <Pause className="mr-2 h-5 w-5" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="mr-2 h-5 w-5" />
                  Start
                </>
              )}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={resetTimer}
            >
              <RotateCcw className="h-5 w-5" />
            </Button>
          </div>

          {/* Preset Times */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setMinutes(25); setSeconds(0); setIsActive(false); }}>
              25 min
            </Button>
            <Button variant="outline" onClick={() => { setMinutes(5); setSeconds(0); setIsActive(false); }}>
              5 min
            </Button>
            <Button variant="outline" onClick={() => { setMinutes(15); setSeconds(0); setIsActive(false); }}>
              15 min
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
