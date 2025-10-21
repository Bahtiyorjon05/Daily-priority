/**
 * useTaskFiltering Hook
 * Centralized task filtering and sorting logic
 * Replaces duplicate logic across 5+ components
 */

import { useMemo } from 'react'
import type { Task, TaskFilters, TaskSortOptions } from '@/types/models'

interface UseTaskFilteringProps {
  tasks: Task[]
  filters: TaskFilters
  sortOptions: TaskSortOptions
}

export function useTaskFiltering({ tasks, filters, sortOptions }: UseTaskFilteringProps) {
  const filteredAndSortedTasks = useMemo(() => {
    // Step 1: Filter tasks
    let filtered = tasks.filter(task => {
      // Status filter
      if (filters.status && task.status !== filters.status) {
        return false
      }

      // Priority filter
      if (filters.priority && task.priority !== filters.priority) {
        return false
      }

      // Category filter
      if (filters.categoryId && task.categoryId !== filters.categoryId) {
        return false
      }

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const matchesSearch =
          task.title.toLowerCase().includes(searchLower) ||
          task.description?.toLowerCase().includes(searchLower) ||
          task.category?.name.toLowerCase().includes(searchLower)

        if (!matchesSearch) return false
      }

      // Urgent filter
      if (filters.urgent !== undefined && task.urgent !== filters.urgent) {
        return false
      }

      // Important filter
      if (filters.important !== undefined && task.important !== filters.important) {
        return false
      }

      // AI Suggested filter
      if (filters.aiSuggested !== undefined && task.aiSuggested !== filters.aiSuggested) {
        return false
      }

      return true
    })

    // Step 2: Sort tasks
    const { sortBy, direction } = sortOptions
    const multiplier = direction === 'asc' ? 1 : -1

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }
          return (priorityOrder[a.priority] - priorityOrder[b.priority]) * multiplier

        case 'dueDate':
          const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity
          const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity
          return (aDate - bDate) * multiplier

        case 'createdAt':
          return (
            (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * multiplier
          )

        case 'title':
          return a.title.localeCompare(b.title) * multiplier

        default:
          return 0
      }
    })

    return filtered
  }, [tasks, filters, sortOptions])

  // Calculate counts for each filter
  const counts = useMemo(() => {
    return {
      all: tasks.length,
      pending: tasks.filter(t => t.status !== 'COMPLETED').length,
      completed: tasks.filter(t => t.status === 'COMPLETED').length,
      urgent: tasks.filter(t => t.urgent).length,
      important: tasks.filter(t => t.important).length,
      aiSuggested: tasks.filter(t => t.aiSuggested).length,
    }
  }, [tasks])

  return {
    filteredTasks: filteredAndSortedTasks,
    counts,
    totalFiltered: filteredAndSortedTasks.length,
  }
}
