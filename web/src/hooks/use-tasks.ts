'use client'

import { useState, useCallback, useEffect } from 'react'
import { useDataFetcher } from './use-data-fetcher'
import { toast } from 'sonner'
import type { Task } from '@/types/models'
import { TaskStatus } from '@/types/models'

interface TaskApiResponse {
  tasks: Task[]
  pagination: {
    currentPage: number
    totalPages: number
    totalCount: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch tasks
  const { data, loading: fetchLoading, error: fetchError, refetch, invalidateCache } = useDataFetcher<{ success: boolean; data: TaskApiResponse }>(
    'tasks',
    () => fetch('/api/tasks').then(res => res.json()),
    { ttl: 2 * 60 * 1000 } // 2 minutes cache
  )

  // Update tasks when data changes
  useEffect(() => {
    if (data?.data) {
      setTasks(data.data.tasks)
      setLoading(fetchLoading)
      setError(null)
    } else if (fetchError) {
      setError(fetchError)
      setLoading(fetchLoading)
      setTasks([])
    }
  }, [data, fetchError, fetchLoading])

  // Create a new task
  const createTask = useCallback(async (taskData: Partial<Task>) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create task')
      }

      const newTaskWrapper = await response.json()
      const newTask = newTaskWrapper?.data ?? newTaskWrapper
      setTasks(prev => [newTask, ...prev])
      invalidateCache()
      toast.success('Task created successfully!')
      return newTask
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create task'
      toast.error(errorMessage)
      throw err
    }
  }, [invalidateCache])

  // Update a task
  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update task')
      }

      const updatedWrapper = await response.json()
      const updatedTask = updatedWrapper?.data ?? updatedWrapper
      setTasks(prev => prev.map(task => task.id === taskId ? updatedTask : task))
      invalidateCache()
      toast.success('Task updated successfully!')
      return updatedTask
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update task'
      toast.error(errorMessage)
      throw err
    }
  }, [invalidateCache])

  // Delete a task
  const deleteTask = useCallback(async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete task')
      }

      setTasks(prev => prev.filter(task => task.id !== taskId))
      invalidateCache()
      toast.success('Task deleted successfully!')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete task'
      toast.error(errorMessage)
      throw err
    }
  }, [invalidateCache])

  // Toggle task completion status
  const toggleTask = useCallback(async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId)
      if (!task) throw new Error('Task not found')

      const newStatus = task.status === TaskStatus.COMPLETED ? TaskStatus.TODO : TaskStatus.COMPLETED
      await updateTask(taskId, { status: newStatus })
      toast.success(newStatus === TaskStatus.COMPLETED ? 'Task completed!' : 'Task reopened')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle task'
      toast.error(errorMessage)
      throw err
    }
  }, [tasks, updateTask])

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    toggleTask,
    refetchTasks: refetch
  }
}
