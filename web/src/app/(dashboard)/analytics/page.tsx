'use client'

import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3 } from 'lucide-react'

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Track your productivity and progress"
      />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Productivity Insights
          </CardTitle>
          <CardDescription>Your productivity data and trends</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600 dark:text-slate-400">
            Detailed analytics and insights coming soon. We're building beautiful charts and statistics for you!
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
