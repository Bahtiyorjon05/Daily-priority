'use client'

import { motion, AnimatePresence } from 'framer-motion'
import TaskItem from './TaskItem'
import EmptyTasksState from './EmptyTasksState'
import LoadingTasksState from './LoadingTasksState'
import type { Task } from '@/types/models'

interface TaskListProps {
  tasks: Task[]
  loading: boolean
  viewMode: 'list' | 'grid'
  onToggleTask: (taskId: string) => void
  onDeleteTask: (taskId: string) => void
}

export default function TaskList({
  tasks,
  loading,
  viewMode,
  onToggleTask,
  onDeleteTask
}: TaskListProps) {
  if (loading) {
    return <LoadingTasksState />
  }

  if (tasks.length === 0) {
    return <EmptyTasksState />
  }

  return (
    <div className={`
      ${viewMode === 'grid' 
        ? 'grid grid-cols-1 md:grid-cols-2 gap-4' 
        : 'space-y-3'
      }
    `}>
      <AnimatePresence mode="popLayout">
        {tasks.map((task, index) => (
          <motion.div
            key={task.id}
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{
              delay: index * 0.05,
              type: "spring",
              stiffness: 300,
              damping: 25
            }}
          >
            <TaskItem
              task={task}
              onToggle={() => onToggleTask(task.id)}
              onDelete={() => onDeleteTask(task.id)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
