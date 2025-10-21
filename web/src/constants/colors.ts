/**
 * Color constants and mappings
 * Centralized color definitions for consistent theming
 */

import type { Priority, TaskStatus, GoalCategory } from '@/types/models'

// ============================================================================
// Gradient Colors for Cards & Stats
// ============================================================================

export const GRADIENT_COLORS = {
  blue: 'from-blue-500 to-indigo-600',
  emerald: 'from-emerald-500 to-teal-600',
  purple: 'from-purple-500 to-violet-600',
  amber: 'from-amber-500 to-orange-600',
  rose: 'from-rose-500 to-pink-600',
  indigo: 'from-indigo-500 to-blue-600',
  cyan: 'from-cyan-500 to-blue-600',
  green: 'from-green-500 to-emerald-600',
  red: 'from-red-500 to-rose-600',
  yellow: 'from-yellow-500 to-amber-600',
} as const

export type GradientColor = keyof typeof GRADIENT_COLORS

// ============================================================================
// Solid Colors for Backgrounds
// ============================================================================

export const SOLID_COLORS = {
  blue: 'bg-blue-500',
  emerald: 'bg-emerald-500',
  purple: 'bg-purple-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  indigo: 'bg-indigo-500',
  cyan: 'bg-cyan-500',
  green: 'bg-green-500',
  red: 'bg-red-500',
  yellow: 'bg-yellow-500',
} as const

// ============================================================================
// Text Colors
// ============================================================================

export const TEXT_COLORS = {
  blue: 'text-blue-600 dark:text-blue-400',
  emerald: 'text-emerald-600 dark:text-emerald-400',
  purple: 'text-purple-600 dark:text-purple-400',
  amber: 'text-amber-600 dark:text-amber-400',
  rose: 'text-rose-600 dark:text-rose-400',
  indigo: 'text-indigo-600 dark:text-indigo-400',
  cyan: 'text-cyan-600 dark:text-cyan-400',
  green: 'text-green-600 dark:text-green-400',
  red: 'text-red-600 dark:text-red-400',
  yellow: 'text-yellow-600 dark:text-yellow-400',
} as const

// ============================================================================
// Border Colors
// ============================================================================

export const BORDER_COLORS = {
  blue: 'border-blue-500',
  emerald: 'border-emerald-500',
  purple: 'border-purple-500',
  amber: 'border-amber-500',
  rose: 'border-rose-500',
  indigo: 'border-indigo-500',
  cyan: 'border-cyan-500',
  green: 'border-green-500',
  red: 'border-red-500',
  yellow: 'border-yellow-500',
} as const

// ============================================================================
// Background Light Colors (for badges, tags)
// ============================================================================

export const BG_LIGHT_COLORS = {
  blue: 'bg-blue-50 dark:bg-blue-950/30',
  emerald: 'bg-emerald-50 dark:bg-emerald-950/30',
  purple: 'bg-purple-50 dark:bg-purple-950/30',
  amber: 'bg-amber-50 dark:bg-amber-950/30',
  rose: 'bg-rose-50 dark:bg-rose-950/30',
  indigo: 'bg-indigo-50 dark:bg-indigo-950/30',
  cyan: 'bg-cyan-50 dark:bg-cyan-950/30',
  green: 'bg-green-50 dark:bg-green-950/30',
  red: 'bg-red-50 dark:bg-red-950/30',
  yellow: 'bg-yellow-50 dark:bg-yellow-950/30',
} as const

// ============================================================================
// Priority Colors
// ============================================================================

export const PRIORITY_COLORS: Record<Priority, GradientColor> = {
  LOW: 'blue',
  MEDIUM: 'amber',
  HIGH: 'purple',
  URGENT: 'rose',
}

export const PRIORITY_TEXT_COLORS: Record<Priority, string> = {
  LOW: TEXT_COLORS.blue,
  MEDIUM: TEXT_COLORS.amber,
  HIGH: TEXT_COLORS.purple,
  URGENT: TEXT_COLORS.rose,
}

export const PRIORITY_BG_COLORS: Record<Priority, string> = {
  LOW: BG_LIGHT_COLORS.blue,
  MEDIUM: BG_LIGHT_COLORS.amber,
  HIGH: BG_LIGHT_COLORS.purple,
  URGENT: BG_LIGHT_COLORS.rose,
}

