'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, List, Grid3X3, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import TaskList from './TaskList'
import TaskModal from './TaskModal'
import TaskFilters from './TaskFilters'
import { useTasks } from '@/hooks/use-tasks'
import { useToast } from '@/components/ui/use-toast'

export default function TasksSection() {
  const { tasks, loading, createTask, toggleTask, deleteTask } = useTasks()
  const { toast } = useToast()
  const [showNewTask, setShowNewTask] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')
  const [showCompleted, setShowCompleted] = useState(true)

  // Listen for quick action events
  useEffect(() => {
    const handleOpenModal = () => setShowNewTask(true)
    window.addEventListener('open-task-modal', handleOpenModal)
    return () => window.removeEventListener('open-task-modal', handleOpenModal)
  }, [])

  const filteredTasks = tasks.filter(task => {
    if (filter === 'completed') return task.status === 'COMPLETED'
    if (filter === 'pending') return task.status !== 'COMPLETED'
    if (!showCompleted && task.status === 'COMPLETED') return false
    return true
  })

  const handleCreateTask = async (taskData: {
    title: string
    description?: string
    priority?: 'LOW' | 'MEDIUM' | 'HIGH'
    urgent?: boolean
    important?: boolean
  }) => {
    try {
      await createTask({
        title: taskData.title,
        description: taskData.description,
        urgent: taskData.urgent || false,
        important: taskData.important || false
      })
      setShowNewTask(false)
      toast({
        title: 'Success',
        description: 'Task created successfully!',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create task. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const handleToggleTask = async (taskId: string) => {
    try {
      await toggleTask(taskId)
      toast({
        title: 'Success',
        description: 'Task updated successfully!',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update task. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId)
      toast({
        title: 'Success',
        description: 'Task deleted successfully!',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete task. Please try again.',
        variant: 'destructive'
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Today's Tasks
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Focus on what matters most
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
            className="h-10 w-10 rounded-lg text-slate-700 dark:text-slate-200 focus-visible:ring-2 focus-visible:ring-emerald-500"
            aria-label={viewMode === 'list' ? 'Switch to grid view' : 'Switch to list view'}
          >
            {viewMode === 'list' ? <Grid3X3 className="h-4 w-4" /> : <List className="h-4 w-4" />}
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowCompleted(!showCompleted)}
            className="h-10 w-10 rounded-lg text-slate-700 dark:text-slate-200 focus-visible:ring-2 focus-visible:ring-emerald-500"
            aria-label={showCompleted ? 'Hide completed tasks' : 'Show completed tasks'}
          >
            {showCompleted ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          
          <Button
            variant="success"
            onClick={() => setShowNewTask(true)}
            className="bg-emerald-600 bg-gradient-to-r from-emerald-600 to-teal-600 hover:bg-emerald-700 hover:from-emerald-700 hover:to-teal-700 !text-white hover:!text-white shadow-lg px-4 focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Filters */}
      <TaskFilters
        currentFilter={filter}
        onFilterChange={setFilter}
        taskCount={filteredTasks.length}
      />

      {/* Tasks */}
      <TaskList
        tasks={filteredTasks}
        loading={loading}
        viewMode={viewMode}
        onToggleTask={handleToggleTask}
        onDeleteTask={handleDeleteTask}
      />

      {/* New Task Modal */}
      <TaskModal
        isOpen={showNewTask}
        onClose={() => setShowNewTask(false)}
        onSave={handleCreateTask}
      />
    </div>
  )
}
