'use client'

import { useT } from '@/lib/i18n/client'
import { motion } from 'framer-motion'
import { Plus, Target, Timer, Calendar, BookOpen, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { useUserStats } from '@/hooks/use-user-stats'

export default function QuickActionsPanel() {
  const { t } = useT()
  const router = useRouter()
  const { stats } = useUserStats()
  
  const quickActions = [
    {
      icon: Plus,
      label: 'Add Task',
      description: t('ui.createNewTask2'),
      color: 'from-emerald-500 to-teal-500',
      action: () => {
        // Trigger task creation modal through event
        window.dispatchEvent(new CustomEvent('open-task-modal'))
      }
    },
    {
      icon: Timer,
      label: 'Focus Session',
      description: t('ui.startPomodoro'),
      color: 'from-orange-500 to-red-500',
      action: () => router.push('/focus')
    },
    {
      icon: Calendar,
      label: t('ui.scheduleEvent'),
      description: t('ui.addToCalendar'),
      color: 'from-blue-500 to-cyan-500',
      action: () => router.push('/calendar')
    },
    {
      icon: Target,
      label: t('ui.setGoal'),
      description: t('ui.createNewGoal2'),
      color: 'from-purple-500 to-violet-500',
      action: () => router.push('/goals')
    },
    {
      icon: BookOpen,
      label: t('ui.journalEntry'),
      description: t('ui.writeReflection'),
      color: 'from-pink-500 to-rose-500',
      action: () => router.push('/journal')
    }
  ]
  return (
    <Card className="border-slate-200 dark:border-slate-700 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Zap className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          {t('ui.quickActions')}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {quickActions.map((action, index) => {
          const Icon = action.icon
          return (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ x: 4 }}
            >
              <Button
                variant="ghost"
                onClick={action.action}
                className="w-full justify-start p-4 h-auto group hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-all duration-200"
              >
                <div className="flex items-center gap-3 w-full">
                  <div className={`
                    p-2 rounded-lg bg-gradient-to-br ${action.color} 
                    group-hover:scale-110 transition-transform duration-200 flex-shrink-0
                  `}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  
                  <div className="text-left flex-1 min-w-0">
                    <p className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">
                      {action.label}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {action.description}
                    </p>
                  </div>
                </div>
              </Button>
            </motion.div>
          )
        })}
        
        {/* Quick Stats */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {stats?.completedTasks || 0}
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-500">{t('ui.completed')}</p>
            </div>
            <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {stats ? (stats.totalTasks - stats.completedTasks) : 0}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-500">{t('ui.pending')}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
