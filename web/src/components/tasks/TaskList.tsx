/**
 * TaskList Component
 * Displays a list of tasks in grid or list view
 */

'use client'

import { useT } from '@/lib/i18n/client'
import { memo } from 'react'
import { AnimatePresence } from 'framer-motion'
import TaskCard from './TaskCard'
import EmptyState from '../shared/EmptyState'
import LoadingState from '../shared/LoadingState'
import type { TaskListProps } from '@/types/components'
import { cn } from '@/lib/utils'
import { getGridCols } from '@/constants/styles'
import { CheckCircle2 } from 'lucide-react'

const TaskList = memo<TaskListProps>(({
  tasks,
  viewMode = 'grid',
  isLoading = false,
  onTaskClick,
  onTaskEdit,
  onTaskDelete,
  onTaskToggle,
  emptyState,
  className,
}) => {
  const { t } = useT()
  if (isLoading) {
    return <LoadingState text="Loading tasks..." />
  }

  if (tasks.length === 0) {
    return (
      emptyState || (
        <EmptyState
          icon={<CheckCircle2 className="h-10 w-10" />}
          title={t('ui.noTasksFound')}
          description={t('ui.createYourFirstTaskToGetStartedWithYourProdu')}
        />
      )
    )
  }

  return (
    <div
      className={cn(
        viewMode === 'grid' ? getGridCols(3) : 'flex flex-col gap-3',
        className
      )}
    >
      <AnimatePresence mode="popLayout">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            viewMode={viewMode}
            onEdit={onTaskEdit}
            onDelete={onTaskDelete}
            onToggleComplete={onTaskToggle}
          />
        ))}
      </AnimatePresence>
    </div>
  )
})

TaskList.displayName = 'TaskList'

export default TaskList
