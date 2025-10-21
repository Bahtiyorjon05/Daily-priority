/**
 * Task Store
 * Centralized task state management with Zustand
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Task, TaskFilters, TaskSortOptions, ViewMode } from '@/types/models'
import { DEFAULT_FILTERS, DEFAULT_SORT, DEFAULT_VIEW_MODE } from '@/constants/defaults'

interface TaskStore {
  // State
  tasks: Task[]
  selectedTaskIds: string[]
  filters: TaskFilters
  sortOptions: TaskSortOptions
  viewMode: ViewMode
  isLoading: boolean
  error: string | null

  // Actions
  setTasks: (tasks: Task[]) => void
  addTask: (task: Task) => void
  updateTask: (taskId: string, updates: Partial<Task>) => void
  removeTask: (taskId: string) => void
  toggleTaskSelection: (taskId: string) => void
  selectAllTasks: (taskIds: string[]) => void
  clearSelection: () => void
  setFilters: (filters: Partial<TaskFilters>) => void
  resetFilters: () => void
  setSortOptions: (options: Partial<TaskSortOptions>) => void
  setViewMode: (mode: ViewMode) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set) => ({
      // Initial state
      tasks: [],
      selectedTaskIds: [],
      filters: DEFAULT_FILTERS,
      sortOptions: DEFAULT_SORT,
      viewMode: DEFAULT_VIEW_MODE,
      isLoading: false,
      error: null,

      // Actions
      setTasks: (tasks) => set({ tasks }),

      addTask: (task) =>
        set((state) => ({
          tasks: [task, ...state.tasks],
        })),

      updateTask: (taskId, updates) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId ? { ...task, ...updates } : task
          ),
        })),

      removeTask: (taskId) =>
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== taskId),
          selectedTaskIds: state.selectedTaskIds.filter((id) => id !== taskId),
        })),

      toggleTaskSelection: (taskId) =>
        set((state) => ({
          selectedTaskIds: state.selectedTaskIds.includes(taskId)
            ? state.selectedTaskIds.filter((id) => id !== taskId)
            : [...state.selectedTaskIds, taskId],
        })),

      selectAllTasks: (taskIds) => set({ selectedTaskIds: taskIds }),

      clearSelection: () => set({ selectedTaskIds: [] }),

      setFilters: (filters) =>
        set((state) => ({
          filters: { ...state.filters, ...filters },
        })),

      resetFilters: () => set({ filters: DEFAULT_FILTERS }),

      setSortOptions: (options) =>
        set((state) => ({
          sortOptions: { ...state.sortOptions, ...options },
        })),

      setViewMode: (mode) => set({ viewMode: mode }),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),
    }),
    {
      name: 'task-storage',
      partialize: (state) => ({
        viewMode: state.viewMode,
        sortOptions: state.sortOptions,
      }),
    }
  )
)
