/**
 * UI Store
 * Centralized UI state management
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIStore {
  // Sidebar state
  isSidebarOpen: boolean
  isMobileSidebarOpen: boolean

  // Modal states
  isTaskModalOpen: boolean
  isSearchModalOpen: boolean
  isSettingsModalOpen: boolean

  // Bulk mode
  isBulkMode: boolean

  // Theme
  theme: 'light' | 'dark' | 'system'

  // Actions
  toggleSidebar: () => void
  setSidebarOpen: (isOpen: boolean) => void
  toggleMobileSidebar: () => void
  setMobileSidebarOpen: (isOpen: boolean) => void
  openTaskModal: () => void
  closeTaskModal: () => void
  openSearchModal: () => void
  closeSearchModal: () => void
  openSettingsModal: () => void
  closeSettingsModal: () => void
  toggleBulkMode: () => void
  setBulkMode: (isBulk: boolean) => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      // Initial state
      isSidebarOpen: true,
      isMobileSidebarOpen: false,
      isTaskModalOpen: false,
      isSearchModalOpen: false,
      isSettingsModalOpen: false,
      isBulkMode: false,
      theme: 'system',

      // Actions
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
      toggleMobileSidebar: () =>
        set((state) => ({ isMobileSidebarOpen: !state.isMobileSidebarOpen })),
      setMobileSidebarOpen: (isOpen) => set({ isMobileSidebarOpen: isOpen }),
      openTaskModal: () => set({ isTaskModalOpen: true }),
      closeTaskModal: () => set({ isTaskModalOpen: false }),
      openSearchModal: () => set({ isSearchModalOpen: true }),
      closeSearchModal: () => set({ isSearchModalOpen: false }),
      openSettingsModal: () => set({ isSettingsModalOpen: true }),
      closeSettingsModal: () => set({ isSettingsModalOpen: false }),
      toggleBulkMode: () => set((state) => ({ isBulkMode: !state.isBulkMode })),
      setBulkMode: (isBulk) => set({ isBulkMode: isBulk }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'ui-storage',
    }
  )
)
