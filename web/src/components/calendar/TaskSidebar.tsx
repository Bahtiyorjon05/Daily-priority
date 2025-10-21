'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TaskSidebarProps {
  selectedDate: Date | null
  tasks: any[]
  onTaskUpdate: () => void
}

export function TaskSidebar({ selectedDate, tasks, onTaskUpdate }: TaskSidebarProps) {
  if (!selectedDate) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-slate-500 py-12">
            Select a date to view tasks
          </div>
        </CardContent>
      </Card>
    )
  }

  const dateStr = selectedDate.toISOString().split('T')[0]
  const dayTasks = tasks.filter(task => task.dueDate?.startsWith(dateStr))

  const formattedDate = selectedDate.toLocaleDateString('default', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{formattedDate}</CardTitle>
      </CardHeader>
      <CardContent>
        {dayTasks.length === 0 ? (
          <div className="text-center text-slate-500 py-8">
            No tasks for this day
          </div>
        ) : (
          <div className="space-y-3">
            {dayTasks.map(task => (
              <div
                key={task.id}
                className={cn(
                  'p-3 rounded-lg border transition-colors',
                  task.status === 'COMPLETED'
                    ? 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                    : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                )}
              >
                <div className="flex items-start gap-3">
                  {task.status === 'COMPLETED' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'font-medium text-sm',
                      task.status === 'COMPLETED' && 'line-through text-slate-500'
                    )}>
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-xs text-slate-500 mt-1">
                        {task.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
