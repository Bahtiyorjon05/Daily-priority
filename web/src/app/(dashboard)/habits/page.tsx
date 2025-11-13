'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Target,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Flame,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { HabitsStats } from './components/HabitsStats'
import { HabitsFilters } from './components/HabitsFilters'

interface Habit {
  id: string
  title: string
  description?: string
  frequency: 'DAILY' | 'WEEKLY' | 'CUSTOM'
  targetDays: number
  streak: number
  longestStreak: number
  currentStreak: number
  createdAt: string
  completions: {
    id: string
    date: string
    note?: string
  }[]
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(false)
  const [showNewHabit, setShowNewHabit] = useState(false)
  const [deletingHabit, setDeletingHabit] = useState<Habit | null>(null)
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFrequency, setSelectedFrequency] = useState<'ALL' | 'DAILY' | 'WEEKLY' | 'CUSTOM'>('ALL')
  const [sortBy, setSortBy] = useState<'date' | 'streak' | 'name'>('date')
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const habitsPerPage = 12
  
  const [newHabit, setNewHabit] = useState({
    title: '',
    description: '',
    frequency: 'DAILY' as 'DAILY' | 'WEEKLY' | 'CUSTOM',
    targetDays: 7
  })

  useEffect(() => {
    fetchHabits()
  }, [])

  async function fetchHabits() {
    try {
      setLoading(true)
      const response = await fetch('/api/habits')
      if (response.ok) {
        const data = await response.json()
        setHabits(data || [])
      } else {
        const error = await response.json()
        console.error('API error:', error)
        toast.error('Failed to load habits')
      }
    } catch (error) {
      console.error('Error fetching habits:', error)
      toast.error('Failed to load habits')
    } finally {
      setLoading(false)
    }
  }

  async function createHabit() {
    // Validation
    if (!newHabit.title.trim()) {
      toast.error('Please enter a habit title')
      return
    }

    try {
      const response = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newHabit)
      })

      if (response.ok) {
        const createdHabit = await response.json()
        setHabits(prev => [createdHabit, ...prev])
        setNewHabit({
          title: '',
          description: '',
          frequency: 'DAILY',
          targetDays: 7
        })
        setShowNewHabit(false)
        toast.success('✅ Habit created successfully!')
      } else {
        const error = await response.json()
        console.error('API error:', error)
        toast.error(error.error || 'Failed to create habit')
      }
    } catch (error) {
      console.error('Error creating habit:', error)
      toast.error('Failed to create habit')
    }
  }

  async function confirmDeleteHabit() {
    if (!deletingHabit) return

    try {
      const response = await fetch(`/api/habits/${deletingHabit.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setHabits(prev => prev.filter(h => h.id !== deletingHabit.id))
        toast.success('Habit deleted successfully')
        setDeletingHabit(null)
      } else {
        toast.error('Failed to delete habit')
        setDeletingHabit(null)
      }
    } catch (error) {
      console.error('Error deleting habit:', error)
      toast.error('Failed to delete habit')
      setDeletingHabit(null)
    }
  }

  async function toggleHabitCompletion(habitId: string) {
    const today = new Date().toISOString().split('T')[0]
    const habit = habits.find(h => h.id === habitId)
    
    if (!habit) return
    
    const completions = habit.completions || []
    const completedToday = completions.some(c => 
      new Date(c.date).toISOString().split('T')[0] === today
    )

    // Optimistic update - instant UI feedback
    setHabits(prevHabits => prevHabits.map(h => {
      if (h.id === habitId) {
        const updatedCompletions = completedToday
          ? completions.filter(c => new Date(c.date).toISOString().split('T')[0] !== today)
          : [...completions, { id: 'temp', date: today }]
        
        // Recalculate streak optimistically
        let newStreak = h.currentStreak || 0
        if (completedToday) {
          // Removed completion - might break streak
          newStreak = Math.max(0, newStreak - 1)
        } else {
          // Added completion - might increase streak
          newStreak = newStreak + 1
        }
        
        return {
          ...h,
          completions: updatedCompletions,
          currentStreak: newStreak,
          longestStreak: Math.max(h.longestStreak, newStreak)
        }
      }
      return h
    }))

    try {
      const response = await fetch(`/api/habits/${habitId}/complete`, {
        method: completedToday ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: today })
      })

      if (response.ok) {
        // Fetch only the updated habit to sync streak calculation
        const habitResponse = await fetch(`/api/habits`)
        if (habitResponse.ok) {
          const allHabits = await habitResponse.json()
          const updatedHabit = allHabits.find((h: Habit) => h.id === habitId)
          
          if (updatedHabit) {
            // Update only the specific habit with accurate server data
            setHabits(prevHabits => prevHabits.map(h => 
              h.id === habitId ? updatedHabit : h
            ))
          }
        }
        toast.success(completedToday ? 'Completion removed' : '✅ Habit completed!')
      } else {
        // Revert optimistic update on error
        await fetchHabits()
        toast.error('Failed to update habit')
      }
    } catch (error) {
      console.error('Error toggling completion:', error)
      // Revert optimistic update on error
      await fetchHabits()
      toast.error('Failed to update habit')
    }
  }

  // Filter and sort habits with memoization
  const filteredAndSortedHabits = useMemo(() => (habits || [])
    .filter(habit => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (!habit.title?.toLowerCase().includes(query) && 
            !habit.description?.toLowerCase().includes(query)) {
          return false
        }
      }

      // Frequency filter
      if (selectedFrequency !== 'ALL' && habit.frequency !== selectedFrequency) {
        return false
      }

      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'streak':
          return (b.currentStreak || 0) - (a.currentStreak || 0)
        case 'name':
          return a.title.localeCompare(b.title)
        case 'date':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    }), [habits, searchQuery, selectedFrequency, sortBy])

  // Pagination logic
  const totalPages = Math.ceil(filteredAndSortedHabits.length / habitsPerPage)
  const paginatedHabits = useMemo(() => {
    const startIndex = (currentPage - 1) * habitsPerPage
    return filteredAndSortedHabits.slice(startIndex, startIndex + habitsPerPage)
  }, [filteredAndSortedHabits, currentPage, habitsPerPage])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedFrequency, sortBy])

  // Calculate stats
  const today = new Date().toISOString().split('T')[0]
  const totalHabits = habits.length
  const completedToday = habits.filter(h => 
    h.completions?.some(c => new Date(c.date).toISOString().split('T')[0] === today)
  ).length
  const activeStreak = Math.max(...habits.map(h => h.currentStreak || 0), 0)
  
  // Calculate weekly completion rate
  const last7Days = Array.from({length: 7}, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - i)
    return d.toISOString().split('T')[0]
  })
  const totalPossible = habits.length * 7
  const totalCompleted = habits.reduce((sum, habit) => {
    const completions = habit.completions || []
    return sum + completions.filter(c => 
      last7Days.includes(new Date(c.date).toISOString().split('T')[0])
    ).length
  }, 0)
  const weeklyCompletion = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/20 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950/20 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-600 dark:text-gray-400 font-medium">Loading your habits...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/20 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950/20 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-none shadow-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 dark:from-emerald-600 dark:via-teal-600 dark:to-cyan-600 text-white">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Target className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold">Habits</h1>
                    <p className="text-white/90">Build lasting habits, one day at a time</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setNewHabit({
                      title: '',
                      description: '',
                      frequency: 'DAILY',
                      targetDays: 7
                    })
                    setShowNewHabit(true)
                  }}
                  style={{
                    background: 'white',
                    color: 'rgb(16, 185, 129)',
                    border: 'none',
                    outline: 'none'
                  }}
                  className="px-6 py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200 hover:opacity-90 inline-flex items-center justify-center gap-2"
                >
                  <Plus className="h-5 w-5" />
                  New Habit
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats */}
        <HabitsStats
          totalHabits={totalHabits}
          completedToday={completedToday}
          activeStreak={activeStreak}
          weeklyCompletion={weeklyCompletion}
        />

        {/* Filters */}
        <HabitsFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedFrequency={selectedFrequency}
          onFrequencyChange={setSelectedFrequency}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />

        {/* Habits Grid */}
        <div className="space-y-6">
          {/* Results count */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {paginatedHabits.length} of {filteredAndSortedHabits.length} habit{filteredAndSortedHabits.length !== 1 ? 's' : ''}
            </p>
            {totalPages > 1 && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Page {currentPage} of {totalPages}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {paginatedHabits.map(habit => {
                const completions = habit.completions || []
                const completedToday = completions.some(c => 
                  new Date(c.date).toISOString().split('T')[0] === today
                )
              
              return (
                <motion.div
                  key={habit.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <Card className="group hover:shadow-lg transition-all relative overflow-hidden border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1 pr-10">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                              {habit.title}
                            </h3>
                            {habit.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {habit.description}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingHabit(habit)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Frequency Badge */}
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                            habit.frequency === 'DAILY' 
                              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                              : habit.frequency === 'WEEKLY'
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                              : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                          }`}>
                            {habit.frequency === 'DAILY' ? '📅 Daily' : habit.frequency === 'WEEKLY' ? '📆 Weekly' : '⚙️ Custom'}
                          </span>
                        </div>

                        {/* Streak Info */}
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Flame className="h-4 w-4 text-orange-500" />
                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                              {habit.currentStreak} day streak
                            </span>
                          </div>
                          <span className="text-gray-500 dark:text-gray-400">
                            Best: {habit.longestStreak}
                          </span>
                        </div>

                        {/* Check-in Button */}
                        <button
                          onClick={() => toggleHabitCompletion(habit.id)}
                          style={completedToday ? {
                            background: 'linear-gradient(to right, rgb(34, 197, 94), rgb(22, 163, 74))',
                            color: 'white',
                            border: 'none'
                          } : {
                            background: 'rgb(243, 244, 246)',
                            color: 'rgb(55, 65, 81)',
                            border: '2px solid rgb(209, 213, 219)'
                          }}
                          className="w-full h-12 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 hover:opacity-90 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 dark:border-gray-600"
                        >
                          {completedToday ? (
                            <>
                              <CheckCircle2 className="h-5 w-5" />
                              Completed Today
                            </>
                          ) : (
                            <>
                              <Circle className="h-5 w-5" />
                              Mark Complete
                            </>
                          )}
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {filteredAndSortedHabits.length === 0 && (
            <div className="col-span-full">
              <Card className="border-dashed border-2 border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <CardContent className="p-12 text-center">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No habits found</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                    {searchQuery || selectedFrequency !== 'ALL' 
                      ? 'Try adjusting your filters'
                      : 'Create your first habit to get started'}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-2 mt-8"
            >
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                style={{
                  background: currentPage === 1 ? 'rgb(229, 231, 235)' : 'linear-gradient(to right, rgb(16, 185, 129), rgb(20, 184, 166))',
                  color: currentPage === 1 ? 'rgb(156, 163, 175)' : 'white',
                  border: 'none'
                }}
                className="px-4 py-2 rounded-lg font-semibold transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 inline-flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  // Smart pagination - show current page and 2 pages around it
                  let page: number
                  if (totalPages <= 5) {
                    page = i + 1
                  } else if (currentPage <= 3) {
                    page = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    page = totalPages - 4 + i
                  } else {
                    page = currentPage - 2 + i
                  }
                  
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      style={{
                        background: currentPage === page 
                          ? 'linear-gradient(to right, rgb(16, 185, 129), rgb(20, 184, 166))'
                          : 'rgb(243, 244, 246)',
                        color: currentPage === page ? 'white' : 'rgb(55, 65, 81)',
                        border: 'none'
                      }}
                      className="w-10 h-10 rounded-lg font-semibold transition-all duration-200 hover:opacity-90 dark:bg-gray-700 dark:text-gray-300"
                    >
                      {page}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                style={{
                  background: currentPage === totalPages ? 'rgb(229, 231, 235)' : 'linear-gradient(to right, rgb(16, 185, 129), rgb(20, 184, 166))',
                  color: currentPage === totalPages ? 'rgb(156, 163, 175)' : 'white',
                  border: 'none'
                }}
                className="px-4 py-2 rounded-lg font-semibold transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 inline-flex items-center gap-1"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </div>

        {/* New Habit Modal */}
        <AnimatePresence>
          {showNewHabit && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowNewHabit(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border-4 border-emerald-400 dark:border-emerald-600"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Habit</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      🎯 Build a new positive habit
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowNewHabit(false)}
                    className="hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold mb-2 block text-gray-700 dark:text-gray-300">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={newHabit.title}
                      onChange={(e) => setNewHabit(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Morning exercise, Read Quran"
                      className="h-12 bg-gray-50 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:border-emerald-500 dark:focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold mb-2 block text-gray-700 dark:text-gray-300">
                      Description <span className="text-gray-400 text-xs">(Optional)</span>
                    </label>
                    <Textarea
                      value={newHabit.description}
                      onChange={(e) => setNewHabit(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Why is this habit important to you?"
                      className="min-h-[100px] bg-gray-50 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:border-emerald-500 dark:focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold mb-2 block text-gray-700 dark:text-gray-300">
                      Frequency
                    </label>
                    <select
                      value={newHabit.frequency}
                      onChange={(e) => setNewHabit(prev => ({ ...prev, frequency: e.target.value as 'DAILY' | 'WEEKLY' | 'CUSTOM' }))}
                      className="w-full h-12 px-4 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:focus:border-emerald-500"
                    >
                      <option value="DAILY">📅 Daily</option>
                      <option value="WEEKLY">📆 Weekly</option>
                      <option value="CUSTOM">⚙️ Custom</option>
                    </select>
                  </div>

                  {newHabit.frequency === 'CUSTOM' && (
                    <div>
                      <label className="text-sm font-semibold mb-2 block text-gray-700 dark:text-gray-300">
                        Target Days per Week
                      </label>
                      <Input
                        type="number"
                        min="1"
                        max="7"
                        value={newHabit.targetDays}
                        onChange={(e) => setNewHabit(prev => ({ ...prev, targetDays: parseInt(e.target.value) || 1 }))}
                        className="h-12 bg-gray-50 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:border-emerald-500 dark:focus:border-emerald-500"
                      />
                    </div>
                  )}

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={createHabit}
                      disabled={!newHabit.title.trim()}
                      style={{
                        background: 'linear-gradient(to right, rgb(16, 185, 129), rgb(20, 184, 166))',
                        border: 'none',
                        outline: 'none'
                      }}
                      className="flex-1 h-12 rounded-lg text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center"
                    >
                      Create Habit
                    </button>
                    <button
                      onClick={() => setShowNewHabit(false)}
                      className="h-12 px-6 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 border-0 font-medium transition-all duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {deletingHabit && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setDeletingHabit(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-900 rounded-3xl p-8 w-full max-w-md shadow-2xl border-4 border-red-400 dark:border-red-600"
              >
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center">
                    <Trash2 className="h-10 w-10 text-white" />
                  </div>
                </div>

                <div className="text-center space-y-4">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Delete Habit?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Are you sure you want to delete{' '}
                    <span className="font-semibold text-gray-900 dark:text-white">
                      "{deletingHabit.title}"
                    </span>
                    ?
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                    ⚠️ This will delete all completion history!
                  </p>

                  <div className="p-4 rounded-xl border-2 bg-gray-50 dark:bg-gray-800/50 border-gray-300 dark:border-gray-700">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Current Streak:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        🔥 {deletingHabit.currentStreak} days
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-8">
                  <button
                    onClick={() => setDeletingHabit(null)}
                    className="flex-1 h-12 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-semibold transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteHabit}
                    style={{
                      background: 'linear-gradient(to right, rgb(239, 68, 68), rgb(220, 38, 38))',
                      border: 'none',
                      outline: 'none'
                    }}
                    className="flex-1 h-12 rounded-lg text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 hover:opacity-90 inline-flex items-center justify-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Habit
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}