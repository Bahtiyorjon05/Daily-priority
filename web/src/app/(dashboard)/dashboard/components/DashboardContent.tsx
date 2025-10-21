'use client'

import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import WelcomeSection from './WelcomeSection'
import StatsGrid from './StatsGrid'
import TasksSection from './TasksSection'
import QuickActionsPanel from './QuickActionsPanel'
import PrayerTimesPanel from './PrayerTimesPanel'

export default function DashboardContent() {
  const { data: session } = useSession()

  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <WelcomeSection session={session} />
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <StatsGrid />
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-6">
        {/* Tasks Section - Takes up 3 columns */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="xl:col-span-3 order-2 xl:order-1"
        >
          <TasksSection />
        </motion.div>

        {/* Right Sidebar - Takes up 1 column */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="space-y-4 sm:space-y-6 order-1 xl:order-2"
        >
          <QuickActionsPanel />
          <PrayerTimesPanel />
        </motion.div>
      </div>
    </div>
  )
}
