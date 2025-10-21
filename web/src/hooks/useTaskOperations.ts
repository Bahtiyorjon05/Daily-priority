/**
 * useTaskOperations Hook
 * Centralized task CRUD operations with optimistic updates
 */

import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import type { Task } from '@/types/models'
import { TaskStatus } from '@/types/models'
import type { CreateTaskRequest, UpdateTaskRequest } from '@/types/api'

interface UseTaskOperationsProps {
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export function useTaskOperations({ onSuccess, onError }: UseTaskOperationsProps = {}) {
  const [isLoading, setIsLoading] = useState(false)

  // Create task
  const createTask = useCallback(
    async (data: CreateTaskRequest) => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          throw new Error('Failed to create task')
        }

        const result = await response.json()
        toast.success('Task created successfully')
        onSuccess?.()
        return result.data
      } catch (error) {
        const err = error as Error
        toast.error(err.message || 'Failed to create task')
        onError?.(err)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [onSuccess, onError]
  )

  // Update task
  const updateTask = useCallback(
    async (taskId: string, data: UpdateTaskRequest) => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/tasks/${taskId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          throw new Error('Failed to update task')
        }

        const result = await response.json()
        toast.success('Task updated successfully')
        onSuccess?.()
        return result.data
      } catch (error) {
        const err = error as Error
        toast.error(err.message || 'Failed to update task')
        onError?.(err)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [onSuccess, onError]
  )

  // Delete task
  const deleteTask = useCallback(
    async (taskId: string) => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/tasks/${taskId}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          throw new Error('Failed to delete task')
        }

        toast.success('Task deleted successfully')
        onSuccess?.()
      } catch (error) {
        const err = error as Error
        toast.error(err.message || 'Failed to delete task')
        onError?.(err)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [onSuccess, onError]
  )

  // Toggle task completion
  const toggleTaskComplete = useCallback(
    async (taskId: string, currentStatus?: TaskStatus) => {
      const newStatus: TaskStatus = currentStatus === TaskStatus.COMPLETED ? TaskStatus.TODO : TaskStatus.COMPLETED
      const completedAt = newStatus === TaskStatus.COMPLETED ? new Date().toISOString() : null

      return updateTask(taskId, {
        status: newStatus,
        completedAt,
      })
    },
    [updateTask]
  )

  // Toggle urgent flag
  const toggleTaskUrgent = useCallback(
    async (taskId: string, currentUrgent: boolean) => {
      return updateTask(taskId, {
        urgent: !currentUrgent,
      })
    },
    [updateTask]
  )

  // Toggle important flag
  const toggleTaskImportant = useCallback(
    async (taskId: string, currentImportant: boolean) => {
      return updateTask(taskId, {
        important: !currentImportant,
      })
    },
    [updateTask]
  )

  // Bulk delete tasks
  const bulkDeleteTasks = useCallback(
    async (taskIds: string[]) => {
      setIsLoading(true)
      try {
        await Promise.all(taskIds.map(id => deleteTask(id)))
        toast.success(`${taskIds.length} tasks deleted successfully`)
        onSuccess?.()
      } catch (error) {
        const err = error as Error
        toast.error(err.message || 'Failed to delete tasks')
        onError?.(err)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [deleteTask, onSuccess, onError]
  )

  // Bulk update tasks
  const bulkUpdateTasks = useCallback(
    async (taskIds: string[], data: UpdateTaskRequest) => {
      setIsLoading(true)
      try {
        await Promise.all(taskIds.map(id => updateTask(id, data)))
        toast.success(`${taskIds.length} tasks updated successfully`)
        onSuccess?.()
      } catch (error) {
        const err = error as Error
        toast.error(err.message || 'Failed to update tasks')
        onError?.(err)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [updateTask, onSuccess, onError]
  )

  return {
    createTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    toggleTaskUrgent,
    toggleTaskImportant,
    bulkDeleteTasks,
    bulkUpdateTasks,
    isLoading,
  }
}
