/**
 * Default values and configurations
 * Application-wide defaults
 */

import { Priority, TaskStatus, EnergyLevel, HabitFrequency, GoalCategory } from '@/types/models'

// ============================================================================
// Pagination Defaults
// ============================================================================

export const DEFAULT_PAGE_SIZE = 20
export const DEFAULT_PAGE = 1
export const MAX_PAGE_SIZE = 100

export const PAGINATION_LIMITS = {
  tasks: 20,
  habits: 15,
  goals: 12,
  journal: 10,
  analytics: 30,
} as const

// ============================================================================
// Task Defaults
// ============================================================================

export const DEFAULT_TASK = {
  status: TaskStatus.TODO,
  priority: Priority.MEDIUM,
  urgent: false,
  important: false,
  aiSuggested: false,
  estimatedTime: null,
  energyLevel: null,
} as const

export const TASK_ESTIMATED_TIMES = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 },
  { label: '4 hours', value: 240 },
  { label: '1 day', value: 480 },
] as const

// ============================================================================
// Habit Defaults
// ============================================================================

export const DEFAULT_HABIT = {
  frequency: HabitFrequency.DAILY,
  targetDays: 7,
  streak: 0,
  longestStreak: 0,
} as const

export const HABIT_TARGET_DAYS = [
  { label: 'Daily (7 days)', value: 7 },
  { label: 'Weekly (30 days)', value: 30 },
  { label: 'Monthly (90 days)', value: 90 },
  { label: 'Yearly (365 days)', value: 365 },
] as const

// ============================================================================
// Goal Defaults
// ============================================================================

export const DEFAULT_GOAL = {
  category: GoalCategory.PERSONAL,
  target: 100,
  progress: 0,
  completed: false,
} as const

// ============================================================================
// Filter Defaults
// ============================================================================

export const DEFAULT_FILTERS = {
  status: null,
  priority: null,
  categoryId: null,
  search: '',
  urgent: false,
  important: false,
  aiSuggested: false,
} as const

export const DEFAULT_SORT = {
  sortBy: 'createdAt' as const,
  direction: 'desc' as const,
} as const

// ============================================================================
// View Preferences
// ============================================================================

export const DEFAULT_VIEW_MODE = 'grid' as const
export const DEFAULT_THEME = 'system' as const

// ============================================================================
// Prayer Times Defaults
// ============================================================================

export const DEFAULT_PRAYER_REMINDER = 10 // minutes before prayer

export const PRAYER_NAMES = [
  { name: 'Fajr', label: 'Fajr', icon: '🌅' },
  { name: 'Dhuhr', label: 'Dhuhr', icon: '☀️' },
  { name: 'Asr', label: 'Asr', icon: '🌤️' },
  { name: 'Maghrib', label: 'Maghrib', icon: '🌇' },
  { name: 'Isha', label: 'Isha', icon: '🌙' },
] as const

// ============================================================================
// User Preferences Defaults
// ============================================================================

export const DEFAULT_USER_PREFERENCES = {
  showHijriDate: true,
  prayerNotifications: true,
  prayerReminderMinutes: 10,
  ramadanMode: false,
  language: 'en',
} as const

// ============================================================================
// Chart & Analytics Defaults
// ============================================================================

export const DEFAULT_CHART_CONFIG = {
  height: 300,
  showGrid: true,
  showTooltip: true,
  animationDuration: 300,
} as const

export const ANALYTICS_TIME_RANGES = [
  { label: 'Last 7 days', value: 7 },
  { label: 'Last 30 days', value: 30 },
  { label: 'Last 90 days', value: 90 },
  { label: 'Last year', value: 365 },
] as const

// ============================================================================
// Form Validation Rules
// ============================================================================

export const VALIDATION_RULES = {
  name: {
    minLength: 2,
    maxLength: 50,
  },
  email: {
    pattern: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
  },
  password: {
    minLength: 8,
    maxLength: 100,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, // At least one lowercase, uppercase, and number
  },
  title: {
    minLength: 1,
    maxLength: 200,
  },
  description: {
    maxLength: 2000,
  },
} as const

// ============================================================================
// API Configuration
// ============================================================================

export const API_TIMEOUT = 30000 // 30 seconds
export const API_RETRY_COUNT = 3
export const API_RETRY_DELAY = 1000 // 1 second

export const CACHE_DURATION = {
  stats: 5 * 60 * 1000, // 5 minutes
  tasks: 1 * 60 * 1000, // 1 minute
  habits: 2 * 60 * 1000, // 2 minutes
  prayerTimes: 24 * 60 * 60 * 1000, // 24 hours
  quotes: 24 * 60 * 60 * 1000, // 24 hours
} as const

// ============================================================================
// File Upload Configuration
// ============================================================================

export const UPLOAD_CONFIG = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  acceptedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  acceptedFileTypes: ['image/*', 'application/pdf'],
} as const

// ============================================================================
// Animation Durations
// ============================================================================

export const ANIMATION_DURATION = {
  fast: 150,
  normal: 200,
  slow: 300,
  slower: 500,
} as const

// ============================================================================
// Breakpoints (matching Tailwind)
// ============================================================================

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

// ============================================================================
// Z-Index Layers
// ============================================================================

export const Z_INDEX = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
} as const

// ============================================================================
// Toast Configuration
// ============================================================================

export const TOAST_DURATION = {
  short: 2000,
  normal: 3000,
  long: 5000,
} as const

export const TOAST_POSITION = 'top-right' as const

// ============================================================================
// Date & Time Formats
// ============================================================================

export const DATE_FORMATS = {
  short: 'MMM d', // Jan 1
  medium: 'MMM d, yyyy', // Jan 1, 2024
  long: 'MMMM d, yyyy', // January 1, 2024
  full: 'EEEE, MMMM d, yyyy', // Monday, January 1, 2024
  time: 'h:mm a', // 12:00 PM
  dateTime: 'MMM d, yyyy h:mm a', // Jan 1, 2024 12:00 PM
} as const

// ============================================================================
// Feature Flags
// ============================================================================

export const FEATURES = {
  prayerTimes: true,
  habits: true,
  goals: true,
  journal: true,
  analytics: true,
  darkMode: true,
  sharing: false, // Future feature
  collaboration: false, // Future feature
} as const

// ============================================================================
// Social Links
// ============================================================================

export const SOCIAL_LINKS = {
  twitter: 'https://twitter.com/dailypriority',
  github: 'https://github.com/dailypriority',
  discord: 'https://discord.gg/dailypriority',
} as const

// ============================================================================
// Help & Support
// ============================================================================

export const SUPPORT_EMAIL = 'support@dailypriority.com'
export const DOCUMENTATION_URL = 'https://docs.dailypriority.com'
export const CHANGELOG_URL = 'https://dailypriority.com/changelog'

// ============================================================================
// App Metadata
// ============================================================================

export const APP_NAME = 'Daily Priority'
export const APP_DESCRIPTION = 'Smart task management with Islamic values'
export const APP_VERSION = '2.0.0'
export const APP_URL = 'https://dailypriority.com'
