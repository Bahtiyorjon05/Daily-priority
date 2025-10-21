'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Target, 
  Calendar, 
  CheckCircle2, 
  Plus, 
  Sparkles, 
  TrendingUp, 
  Award, 
  Flame, 
  BarChart3,
  Brain
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import AIHabitTracker from '@/app/(dashboard)/components/AIHabitTracker'

export default function HabitsPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false)
    }, 500)
    
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center shadow-2xl animate-pulse">
            <Target className="h-8 w-8 text-white" />
          </div>
          <div>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <p className="text-xl font-medium text-emerald-700 dark:text-emerald-300">Loading habits...</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">Preparing your habit tracking dashboard</p>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl shadow-lg">
            <Target className="h-6 w-6 text-white" />
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Habit Tracker</h1>
          </div>
          <p className="text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
            Build positive habits with AI-powered insights and tracking. Consistency is the key to lasting change.
          </p>
        </motion.div>

        {/* AI Habit Tracker */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <AIHabitTracker session={session} />
        </motion.div>
      </div>
    </div>
  )
}