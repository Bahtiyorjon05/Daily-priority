'use client'

import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen } from 'lucide-react'

export default function JournalPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Journal"
        description="Reflect on your day and track your thoughts"
      />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Daily Reflections
          </CardTitle>
          <CardDescription>Your personal journal and reflections</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600 dark:text-slate-400">
            Journal feature coming soon. Write, reflect, and grow with your personal space!
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
