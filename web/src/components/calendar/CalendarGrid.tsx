'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'

interface CalendarGridProps {
  currentDate: Date
  selectedDate: Date | null
  onDateSelect: (date: Date) => void
  tasks: any[]
  loading: boolean
}

export function CalendarGrid({ currentDate, selectedDate, onDateSelect, tasks, loading }: CalendarGridProps) {
  const days = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const calendarDays = []

    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      calendarDays.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false
      })
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      calendarDays.push({
        date: new Date(year, month, day),
        isCurrentMonth: true
      })
    }

    // Next month days
    const remainingDays = 42 - calendarDays.length
    for (let day = 1; day <= remainingDays; day++) {
      calendarDays.push({
        date: new Date(year, month + 1, day),
        isCurrentMonth: false
      })
    }

    return calendarDays
  }, [currentDate])

  const getTasksForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return tasks.filter(task => task.dueDate?.startsWith(dateStr))
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isSelected = (date: Date) => {
    return selectedDate?.toDateString() === date.toDateString()
  }

  if (loading) {
    return <div className="text-center py-12 text-slate-500">Loading calendar...</div>
  }

  return (
    <div className="space-y-2">
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, index) => {
          const dayTasks = getTasksForDate(day.date)
          const hasTask = dayTasks.length > 0

          return (
            <button
              key={index}
              onClick={() => onDateSelect(day.date)}
              className={cn(
                'aspect-square p-2 rounded-lg text-sm transition-all duration-200',
                'hover:bg-slate-100 dark:hover:bg-slate-800',
                'focus:outline-none focus:ring-2 focus:ring-blue-500',
                !day.isCurrentMonth && 'text-slate-400 dark:text-slate-600',
                day.isCurrentMonth && 'text-slate-900 dark:text-white',
                isToday(day.date) && 'bg-blue-100 dark:bg-blue-900 font-bold',
                isSelected(day.date) && 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/50'
              )}
            >
              <div className="flex flex-col items-center justify-center h-full">
                <span>{day.date.getDate()}</span>
                {hasTask && (
                  <div className="flex gap-1 mt-1">
                    {dayTasks.slice(0, 3).map((_, i) => (
                      <div key={i} className="w-1 h-1 rounded-full bg-blue-600" />
                    ))}
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