export const PRIORITY_BORDER_COLORS: Record<Priority, string> = {
  LOW: BORDER_COLORS.blue,
  MEDIUM: BORDER_COLORS.amber,
  HIGH: BORDER_COLORS.purple,
  URGENT: BORDER_COLORS.rose,
}

// ============================================================================
// Task Status Colors
// ============================================================================

export const STATUS_COLORS: Record<TaskStatus, GradientColor> = {
  TODO: 'blue',
  IN_PROGRESS: 'amber',
  COMPLETED: 'emerald',
  CANCELLED: 'rose',
}

export const STATUS_TEXT_COLORS: Record<TaskStatus, string> = {
  TODO: TEXT_COLORS.blue,
  IN_PROGRESS: TEXT_COLORS.amber,
  COMPLETED: TEXT_COLORS.emerald,
  CANCELLED: TEXT_COLORS.rose,
}

export const STATUS_BG_COLORS: Record<TaskStatus, string> = {
  TODO: BG_LIGHT_COLORS.blue,
  IN_PROGRESS: BG_LIGHT_COLORS.amber,
  COMPLETED: BG_LIGHT_COLORS.emerald,
  CANCELLED: BG_LIGHT_COLORS.rose,
}

// ============================================================================
// Goal Category Colors
// ============================================================================

export const GOAL_CATEGORY_COLORS: Record<GoalCategory, GradientColor> = {
  IBADAH: 'purple',
  KNOWLEDGE: 'blue',
  FAMILY: 'rose',
  WORK: 'amber',
  HEALTH: 'emerald',
  COMMUNITY: 'indigo',
  PERSONAL: 'cyan',
}

// ============================================================================
// Trend Colors
// ============================================================================

export const TREND_COLORS = {
  up: 'text-emerald-600 dark:text-emerald-400',
  down: 'text-red-600 dark:text-red-400',
  neutral: 'text-gray-600 dark:text-gray-400',
} as const

export const TREND_BG_COLORS = {
  up: 'bg-emerald-50 dark:bg-emerald-950/30',
  down: 'bg-red-50 dark:bg-red-950/30',
  neutral: 'bg-gray-50 dark:bg-gray-950/30',
} as const

// ============================================================================
// Energy Level Colors
// ============================================================================

export const ENERGY_COLORS = {
  LOW: 'blue',
  MEDIUM: 'amber',
  HIGH: 'emerald',
} as const

// ============================================================================
// Prayer Time Colors
// ============================================================================

export const PRAYER_COLORS = {
  FAJR: 'indigo',
  DHUHR: 'amber',
  ASR: 'cyan',
  MAGHRIB: 'rose',
  ISHA: 'purple',
} as const

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get gradient color class for a priority
 */
export function getPriorityGradient(priority: Priority): string {
  return GRADIENT_COLORS[PRIORITY_COLORS[priority]]
}

/**
 * Get text color class for a priority
 */
export function getPriorityTextColor(priority: Priority): string {
  return PRIORITY_TEXT_COLORS[priority]
}

/**
 * Get background color class for a priority badge
 */
export function getPriorityBgColor(priority: Priority): string {
  return PRIORITY_BG_COLORS[priority]
}

/**
 * Get status color classes
 */
export function getStatusColors(status: TaskStatus) {
  return {
    gradient: GRADIENT_COLORS[STATUS_COLORS[status]],
    text: STATUS_TEXT_COLORS[status],
    bg: STATUS_BG_COLORS[status],
  }
}

/**
 * Get goal category gradient
 */
export function getGoalCategoryGradient(category: GoalCategory): string {
  return GRADIENT_COLORS[GOAL_CATEGORY_COLORS[category]]
}

/**
 * Get trend color based on direction
 */
export function getTrendColor(direction: 'up' | 'down' | 'neutral'): string {
  return TREND_COLORS[direction]
}

/**
 * Parse hex color to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

/**
 * Get contrasting text color (black or white) for a background color
 */
export function getContrastColor(hexColor: string): 'black' | 'white' {
  const rgb = hexToRgb(hexColor)
  if (!rgb) return 'black'

  // Calculate luminance
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255

  return luminance > 0.5 ? 'black' : 'white'
}
