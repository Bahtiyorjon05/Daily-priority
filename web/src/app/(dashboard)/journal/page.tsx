'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen,
  Plus,
  Trash2,
  X,
  Save,
  Heart,
  Calendar,
  Sparkles,
  Search,
  MessageSquare,
  TrendingUp,
  Award,
  Flame,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  BarChart3,
  PieChart
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface JournalEntry {
  id: string
  date: string
  hijriDate?: string | null
  gratitude1?: string | null
  gratitude2?: string | null
  gratitude3?: string | null
  goodDeeds?: string | null
  lessons?: string | null
  duas?: string | null
  reflection?: string | null
  mood?: string | null
  createdAt: string
  updatedAt: string
}

const MOODS = [
  { value: 'happy', emoji: '😊', label: 'Happy', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
  { value: 'grateful', emoji: '🙏', label: 'Grateful', bg: 'bg-pink-100 dark:bg-pink-900/30' },
  { value: 'peaceful', emoji: '😌', label: 'Peaceful', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  { value: 'neutral', emoji: '😐', label: 'Neutral', bg: 'bg-gray-100 dark:bg-gray-800' },
  { value: 'sad', emoji: '😔', label: 'Sad', bg: 'bg-indigo-100 dark:bg-indigo-900/30' },
]

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [viewingEntry, setViewingEntry] = useState<JournalEntry | null>(null)
  const [showStats, setShowStats] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [moodFilter, setMoodFilter] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  
  const [currentPage, setCurrentPage] = useState(1)
  const entriesPerPage = 9

  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    gratitude1: '',
    gratitude2: '',
    gratitude3: '',
    goodDeeds: '',
    lessons: '',
    duas: '',
    reflection: '',
    mood: 'neutral'
  })

  useEffect(() => {
    fetchEntries()
  }, [])

  const fetchEntries = async () => {
    try {
      const response = await fetch('/api/journal')
      const data = await response.json()
      if (data.entries) {
        setEntries(data.entries.sort((a: JournalEntry, b: JournalEntry) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        ))
      }
    } catch (error) {
      console.error('Failed to fetch journal entries:', error)
    } finally {
      setLoading(false)
    }
  }

  const createEntry = async () => {
    // Validate ALL fields are required
    const errors = []
    
    if (!newEntry.gratitude1?.trim()) errors.push('First gratitude')
    if (!newEntry.gratitude2?.trim()) errors.push('Second gratitude')
    if (!newEntry.gratitude3?.trim()) errors.push('Third gratitude')
    if (!newEntry.goodDeeds?.trim()) errors.push('Good deeds')
    if (!newEntry.lessons?.trim()) errors.push('Lessons learned')
    if (!newEntry.duas?.trim()) errors.push('Duas & prayers')
    if (!newEntry.reflection?.trim()) errors.push('Daily reflection')
    
    if (errors.length > 0) {
      setValidationErrors(errors)
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEntry)
      })
      
      if (response.ok) {
        const { entry } = await response.json()
        
        // Optimistic update
        setEntries(prev => [entry, ...prev].sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        ))
        
        setShowCreateModal(false)
        setNewEntry({
          date: new Date().toISOString().split('T')[0],
          gratitude1: '',
          gratitude2: '',
          gratitude3: '',
          goodDeeds: '',
          lessons: '',
          duas: '',
          reflection: '',
          mood: 'neutral'
        })
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create entry')
      }
    } catch (error) {
      console.error('Failed to create entry:', error)
      alert('Failed to create entry. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const confirmDeleteEntry = async (id: string) => {
    setSaving(true)
    try {
      const response = await fetch(`/api/journal/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        // Optimistic update
        setEntries(prev => prev.filter(e => e.id !== id))
        setDeleteConfirm(null)
        if (viewingEntry?.id === id) {
          setViewingEntry(null)
        }
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete entry')
      }
    } catch (error) {
      console.error('Failed to delete entry:', error)
      alert('Failed to delete entry. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const filteredEntries = useMemo(() => {
    let filtered = entries

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(entry =>
        entry.gratitude1?.toLowerCase().includes(query) ||
        entry.gratitude2?.toLowerCase().includes(query) ||
        entry.gratitude3?.toLowerCase().includes(query) ||
        entry.goodDeeds?.toLowerCase().includes(query) ||
        entry.lessons?.toLowerCase().includes(query) ||
        entry.duas?.toLowerCase().includes(query) ||
        entry.reflection?.toLowerCase().includes(query)
      )
    }

    if (moodFilter) {
      filtered = filtered.filter(entry => entry.mood === moodFilter)
    }

    return filtered
  }, [entries, searchQuery, moodFilter])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, moodFilter])

  const paginatedEntries = useMemo(() => {
    const startIndex = (currentPage - 1) * entriesPerPage
    return filteredEntries.slice(startIndex, startIndex + entriesPerPage)
  }, [filteredEntries, currentPage])

  const totalPages = Math.ceil(filteredEntries.length / entriesPerPage)

  const stats = useMemo(() => {
    if (entries.length === 0) {
      return {
        totalEntries: 0,
        thisMonthEntries: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalGratitudes: 0,
        totalGoodDeeds: 0,
        totalLessons: 0,
        totalDuas: 0,
        moodStats: [],
        avgPerMonth: 0
      }
    }

    // Calculate streaks correctly
    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const entryDates = new Set(
      entries.map(e => {
        const d = new Date(e.date)
        d.setHours(0, 0, 0, 0)
        return d.getTime()
      })
    )

    // Check current streak starting from today
    let checkDate = new Date(today)
    let foundGap = false
    
    for (let i = 0; i < 365; i++) {
      const dateTime = checkDate.getTime()
      if (entryDates.has(dateTime)) {
        if (!foundGap) {
          currentStreak++
        }
        tempStreak++
        longestStreak = Math.max(longestStreak, tempStreak)
      } else {
        if (i === 0) {
          // No entry today, current streak is 0
          currentStreak = 0
          foundGap = true
        } else {
          foundGap = true
          tempStreak = 0
        }
      }
      checkDate.setDate(checkDate.getDate() - 1)
    }

    const thisMonth = entries.filter(e => {
      const entryDate = new Date(e.date)
      return entryDate.getMonth() === today.getMonth() && entryDate.getFullYear() === today.getFullYear()
    }).length

    const totalGratitudes = entries.reduce((sum, e) => 
      sum + [e.gratitude1, e.gratitude2, e.gratitude3].filter(Boolean).length, 0
    )

    const totalGoodDeeds = entries.filter(e => e.goodDeeds?.trim()).length
    const totalLessons = entries.filter(e => e.lessons?.trim()).length
    const totalDuas = entries.filter(e => e.duas?.trim()).length

    const moodCounts = entries.reduce((acc, e) => {
      if (e.mood) acc[e.mood] = (acc[e.mood] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const moodStats = Object.entries(moodCounts).map(([mood, count]) => ({
      mood,
      count,
      percentage: Math.round((count / entries.length) * 100)
    }))

    const sortedDates = entries.map(e => new Date(e.date).getTime()).sort((a, b) => a - b)
    const firstEntryDate = new Date(sortedDates[0])
    const monthsDiff = Math.max(1, (today.getFullYear() - firstEntryDate.getFullYear()) * 12 + 
                       (today.getMonth() - firstEntryDate.getMonth()) + 1)

    return {
      totalEntries: entries.length,
      thisMonthEntries: thisMonth,
      currentStreak,
      longestStreak,
      totalGratitudes,
      totalGoodDeeds,
      totalLessons,
      totalDuas,
      moodStats,
      avgPerMonth: Math.round(entries.length / monthsDiff)
    }
  }, [entries])

  const EntryCard = ({ entry }: { entry: JournalEntry }) => {
    const mood = MOODS.find(m => m.value === entry.mood)
    const contentCount = [
      entry.gratitude1,
      entry.gratitude2,
      entry.gratitude3,
      entry.goodDeeds,
      entry.lessons,
      entry.duas,
      entry.reflection
    ].filter(Boolean).length

    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        <Card
          className="h-full hover:shadow-xl transition-all duration-300 cursor-pointer group border-2 hover:border-emerald-500 dark:hover:border-emerald-700"
          onClick={() => setViewingEntry(entry)}
        >
          <CardHeader className={`pb-3 ${mood?.bg || 'bg-gray-100 dark:bg-gray-800'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-4xl select-none flex items-center justify-center w-12 h-12" role="img" aria-label={mood?.label || 'Entry'}>
                  {mood?.emoji || '📝'}
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900 dark:text-gray-100">
                    {new Date(entry.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </CardTitle>
                  {entry.hijriDate && (
                    <p className="text-xs text-slate-600 dark:text-gray-400">{entry.hijriDate}</p>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation()
                  setDeleteConfirm(entry.id)
                }}
              >
                <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-2">
              {entry.gratitude1 && (
                <p className="text-sm text-slate-700 dark:text-gray-300 line-clamp-1">
                  <span className="font-semibold">💛 Gratitude:</span> {entry.gratitude1}
                </p>
              )}
              {entry.goodDeeds && (
                <p className="text-sm text-slate-700 dark:text-gray-300 line-clamp-1">
                  <span className="font-semibold">✨ Good Deed:</span> {entry.goodDeeds}
                </p>
              )}
              {entry.reflection && (
                <p className="text-sm text-slate-600 dark:text-gray-400 line-clamp-1">
                  <span className="font-semibold">💭 Reflection:</span> {entry.reflection}
                </p>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="text-xs text-slate-500 dark:text-gray-500 font-medium">
                  Complete entry with {contentCount} sections
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  style={{
                    color: '#059669'
                  }}
                  className="dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                  onClick={(e) => {
                    e.stopPropagation()
                    setViewingEntry(entry)
                  }}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View Full
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-emerald-600 dark:text-emerald-400 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-600 dark:text-gray-400">Loading your journal...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-gray-100">Gratitude Journal</h1>
            <p className="text-sm text-slate-600 dark:text-gray-400 font-medium">
              {entries.length} {entries.length === 1 ? 'entry' : 'entries'} recorded
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowStats(!showStats)}
            style={{
              background: 'white',
              borderColor: '#e5e7eb',
              color: '#1f2937'
            }}
            className="dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 hover:bg-slate-50 dark:hover:bg-gray-700"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            {showStats ? 'Hide' : 'Show'} Stats
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
            style={{
              background: 'linear-gradient(135deg, #059669 0%, #14b8a6 100%)',
              color: 'white',
              border: 'none'
            }}
            className="shadow-lg hover:opacity-90"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Entry
          </Button>
        </div>
      </div>

      {showStats && stats && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Card className="border-2 border-purple-300 dark:border-purple-700 shadow-xl">
            <CardHeader>
              <CardTitle className="text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Journal Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs text-slate-600 dark:text-gray-400 font-medium">Total Entries</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.totalEntries}</p>
                </div>

                <div className="p-4 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-xs text-slate-600 dark:text-gray-400 font-medium">This Month</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{stats.thisMonthEntries}</p>
                </div>

                <div className="p-4 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Flame className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    <span className="text-xs text-slate-600 dark:text-gray-400 font-medium">Current Streak</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{stats.currentStreak} days</p>
                </div>

                <div className="p-4 rounded-lg bg-pink-100 dark:bg-pink-900/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Heart className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                    <span className="text-xs text-slate-600 dark:text-gray-400 font-medium">Gratitudes</span>
                  </div>
                  <p className="text-2xl font-bold text-pink-700 dark:text-pink-300">{stats.totalGratitudes}</p>
                </div>

                <div className="p-4 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-xs text-slate-600 dark:text-gray-400 font-medium">Good Deeds</span>
                  </div>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.totalGoodDeeds}</p>
                </div>

                <div className="p-4 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xs text-slate-600 dark:text-gray-400 font-medium">Lessons</span>
                  </div>
                  <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{stats.totalLessons}</p>
                </div>

                <div className="p-4 rounded-lg bg-teal-100 dark:bg-teal-900/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Heart className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    <span className="text-xs text-slate-600 dark:text-gray-400 font-medium">Duas</span>
                  </div>
                  <p className="text-2xl font-bold text-teal-700 dark:text-teal-300">{stats.totalDuas}</p>
                </div>

                <div className="p-4 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Award className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    <span className="text-xs text-slate-600 dark:text-gray-400 font-medium">Longest Streak</span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{stats.longestStreak} days</p>
                </div>

                <div className="p-4 rounded-lg bg-cyan-100 dark:bg-cyan-900/30">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                    <span className="text-xs text-slate-600 dark:text-gray-400 font-medium">Avg/Month</span>
                  </div>
                  <p className="text-2xl font-bold text-cyan-700 dark:text-cyan-300">{stats.avgPerMonth}</p>
                </div>

              <div className="col-span-2 md:col-span-3 p-4 rounded-lg bg-gray-100 dark:bg-gray-800">
                <h4 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-3">Mood Breakdown</h4>
                {stats.moodStats.length > 0 ? (
                  <div className="grid grid-cols-5 gap-2">
                    {stats.moodStats
                      .filter(({ mood }) => mood && mood.trim())
                      .map(({ mood, count, percentage }) => {
                        const moodData = MOODS.find(m => m.value === mood)
                        return (
                          <div key={mood} className="text-center">
                            <div className="text-2xl mb-1">{moodData?.emoji}</div>
                            <p className="text-xs text-slate-600 dark:text-gray-400 font-medium">{count}</p>
                            <p className="text-xs text-slate-500 dark:text-gray-500">({percentage}%)</p>
                          </div>
                        )
                      })}
                  </div>
                ) : (
                  <p className="text-center text-sm text-slate-500 dark:text-gray-500 py-4">
                    No mood data yet. Start journaling to track your emotions!
                  </p>
                )}
              </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white dark:bg-gray-800"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-600 dark:text-gray-400" />
          {MOODS.map(mood => (
            <Button
              key={mood.value}
              variant={moodFilter === mood.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMoodFilter(moodFilter === mood.value ? null : mood.value)}
              style={
                moodFilter === mood.value
                  ? {
                      background: mood.value === 'happy' ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' :
                                  mood.value === 'grateful' ? 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)' :
                                  mood.value === 'peaceful' ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' :
                                  mood.value === 'neutral' ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)' :
                                  'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                      color: 'white',
                      border: 'none'
                    }
                  : undefined
              }
              className={moodFilter !== mood.value ? 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700' : ''}
            >
              {mood.emoji}
            </Button>
          ))}
          {moodFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMoodFilter(null)}
              className="hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {filteredEntries.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen className="h-16 w-16 text-slate-400 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-700 dark:text-gray-300 mb-2">
            {searchQuery || moodFilter ? 'No entries found' : 'No entries yet'}
          </h3>
          <p className="text-slate-500 dark:text-gray-400 mb-6">
            {searchQuery || moodFilter 
              ? 'Try adjusting your search or filters'
              : 'Start your gratitude journey by creating your first entry'}
          </p>
          {!searchQuery && !moodFilter && (
            <Button
              onClick={() => setShowCreateModal(true)}
              style={{
                background: 'linear-gradient(135deg, #059669 0%, #14b8a6 100%)',
                color: 'white',
                border: 'none'
              }}
              className="shadow-lg hover:opacity-90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create First Entry
            </Button>
          )}
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {paginatedEntries.map((entry) => (
                <EntryCard key={entry.id} entry={entry} />
              ))}
            </AnimatePresence>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  background: currentPage === 1 ? '#f3f4f6' : 'white',
                  borderColor: '#e5e7eb',
                  color: currentPage === 1 ? '#9ca3af' : '#1f2937'
                }}
                className="dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:disabled:bg-gray-900 dark:disabled:text-gray-600"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-slate-600 dark:text-gray-400 font-medium">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{
                  background: currentPage === totalPages ? '#f3f4f6' : 'white',
                  borderColor: '#e5e7eb',
                  color: currentPage === totalPages ? '#9ca3af' : '#1f2937'
                }}
                className="dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:disabled:bg-gray-900 dark:disabled:text-gray-600"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            key="create-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-gray-100">New Journal Entry</h2>
                    <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                      <span className="text-red-500">★</span> 
                      All fields are required for a complete entry
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setShowCreateModal(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <Label className="text-slate-700 dark:text-gray-300 font-semibold">Date</Label>
                  <Input
                    type="date"
                    value={newEntry.date}
                    onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                    className="mt-2"
                  />
                </div>

                <div className="p-4 rounded-lg bg-pink-50 dark:bg-pink-900/20 border-2 border-pink-300 dark:border-pink-700">
                  <Label className="text-pink-700 dark:text-pink-300 font-bold flex items-center gap-2 mb-3">
                    <Heart className="h-5 w-5" />
                    Three Things I'm Grateful For
                    <span className="text-red-500 text-lg">★</span>
                  </Label>
                  <div className="space-y-3">
                    <Input
                      placeholder="Something that made you smile today..."
                      value={newEntry.gratitude1}
                      onChange={(e) => setNewEntry({ ...newEntry, gratitude1: e.target.value })}
                      className="bg-white dark:bg-gray-800 border-2"
                    />
                    <Input
                      placeholder="Someone you appreciate..."
                      value={newEntry.gratitude2}
                      onChange={(e) => setNewEntry({ ...newEntry, gratitude2: e.target.value })}
                      className="bg-white dark:bg-gray-800 border-2"
                    />
                    <Input
                      placeholder="A blessing in your life..."
                      value={newEntry.gratitude3}
                      onChange={(e) => setNewEntry({ ...newEntry, gratitude3: e.target.value })}
                      className="bg-white dark:bg-gray-800 border-2"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-700">
                  <Label className="text-yellow-700 dark:text-yellow-300 font-bold flex items-center gap-2 mb-3">
                    <Sparkles className="h-5 w-5" />
                    Good Deeds Today
                    <span className="text-red-500 text-lg">★</span>
                  </Label>
                  <Textarea
                    placeholder="Acts of kindness, help given, charity..."
                    value={newEntry.goodDeeds}
                    onChange={(e) => setNewEntry({ ...newEntry, goodDeeds: e.target.value })}
                    rows={3}
                    className="bg-white dark:bg-gray-800 border-2"
                  />
                </div>

                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700">
                  <Label className="text-blue-700 dark:text-blue-300 font-bold flex items-center gap-2 mb-3">
                    <MessageSquare className="h-5 w-5" />
                    Lessons Learned
                    <span className="text-red-500 text-lg">★</span>
                  </Label>
                  <Textarea
                    placeholder="What insights or wisdom did you gain today..."
                    value={newEntry.lessons}
                    onChange={(e) => setNewEntry({ ...newEntry, lessons: e.target.value })}
                    rows={3}
                    className="bg-white dark:bg-gray-800 border-2"
                  />
                </div>

                <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-300 dark:border-purple-700">
                  <Label className="text-purple-700 dark:text-purple-300 font-bold flex items-center gap-2 mb-3">
                    <Heart className="h-5 w-5" />
                    Duas & Prayers
                    <span className="text-red-500 text-lg">★</span>
                  </Label>
                  <Textarea
                    placeholder="Prayers you made, spiritual moments..."
                    value={newEntry.duas}
                    onChange={(e) => setNewEntry({ ...newEntry, duas: e.target.value })}
                    rows={3}
                    className="bg-white dark:bg-gray-800 border-2"
                  />
                </div>

                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700">
                  <Label className="text-green-700 dark:text-green-300 font-bold flex items-center gap-2 mb-3">
                    <BookOpen className="h-5 w-5" />
                    Daily Reflection
                    <span className="text-red-500 text-lg">★</span>
                  </Label>
                  <Textarea
                    placeholder="How was your day? What stood out..."
                    value={newEntry.reflection}
                    onChange={(e) => setNewEntry({ ...newEntry, reflection: e.target.value })}
                    rows={4}
                    className="bg-white dark:bg-gray-800 border-2"
                  />
                </div>

                <div>
                  <Label className="text-slate-700 dark:text-gray-300 font-semibold mb-3 flex items-center gap-2">
                    How do you feel today?
                    <span className="text-red-500 text-lg">★</span>
                  </Label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
                    {MOODS.map(mood => {
                      const isSelected = newEntry.mood === mood.value
                      return (
                        <button
                          key={mood.value}
                          type="button"
                          onClick={() => setNewEntry({ ...newEntry, mood: mood.value })}
                          className={`p-2 sm:p-4 rounded-xl text-center transition-all transform hover:scale-105 ${
                            isSelected
                              ? 'ring-4 ring-emerald-500 dark:ring-emerald-400 scale-105 shadow-lg'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700 shadow-sm'
                          }`}
                          style={{
                            background: isSelected
                              ? (mood.value === 'happy' ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' :
                                 mood.value === 'grateful' ? 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)' :
                                 mood.value === 'peaceful' ? 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)' :
                                 mood.value === 'neutral' ? 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)' :
                                 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)')
                              : 'transparent',
                            border: isSelected ? '2px solid #10b981' : '2px solid #e5e7eb'
                          }}
                        >
                          <div className="text-4xl mb-2 select-none" role="img" aria-label={mood.label}>
                            {mood.emoji}
                          </div>
                          <p className={`text-xs font-semibold ${
                            isSelected
                              ? 'text-slate-900 dark:text-gray-100'
                              : 'text-slate-600 dark:text-gray-400'
                          }`}>
                            {mood.label}
                          </p>
                        </button>
                      )
                    })}
                  </div>

                  {/* Selected mood preview */}
                  {newEntry.mood && (
                    <div className="mt-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-300 dark:border-emerald-700">
                      <p className="text-sm text-center text-emerald-700 dark:text-emerald-300 font-medium flex items-center justify-center gap-2">
                        <span className="text-2xl">{MOODS.find(m => m.value === newEntry.mood)?.emoji}</span>
                        <span>You feel {MOODS.find(m => m.value === newEntry.mood)?.label?.toLowerCase()} today</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6 flex gap-3">
                <Button
                  onClick={createEntry}
                  disabled={saving}
                  style={{
                    background: saving ? '#9ca3af' : 'linear-gradient(135deg, #059669 0%, #14b8a6 100%)',
                    color: 'white',
                    border: 'none'
                  }}
                  className="flex-1 font-semibold shadow-lg hover:opacity-90 disabled:opacity-60"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Entry'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  disabled={saving}
                  style={{
                    background: 'white',
                    borderColor: '#e5e7eb',
                    color: '#1f2937'
                  }}
                  className="dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-60"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {viewingEntry && (
          <motion.div
            key="view-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={() => setViewingEntry(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 shadow-lg">
                      <span className="text-5xl select-none" role="img" aria-label={MOODS.find(m => m.value === viewingEntry.mood)?.label || 'Entry'}>
                        {MOODS.find(m => m.value === viewingEntry.mood)?.emoji || '📝'}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-gray-100">
                        {new Date(viewingEntry.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </h2>
                      {viewingEntry.hijriDate && (
                        <p className="text-sm text-slate-600 dark:text-gray-400">{viewingEntry.hijriDate}</p>
                      )}
                      <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mt-1">
                        Feeling: {MOODS.find(m => m.value === viewingEntry.mood)?.label || 'Unknown'}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setViewingEntry(null)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="p-4 rounded-lg bg-pink-50 dark:bg-pink-900/20 border-2 border-pink-300 dark:border-pink-700">
                  <h3 className="text-lg font-bold text-pink-700 dark:text-pink-300 flex items-center gap-2 mb-3">
                    <Heart className="h-5 w-5" />
                    Three Things I'm Grateful For
                  </h3>
                  <ul className="space-y-2">
                    {viewingEntry.gratitude1 && <li className="text-slate-700 dark:text-gray-300">💛 {viewingEntry.gratitude1}</li>}
                    {viewingEntry.gratitude2 && <li className="text-slate-700 dark:text-gray-300">💛 {viewingEntry.gratitude2}</li>}
                    {viewingEntry.gratitude3 && <li className="text-slate-700 dark:text-gray-300">💛 {viewingEntry.gratitude3}</li>}
                  </ul>
                </div>

                <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-700">
                  <h3 className="text-lg font-bold text-yellow-700 dark:text-yellow-300 flex items-center gap-2 mb-3">
                    <Sparkles className="h-5 w-5" />
                    Good Deeds Today
                  </h3>
                  <p className="text-slate-700 dark:text-gray-300 whitespace-pre-wrap">{viewingEntry.goodDeeds || 'No good deeds recorded'}</p>
                </div>

                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700">
                  <h3 className="text-lg font-bold text-blue-700 dark:text-blue-300 flex items-center gap-2 mb-3">
                    <MessageSquare className="h-5 w-5" />
                    Lessons Learned
                  </h3>
                  <p className="text-slate-700 dark:text-gray-300 whitespace-pre-wrap">{viewingEntry.lessons || 'No lessons recorded'}</p>
                </div>

                <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-300 dark:border-purple-700">
                  <h3 className="text-lg font-bold text-purple-700 dark:text-purple-300 flex items-center gap-2 mb-3">
                    <Heart className="h-5 w-5" />
                    Duas & Prayers
                  </h3>
                  <p className="text-slate-700 dark:text-gray-300 whitespace-pre-wrap">{viewingEntry.duas || 'No duas recorded'}</p>
                </div>

                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700">
                  <h3 className="text-lg font-bold text-green-700 dark:text-green-300 flex items-center gap-2 mb-3">
                    <BookOpen className="h-5 w-5" />
                    Daily Reflection
                  </h3>
                  <p className="text-slate-700 dark:text-gray-300 whitespace-pre-wrap">{viewingEntry.reflection || 'No reflection recorded'}</p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-xs text-slate-500 dark:text-gray-500">
                    Created {new Date(viewingEntry.createdAt).toLocaleDateString()}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteConfirm(viewingEntry.id)}
                    style={{
                      background: 'white',
                      borderColor: '#ef4444',
                      color: '#dc2626'
                    }}
                    className="dark:bg-gray-800 dark:border-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {deleteConfirm && (
          <motion.div
            key="delete-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-slate-900 dark:text-gray-100 mb-2">Delete Entry?</h3>
              <p className="text-slate-600 dark:text-gray-400 mb-6">
                This will permanently delete this journal entry. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => confirmDeleteEntry(deleteConfirm)}
                  disabled={saving}
                  style={{
                    background: saving ? '#9ca3af' : '#dc2626',
                    color: 'white',
                    border: 'none'
                  }}
                  className="flex-1 hover:opacity-90 disabled:opacity-60"
                >
                  {saving ? 'Deleting...' : 'Delete'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirm(null)}
                  disabled={saving}
                  style={{
                    background: 'white',
                    borderColor: '#e5e7eb',
                    color: '#1f2937'
                  }}
                  className="flex-1 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-60"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Validation Error Modal */}
      <AnimatePresence>
        {validationErrors.length > 0 && (
          <motion.div
            key="validation-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4"
            onClick={() => setValidationErrors([])}
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              className="bg-gradient-to-br from-white to-orange-50 dark:from-gray-800 dark:to-orange-900/20 rounded-2xl shadow-2xl p-8 max-w-md w-full border-2 border-orange-300 dark:border-orange-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
                  <span className="text-3xl">✨</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-gray-100 mb-2">
                  Complete Your Entry
                </h3>
                <p className="text-sm text-slate-600 dark:text-gray-400">
                  A few more details to capture today's moments
                </p>
              </div>

              <div className="bg-white dark:bg-gray-900/50 rounded-xl p-4 mb-6 border border-orange-200 dark:border-orange-800">
                <p className="text-sm font-semibold text-orange-700 dark:text-orange-300 mb-3 flex items-center gap-2">
                  <span className="text-lg">📝</span>
                  Please fill in:
                </p>
                <ul className="space-y-2">
                  {validationErrors.map((error, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-2 text-sm text-slate-700 dark:text-gray-300"
                    >
                      <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                      {error}
                    </motion.li>
                  ))}
                </ul>
              </div>

              <Button
                onClick={() => setValidationErrors([])}
                style={{
                  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                  color: 'white',
                  border: 'none'
                }}
                className="w-full shadow-lg hover:opacity-90 font-semibold py-6"
              >
                Got it! Let me complete them
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
