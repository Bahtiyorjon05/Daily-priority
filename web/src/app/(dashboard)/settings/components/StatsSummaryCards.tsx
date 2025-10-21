'use client'

import { CheckCircle2, Clock, Star } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export interface UserStatsSummary {
  tasksCompleted: number
  streak: number
  productivityScore: number
}

export default function StatsSummaryCards({ stats }: { stats: UserStatsSummary }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border-emerald-200 dark:border-emerald-800">
        <CardContent className="p-4 text-center">
          <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
            {stats.tasksCompleted}
          </div>
          <div className="text-sm text-emerald-600 dark:text-emerald-500">Tasks Completed</div>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4 text-center">
          <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
            {stats.streak}
          </div>
          <div className="text-sm text-blue-600 dark:text-blue-500">Current Streak (days)</div>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
        <CardContent className="p-4 text-center">
          <Star className="h-8 w-8 text-purple-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">
            {stats.productivityScore}%
          </div>
          <div className="text-sm text-purple-600 dark:text-purple-500">Productivity Score</div>
        </CardContent>
      </Card>
    </div>
  )
}

