/**
 * Keyboard Shortcuts Hook
 * Manage global keyboard shortcuts
 */

import { useEffect, useCallback } from 'react'

export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  meta?: boolean
  shift?: boolean
  alt?: boolean
  description: string
  handler: () => void
}

/**
 * Check if keyboard event matches shortcut
 */
function matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase()
  const ctrlMatches = shortcut.ctrl === undefined || event.ctrlKey === shortcut.ctrl
  const metaMatches = shortcut.meta === undefined || event.metaKey === shortcut.meta
  const shiftMatches = shortcut.shift === undefined || event.shiftKey === shortcut.shift
  const altMatches = shortcut.alt === undefined || event.altKey === shortcut.alt

  return keyMatches && ctrlMatches && metaMatches && shiftMatches && altMatches
}

/**
 * Hook for registering keyboard shortcuts
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Exception: allow specific shortcuts even in input fields
        const allowedInInput = ['Escape', 'Enter']
        if (!allowedInInput.includes(event.key)) {
          return
        }
      }

      // Find matching shortcut
      for (const shortcut of shortcuts) {
        if (matchesShortcut(event, shortcut)) {
          event.preventDefault()
          shortcut.handler()
          break
        }
      }
    },
    [shortcuts]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

/**
 * Format shortcut for display
 */
export function formatShortcut(shortcut: Omit<KeyboardShortcut, 'handler' | 'description'>): string {
  const parts: string[] = []
  
  const isMac = typeof navigator !== 'undefined' && navigator.platform.includes('Mac')

  if (shortcut.ctrl && !isMac) parts.push('Ctrl')
  if (shortcut.meta || (shortcut.ctrl && isMac)) parts.push(isMac ? '⌘' : 'Ctrl')
  if (shortcut.alt) parts.push(isMac ? '⌥' : 'Alt')
  if (shortcut.shift) parts.push(isMac ? '⇧' : 'Shift')
  
  // Capitalize first letter of key
  const key = shortcut.key.charAt(0).toUpperCase() + shortcut.key.slice(1)
  parts.push(key)

  return parts.join(isMac ? '' : '+')
}

/**
 * Global keyboard shortcuts
 */
export const GLOBAL_SHORTCUTS = {
  NEW_TASK: { key: 'n', meta: true, ctrl: true },
  NEW_GOAL: { key: 'g', meta: true, ctrl: true },
  NEW_HABIT: { key: 'h', meta: true, ctrl: true },
  SETTINGS: { key: ',', meta: true, ctrl: true },
  HELP: { key: '/', shift: true },
  CLOSE: { key: 'Escape' },
  SAVE: { key: 's', meta: true, ctrl: true },
  DASHBOARD: { key: 'd', meta: true, ctrl: true },
  CALENDAR: { key: 'c', meta: true, ctrl: true },
  JOURNAL: { key: 'j', meta: true, ctrl: true },
  FOCUS: { key: 'f', meta: true, ctrl: true },
  ANALYTICS: { key: 'a', meta: true, ctrl: true },
} as const

/**
 * Keyboard shortcuts help modal data
 */
export const SHORTCUTS_HELP = [
  {
    category: 'Navigation',
    shortcuts: [
      { ...GLOBAL_SHORTCUTS.DASHBOARD, description: 'Go to dashboard' },
      { ...GLOBAL_SHORTCUTS.CALENDAR, description: 'Go to calendar' },
      { ...GLOBAL_SHORTCUTS.JOURNAL, description: 'Go to journal' },
      { ...GLOBAL_SHORTCUTS.FOCUS, description: 'Go to focus mode' },
      { ...GLOBAL_SHORTCUTS.ANALYTICS, description: 'Go to analytics' },
    ],
  },
  {
    category: 'Actions',
    shortcuts: [
      { ...GLOBAL_SHORTCUTS.NEW_TASK, description: 'Create new task' },
      { ...GLOBAL_SHORTCUTS.NEW_GOAL, description: 'Create new goal' },
      { ...GLOBAL_SHORTCUTS.NEW_HABIT, description: 'Create new habit' },
      { ...GLOBAL_SHORTCUTS.SAVE, description: 'Save changes' },
    ],
  },
  {
    category: 'General',
    shortcuts: [
      { ...GLOBAL_SHORTCUTS.SETTINGS, description: 'Open settings' },
      { ...GLOBAL_SHORTCUTS.HELP, description: 'Show keyboard shortcuts' },
      { ...GLOBAL_SHORTCUTS.CLOSE, description: 'Close modal/dialog' },
    ],
  },
]
