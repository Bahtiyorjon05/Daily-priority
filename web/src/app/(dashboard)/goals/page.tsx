'use client'

import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Target } from 'lucide-react'

export default function GoalsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Goals"
        description="Set and track your long-term goals"
      />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Your Goals
          </CardTitle>
          <CardDescription>Track your progress toward meaningful goals</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600 dark:text-slate-400">
            Goal tracking feature coming soon. Set ambitious goals and achieve them step by step!
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
