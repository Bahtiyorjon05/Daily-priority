'use client'

import { FocusSession } from '@/components/focus/FocusSession'
import { PageHeader } from '@/components/shared/PageHeader'

export default function FocusPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Focus Mode"
        description="Deep work sessions with Pomodoro technique"
      />
      <FocusSession />
    </div>
  )
}
