'use client'

import { useEffect, useState, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Edit2,
  Trash2,
  Moon,
  Sun as SunIcon,
  Clock,
  Check,
  Search,
  Filter,
  List,
  Grid,
  Bell,
  Repeat,
  Tag,
  MapPin,
  BarChart3,
  TrendingUp,
  Star
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { optimizedFetch } from '@/lib/performance'

interface CalendarEvent {
  id: string
  title: string
  description: string | null
  date: string
  hijriDate: string | null
  eventType: string
  createdAt: string
  location?: string
  color?: string
  isRecurring?: boolean
  recurrencePattern?: string
  reminder?: boolean
  isImportant?: boolean
}

interface HijriDate {
  day: number
  month: string
  monthAr: string
  year: number
  event?: string // Islamic holiday/event if present
}

interface CalendarDay {
  day: number
  month: number
  year: number
  isCurrentMonth: boolean
}

interface EventStats {
  total: number
  thisMonth: number
  upcoming: number
  byType: Record<string, number>
}

const EVENT_COLORS = {
  custom: { bg: 'bg-blue-100 dark:bg-blue-900/40', border: 'border-blue-500', text: 'text-blue-700 dark:text-blue-300' },
  islamic: { bg: 'bg-emerald-100 dark:bg-emerald-900/40', border: 'border-emerald-500', text: 'text-emerald-700 dark:text-emerald-300' },
  prayer: { bg: 'bg-purple-100 dark:bg-purple-900/40', border: 'border-purple-500', text: 'text-purple-700 dark:text-purple-300' },
  work: { bg: 'bg-orange-100 dark:bg-orange-900/40', border: 'border-orange-500', text: 'text-orange-700 dark:text-orange-300' },
  personal: { bg: 'bg-pink-100 dark:bg-pink-900/40', border: 'border-pink-500', text: 'text-pink-700 dark:text-pink-300' },
  family: { bg: 'bg-amber-100 dark:bg-amber-900/40', border: 'border-amber-500', text: 'text-amber-700 dark:text-amber-300' },
  health: { bg: 'bg-teal-100 dark:bg-teal-900/40', border: 'border-teal-500', text: 'text-teal-700 dark:text-teal-300' },
  reminder: { bg: 'bg-red-100 dark:bg-red-900/40', border: 'border-red-500', text: 'text-red-700 dark:text-red-300' }
}

export default function CalendarPage() {
  const { data: session } = useSession()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [showEventModal, setShowEventModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [loading, setLoading] = useState(false)
  const [hijriDate, setHijriDate] = useState<HijriDate & { formatted?: string } | null>(null)
  const [hijriDates, setHijriDates] = useState<Record<string, HijriDate>>({})
  const [hijriLoading, setHijriLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'calendar' | 'agenda'>('calendar')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [stats, setStats] = useState<EventStats>({ total: 0, thisMonth: 0, upcoming: 0, byType: {} })
  
  // Pagination states
  const [upcomingPage, setUpcomingPage] = useState(1)
  const [pastPage, setPastPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    date: '',
    eventType: 'custom',
    location: '',
    reminder: false,
    isImportant: false,
    isRecurring: false,
    recurrencePattern: 'none'
  })

  useEffect(() => {
    if (session?.user?.id) {
      // Clear old hijri cache formats on first load (v3 is the latest)
      const keys = Object.keys(sessionStorage)
      keys.forEach(key => {
        if (key.startsWith('hijri-') && !key.includes('hijri-v3-')) {
          sessionStorage.removeItem(key)
        }
      })
      
      fetchEvents()
      fetchHijriDate()
      fetchMonthHijriDates()
    }
  }, [session?.user?.id, currentDate])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const month = currentDate.getMonth() + 1
      const year = currentDate.getFullYear()

      const response = await optimizedFetch(`/api/events?month=${month}&year=${year}`, {
        timeout: 8000,
        retries: 2
      })

      if (response.ok) {
        const data = await response.json()
        setEvents(data.events || [])
      }
    } catch (error) {
      console.error('Failed to fetch events:', error)
      toast.error('Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  const fetchMonthHijriDates = async () => {
    try {
      setHijriLoading(true)
      const month = currentDate.getMonth() + 1
      const year = currentDate.getFullYear()

      // Only fetch current month
      const cacheKey = `hijri-v3-${year}-${month}`
      const cached = sessionStorage.getItem(cacheKey)
      
      if (cached) {
        setHijriDates(JSON.parse(cached))
      } else {
        // Fetch from API
        const response = await fetch(`/api/hijri/month?month=${month}&year=${year}`)
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data) {
            setHijriDates(data.data)
            sessionStorage.setItem(cacheKey, JSON.stringify(data.data))
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch month Hijri dates:', error)
    } finally {
      setHijriLoading(false)
    }
  }

  const fetchHijriDate = async () => {
    try {
      const today = new Date()
      const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`

      const response = await fetch(`/api/hijri/convert?date=${dateStr}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setHijriDate(data.data.hijri)
        }
      }
    } catch (error) {
      console.error('Failed to fetch Hijri date:', error)
    }
  }

  const createEvent = async () => {
    if (!eventForm.title.trim() || !eventForm.date) {
      toast.error('Please provide event title and date')
      return
    }

    try {
      const response = await optimizedFetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventForm),
        timeout: 8000
      })

      if (response.ok) {
        toast.success('✅ Event created successfully!')
        setShowEventModal(false)
        resetForm()
        await fetchEvents()
      } else {
        throw new Error('Failed to create event')
      }
    } catch (error) {
      console.error('Error creating event:', error)
      toast.error('Failed to create event')
    }
  }

  const updateEvent = async () => {
    if (!editingEvent || !eventForm.title.trim()) {
      toast.error('Please provide event title')
      return
    }

    try {
      const response = await optimizedFetch('/api/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...eventForm, id: editingEvent.id }),
        timeout: 8000
      })

      if (response.ok) {
        toast.success('✅ Event updated successfully!')
        setEditingEvent(null)
        setShowEventModal(false)
        resetForm()
        await fetchEvents()
      } else {
        throw new Error('Failed to update event')
      }
    } catch (error) {
      console.error('Error updating event:', error)
      toast.error('Failed to update event')
    }
  }

  const deleteEvent = async (eventId: string, eventTitle: string) => {
    // Custom delete confirmation modal
    toast.custom(
      (t) => (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl border-2 border-slate-300 dark:border-slate-700 p-5 max-w-md">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
              <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-slate-900 dark:text-white mb-1 text-base">
                Delete Event?
              </h4>
              <p className="text-sm text-slate-700 dark:text-slate-300 mb-4">
                Are you sure you want to delete <span className="font-semibold text-slate-900 dark:text-white">"{eventTitle}"</span>?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    toast.dismiss(t)
                    try {
                      const response = await optimizedFetch(`/api/events?id=${eventId}`, {
                        method: 'DELETE',
                        timeout: 8000
                      })

                      if (response.ok) {
                        toast.success('Event deleted successfully')
                        await fetchEvents()
                      } else {
                        throw new Error('Failed to delete event')
                      }
                    } catch (error) {
                      console.error('Error deleting event:', error)
                      toast.error('Failed to delete event')
                    }
                  }}
                  style={{ background: 'linear-gradient(to right, rgb(220 38 38), rgb(185 28 28))', color: 'white' }}
                  className="flex-1 px-4 py-2 rounded-md text-sm font-bold transition-all shadow-md hover:shadow-lg hover:scale-[1.02]"
                >
                  <span style={{ color: 'white' }} className="font-bold">Delete</span>
                </button>
                <button
                  onClick={() => toast.dismiss(t)}
                  className="flex-1 px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-md text-sm font-bold transition-all border-2 border-slate-300 dark:border-slate-600"
                >
                  <span className="text-slate-900 dark:text-white font-bold">Cancel</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ),
      { duration: Infinity }
    )
  }

  const resetForm = () => {
    setEventForm({
      title: '',
      description: '',
      date: '',
      eventType: 'custom',
      location: '',
      reminder: false,
      isImportant: false,
      isRecurring: false,
      recurrencePattern: 'none'
    })
  }

  const openCreateModal = (date?: Date) => {
    setEditingEvent(null)
    resetForm()
    if (date) {
      // Format date as YYYY-MM-DD in local timezone (not UTC to avoid timezone shift)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const localDateString = `${year}-${month}-${day}`
      
      setEventForm(prev => ({ 
        ...prev, 
        date: localDateString
      }))
    }
    setShowEventModal(true)
  }

  const openEditModal = (event: CalendarEvent) => {
    setEditingEvent(event)
    
    // Format date as YYYY-MM-DD in local timezone
    const eventDate = new Date(event.date)
    const year = eventDate.getFullYear()
    const month = String(eventDate.getMonth() + 1).padStart(2, '0')
    const day = String(eventDate.getDate()).padStart(2, '0')
    const localDateString = `${year}-${month}-${day}`
    
    setEventForm({
      title: event.title,
      description: event.description || '',
      date: localDateString,
      eventType: event.eventType,
      location: event.location || '',
      reminder: event.reminder || false,
      isImportant: event.isImportant || false,
      isRecurring: event.isRecurring || false,
      recurrencePattern: event.recurrencePattern || 'none'
    })
    setShowEventModal(true)
  }

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Calendar grid logic
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const generateCalendarDays = (): CalendarDay[] => {
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    const days: CalendarDay[] = []
    
    // Add empty cells for days before the first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push({
        day: 0, // 0 means empty cell
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
        isCurrentMonth: false
      })
    }

    // Current month's days only
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
        isCurrentMonth: true
      })
    }

    return days
  }

  const getEventsForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events.filter(event => event.date.startsWith(dateStr))
  }

  const isToday = (day: number) => {
    const today = new Date()
    return today.getDate() === day &&
           today.getMonth() === currentDate.getMonth() &&
           today.getFullYear() === currentDate.getFullYear()
  }

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })
  const calendarDays = generateCalendarDays()
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // Separate events into upcoming and past
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const upcomingEvents = events
    .filter(event => new Date(event.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  
  const pastEvents = events
    .filter(event => new Date(event.date) < today)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  
  // Calculate stats
  const eventStats = {
    total: events.length,
    upcoming: upcomingEvents.length,
    past: pastEvents.length,
    thisMonth: events.filter(event => {
      const eventDate = new Date(event.date)
      return eventDate.getMonth() === currentDate.getMonth() && 
             eventDate.getFullYear() === currentDate.getFullYear()
    }).length,
    thisWeek: events.filter(event => {
      const eventDate = new Date(event.date)
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - today.getDay())
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      return eventDate >= weekStart && eventDate <= weekEnd
    }).length
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-900 dark:from-white dark:via-indigo-200 dark:to-purple-200 bg-clip-text text-transparent flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-xl shadow-indigo-500/30 dark:shadow-indigo-500/20">
              <CalendarIcon className="h-7 w-7 text-white" strokeWidth={2.5} />
            </div>
            Calendar
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2 ml-1 font-medium">
            Plan your days with Islamic calendar integration
          </p>
        </div>
        <div className="text-right bg-gradient-to-br from-white to-indigo-50 dark:from-slate-800 dark:to-indigo-950/30 rounded-2xl px-6 py-4 shadow-lg border border-indigo-100 dark:border-indigo-900/50">
          {hijriDate && (
            <>
              <div className="flex items-center gap-2 justify-end text-sm text-slate-600 dark:text-slate-400 mb-1">
                <Moon className="h-4 w-4 text-indigo-500 dark:text-indigo-400" strokeWidth={2.5} />
                <span className="font-semibold">Hijri Date</span>
              </div>
              <div className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                {hijriDate.formatted}
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Stats Dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8"
      >
        <Card className="border-2 border-indigo-200 dark:border-indigo-900 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/50 dark:to-indigo-900/30 shadow-lg hover:shadow-xl transition-all hover:scale-105">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1">Total Events</p>
                <p className="text-3xl font-bold text-indigo-900 dark:text-indigo-200">{eventStats.total}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-500 dark:bg-indigo-600 flex items-center justify-center shadow-lg">
                <CalendarIcon className="h-6 w-6 text-white" strokeWidth={2.5} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-emerald-200 dark:border-emerald-900 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/50 dark:to-emerald-900/30 shadow-lg hover:shadow-xl transition-all hover:scale-105">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">Upcoming</p>
                <p className="text-3xl font-bold text-emerald-900 dark:text-emerald-200">{eventStats.upcoming}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500 dark:bg-emerald-600 flex items-center justify-center shadow-lg">
                <TrendingUp className="h-6 w-6 text-white" strokeWidth={2.5} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-amber-200 dark:border-amber-900 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/50 dark:to-amber-900/30 shadow-lg hover:shadow-xl transition-all hover:scale-105">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">This Week</p>
                <p className="text-3xl font-bold text-amber-900 dark:text-amber-200">{eventStats.thisWeek}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500 dark:bg-amber-600 flex items-center justify-center shadow-lg">
                <Clock className="h-6 w-6 text-white" strokeWidth={2.5} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200 dark:border-purple-900 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/30 shadow-lg hover:shadow-xl transition-all hover:scale-105">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-1">This Month</p>
                <p className="text-3xl font-bold text-purple-900 dark:text-purple-200">{eventStats.thisMonth}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-500 dark:bg-purple-600 flex items-center justify-center shadow-lg">
                <BarChart3 className="h-6 w-6 text-white" strokeWidth={2.5} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-slate-300 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/30 shadow-lg hover:shadow-xl transition-all hover:scale-105">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Past Events</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-200">{eventStats.past}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-slate-500 dark:bg-slate-600 flex items-center justify-center shadow-lg">
                <List className="h-6 w-6 text-white" strokeWidth={2.5} />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Calendar Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-2 border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-900 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-indigo-50/50 dark:from-slate-900/50 dark:to-indigo-950/30 border-b-2 border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-indigo-900 dark:from-white dark:to-indigo-200 bg-clip-text text-transparent">
                {monthName}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToToday}
                  className="border-2 border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 font-semibold shadow-sm transition-all hover:shadow-md hover:scale-105"
                >
                  <Clock className="h-4 w-4 mr-2 text-indigo-600 dark:text-indigo-400" strokeWidth={2.5} />
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToPreviousMonth}
                  className="border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-sm hover:shadow-md transition-all hover:scale-110"
                >
                  <ChevronLeft className="h-5 w-5 text-slate-700 dark:text-slate-300" strokeWidth={2.5} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToNextMonth}
                  className="border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-sm hover:shadow-md transition-all hover:scale-110"
                >
                  <ChevronRight className="h-5 w-5 text-slate-700 dark:text-slate-300" strokeWidth={2.5} />
                </Button>
                <Button
                  onClick={() => openCreateModal()}
                  className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold shadow-xl shadow-indigo-500/30 dark:shadow-indigo-500/20 border-0 transition-all hover:scale-105 hover:shadow-2xl"
                  style={{ background: 'linear-gradient(to right, rgb(99 102 241), rgb(168 85 247), rgb(236 72 153))' }}
                >
                  <Plus className="h-4 w-4 mr-2 text-white" strokeWidth={3} />
                  <span className="text-white font-bold">New Event</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Week days header */}
            <div className="grid grid-cols-7 gap-4 mb-4">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="text-center font-bold text-base bg-gradient-to-br from-slate-100 to-indigo-50 dark:from-slate-800 dark:to-indigo-950/30 text-slate-700 dark:text-slate-300 py-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-4">{calendarDays.map((dayObj, index) => {
                const day = dayObj.day
                const isCurrentMonth = dayObj.isCurrentMonth
                
                // Skip rendering empty cells (previous/next month placeholders)
                if (day === 0) {
                  return (
                    <div 
                      key={`empty-${index}`} 
                      className="h-44 rounded-xl bg-slate-50/30 dark:bg-slate-900/10 border border-slate-200/50 dark:border-slate-800/50"
                    />
                  )
                }
                
                const dayEvents = isCurrentMonth ? getEventsForDate(day) : []
                const isCurrentDay = isCurrentMonth && isToday(day)
                const hijriKey = `${dayObj.year}-${dayObj.month}-${day}`
                const hijriInfo = hijriDates[hijriKey]

                return (
                  <motion.div
                    key={`${dayObj.year}-${dayObj.month}-${day}-${index}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.01 }}
                    className={`
                      relative h-44 p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 group overflow-y-auto custom-scrollbar
                      ${isCurrentDay
                        ? 'border-indigo-500 dark:border-indigo-400 bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-50 dark:from-indigo-900/30 dark:via-purple-900/20 dark:to-pink-900/20 ring-4 ring-indigo-300/50 dark:ring-indigo-500/30 shadow-xl shadow-indigo-200/50 dark:shadow-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800/50 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-200/30 dark:hover:shadow-indigo-500/20 hover:scale-[1.02] hover:z-10 hover:bg-gradient-to-br hover:from-indigo-50 hover:via-purple-50 hover:to-pink-50 dark:hover:from-indigo-900/20 dark:hover:via-purple-900/15 dark:hover:to-pink-900/15'
                      }
                    `}
                    onClick={() => openCreateModal(new Date(dayObj.year, dayObj.month - 1, day))}
                  >
                    {/* Gregorian Day Number */}
                    <div className={`
                      text-xl font-bold mb-2 transition-all duration-200
                      ${isCurrentDay
                        ? 'text-indigo-700 dark:text-indigo-300 text-2xl'
                        : isCurrentMonth
                        ? 'text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:text-2xl'
                        : 'text-slate-400 dark:text-slate-600'
                      }
                    `}>
                      {day}
                    </div>

                    {/* Hijri Date & Islamic Events */}
                    {hijriInfo ? (
                      <div className="space-y-2 mb-2">
                        {/* Hijri Date Badge */}
                        <div className={`
                          flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all shadow-sm
                          ${isCurrentDay 
                            ? 'bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/50 dark:to-teal-900/50 border border-emerald-300 dark:border-emerald-700' 
                            : 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200 dark:border-emerald-800 group-hover:from-emerald-100 group-hover:to-teal-100 dark:group-hover:from-emerald-900/50 dark:group-hover:to-teal-900/50'
                          }
                        `}>
                          <Moon className={`h-4 w-4 flex-shrink-0 ${isCurrentDay ? 'text-emerald-600 dark:text-emerald-400' : 'text-emerald-500 dark:text-emerald-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400'}`} strokeWidth={2.5} />
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className={`text-xs font-bold leading-snug break-words ${isCurrentDay ? 'text-emerald-800 dark:text-emerald-200' : 'text-emerald-700 dark:text-emerald-300 group-hover:text-emerald-800 dark:group-hover:text-emerald-200'}`}>
                              {Math.floor(hijriInfo.day)} {hijriInfo.month}
                            </span>
                            <span className={`text-[10px] font-semibold ${isCurrentDay ? 'text-emerald-600 dark:text-emerald-400' : 'text-emerald-500 dark:text-emerald-500'}`}>
                              {hijriInfo.year} AH
                            </span>
                          </div>
                        </div>
                        
                        {/* Islamic Holiday/Event Badge */}
                        {hijriInfo.event && (
                          <div className={`
                            text-[11px] px-2.5 py-2 rounded-lg font-bold break-words text-center leading-snug
                            bg-gradient-to-r from-amber-200 via-yellow-200 to-amber-200 
                            dark:from-amber-800/70 dark:via-yellow-800/70 dark:to-amber-800/70
                            text-amber-900 dark:text-amber-100
                            border-2 border-amber-400 dark:border-amber-600
                            shadow-md animate-pulse
                            hover:scale-105 transition-transform
                          `} title={hijriInfo.event}>
                            🌙 {hijriInfo.event}
                          </div>
                        )}
                      </div>
                    ) : hijriLoading ? (
                      <div className="mb-2 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 animate-pulse h-5 w-24"></div>
                    ) : null}

                    {/* Events */}
                    <div className="space-y-1.5">
                      {dayEvents.slice(0, 2).map((event) => (
                        <div
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            openEditModal(event)
                          }}
                          className="text-[11px] px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 dark:from-indigo-900/60 dark:via-purple-900/50 dark:to-pink-900/50 text-indigo-800 dark:text-indigo-200 line-clamp-2 hover:from-indigo-300 hover:via-purple-300 hover:to-pink-300 dark:hover:from-indigo-900/80 dark:hover:via-purple-900/70 dark:hover:to-pink-900/70 font-semibold transition-all hover:scale-105 shadow-sm hover:shadow-md border border-indigo-300/50 dark:border-indigo-700/50 cursor-pointer leading-snug"
                        >
                          📅 {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-[11px] text-slate-700 dark:text-slate-300 px-2 font-bold bg-slate-100 dark:bg-slate-800 rounded-lg py-1 border border-slate-300 dark:border-slate-700 text-center">
                          +{dayEvents.length - 2} more events
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Events List - Split into Upcoming and Past */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-2 border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-b-2 border-emerald-100 dark:border-emerald-900/50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-2xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg">
                    <TrendingUp className="h-5 w-5 text-white" strokeWidth={2.5} />
                  </div>
                  Upcoming Events
                </CardTitle>
                {upcomingEvents.length > 0 && (
                  <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50 px-3 py-1 rounded-full">
                    {upcomingEvents.length} total
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {upcomingEvents.length === 0 ? (
                <div className="text-center py-12 bg-gradient-to-br from-slate-50 to-emerald-50 dark:from-slate-900 dark:to-emerald-950/30 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700">
                  <TrendingUp className="h-16 w-16 mx-auto mb-4 text-slate-400 dark:text-slate-600" strokeWidth={1.5} />
                  <p className="font-bold text-lg text-slate-700 dark:text-slate-300 mb-2">No upcoming events</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Create events for future dates</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {upcomingEvents.slice(0, upcomingPage * ITEMS_PER_PAGE).map((event, index) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="flex items-center justify-between p-4 rounded-xl border-2 border-emerald-200 dark:border-emerald-900 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 group"
                      >
                        <div className="flex-1">
                          <h4 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {event.title}
                          </h4>
                          {event.description && (
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-1">
                              {event.description}
                            </p>
                          )}
                          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mt-2 bg-emerald-100 dark:bg-emerald-900/50 inline-block px-3 py-1 rounded-full">
                            {new Date(event.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditModal(event)}
                            className="h-8 w-8 text-blue-600 hover:bg-blue-100 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded-lg shadow-sm hover:shadow-md transition-all hover:scale-110"
                          >
                            <Edit2 className="h-4 w-4" strokeWidth={2.5} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteEvent(event.id, event.title)}
                            className="h-8 w-8 text-red-600 hover:bg-red-100 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/50 rounded-lg shadow-sm hover:shadow-md transition-all hover:scale-110"
                          >
                            <Trash2 className="h-4 w-4" strokeWidth={2.5} />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  
                  {/* Load More Button */}
                  {upcomingEvents.length > upcomingPage * ITEMS_PER_PAGE && (
                    <div className="mt-4 text-center">
                      <Button
                        onClick={() => setUpcomingPage(prev => prev + 1)}
                        variant="outline"
                        className="border-2 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 font-semibold shadow-sm transition-all hover:scale-105"
                      >
                        Load More ({upcomingEvents.length - upcomingPage * ITEMS_PER_PAGE} remaining)
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Past Events */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-2 border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-gray-900/30 border-b-2 border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-2xl font-bold bg-gradient-to-r from-slate-700 to-gray-700 dark:from-slate-400 dark:to-gray-400 bg-clip-text text-transparent">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-400 to-gray-500 flex items-center justify-center shadow-lg">
                    <List className="h-5 w-5 text-white" strokeWidth={2.5} />
                  </div>
                  Past Events
                </CardTitle>
                {pastEvents.length > 0 && (
                  <div className="text-sm font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                    {pastEvents.length} total
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {pastEvents.length === 0 ? (
                <div className="text-center py-12 bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900 dark:to-gray-950/30 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700">
                  <List className="h-16 w-16 mx-auto mb-4 text-slate-400 dark:text-slate-600" strokeWidth={1.5} />
                  <p className="font-bold text-lg text-slate-700 dark:text-slate-300 mb-2">No past events</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Past events will appear here</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {pastEvents.slice(0, pastPage * ITEMS_PER_PAGE).map((event, index) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="flex items-center justify-between p-4 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900 dark:to-gray-900/50 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 group opacity-75 hover:opacity-100"
                      >
                        <div className="flex-1">
                          <h4 className="font-bold text-base text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                            {event.title}
                          </h4>
                          {event.description && (
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-1">
                              {event.description}
                            </p>
                          )}
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-500 mt-2 bg-slate-100 dark:bg-slate-800 inline-block px-3 py-1 rounded-full">
                            {new Date(event.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditModal(event)}
                            className="h-8 w-8 text-blue-600 hover:bg-blue-100 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded-lg shadow-sm hover:shadow-md transition-all hover:scale-110"
                          >
                            <Edit2 className="h-4 w-4" strokeWidth={2.5} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteEvent(event.id, event.title)}
                            className="h-8 w-8 text-red-600 hover:bg-red-100 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/50 rounded-lg shadow-sm hover:shadow-md transition-all hover:scale-110"
                          >
                            <Trash2 className="h-4 w-4" strokeWidth={2.5} />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  
                  {/* Load More Button */}
                  {pastEvents.length > pastPage * ITEMS_PER_PAGE && (
                    <div className="mt-4 text-center">
                      <Button
                        onClick={() => setPastPage(prev => prev + 1)}
                        variant="outline"
                        className="border-2 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 font-semibold shadow-sm transition-all hover:scale-105"
                      >
                        Load More ({pastEvents.length - pastPage * ITEMS_PER_PAGE} remaining)
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Event Modal */}
      <AnimatePresence>
        {showEventModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-lg z-50 flex items-center justify-center p-4"
            onClick={() => setShowEventModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-white via-slate-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950/50 rounded-2xl p-8 w-full max-w-lg shadow-2xl border-2 border-slate-300 dark:border-slate-700"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-indigo-900 dark:from-white dark:to-indigo-200 bg-clip-text text-transparent">
                  {editingEvent ? 'Edit Event' : 'Create Event'}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowEventModal(false)}
                  className="rounded-xl text-slate-700 dark:text-slate-300 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-all hover:scale-110"
                >
                  <X className="h-5 w-5" strokeWidth={2.5} />
                </Button>
              </div>

              <div className="space-y-5">
                <div>
                  <Label htmlFor="event-title" className="text-slate-900 dark:text-slate-100 font-bold text-sm">Event Title *</Label>
                  <Input
                    id="event-title"
                    value={eventForm.title}
                    onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                    placeholder="Enter event title"
                    className="mt-2 text-slate-900 dark:text-white bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-500 dark:focus:border-indigo-400 rounded-xl shadow-sm"
                    autoFocus
                  />
                </div>

                <div>
                  <Label htmlFor="event-date" className="text-slate-900 dark:text-slate-100 font-bold text-sm">Date *</Label>
                  <Input
                    id="event-date"
                    type="date"
                    value={eventForm.date}
                    onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                    className="mt-2 text-slate-900 dark:text-white bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 focus:border-indigo-500 dark:focus:border-indigo-400 rounded-xl shadow-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="event-description" className="text-slate-900 dark:text-slate-100 font-bold text-sm">Description</Label>
                  <Textarea
                    id="event-description"
                    value={eventForm.description}
                    onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                    placeholder="Add event details..."
                    className="mt-2 min-h-[100px] text-slate-900 dark:text-white bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-500 dark:focus:border-indigo-400 rounded-xl shadow-sm"
                    rows={4}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 mt-8">
                <Button
                  onClick={editingEvent ? updateEvent : createEvent}
                  className="flex-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 font-bold shadow-xl shadow-indigo-500/30 dark:shadow-indigo-500/20 border-0 h-12 text-base transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(to right, rgb(99 102 241), rgb(168 85 247), rgb(236 72 153))' }}
                >
                  <Check className="h-5 w-5 mr-2 text-white" strokeWidth={3} />
                  <span className="text-white font-bold">{editingEvent ? 'Update Event' : 'Create Event'}</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowEventModal(false)}
                  className="text-slate-900 dark:text-slate-100 font-bold border-2 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 h-12 px-6 rounded-xl transition-all hover:scale-105"
                >
                  <span className="text-slate-900 dark:text-slate-100">Cancel</span>
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
