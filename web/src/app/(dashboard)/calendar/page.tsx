'use client'

import { CalendarView } from '@/components/calendar/CalendarView'
import { PageHeader } from '@/components/shared/PageHeader'

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendar"
        description="Plan your days with Islamic calendar integration"
      />
      <CalendarView />
    </div>
  )
}
