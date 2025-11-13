/**
 * Core domain models and types
 * Single source of truth for all data types
 */

// ============================================================================
// Enums (matching Prisma schema)
// ============================================================================

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum EnergyLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum HabitFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  CUSTOM = 'CUSTOM',
}

export enum QuoteCategory {
  GENERAL = 'GENERAL',
  PRODUCTIVITY = 'PRODUCTIVITY',
  PATIENCE = 'PATIENCE',
  GRATITUDE = 'GRATITUDE',
  PRAYER = 'PRAYER',
  KNOWLEDGE = 'KNOWLEDGE',
  FAMILY = 'FAMILY',
  CHARACTER = 'CHARACTER',
}

export enum PrayerName {
  FAJR = 'FAJR',
  DHUHR = 'DHUHR',
  ASR = 'ASR',
  MAGHRIB = 'MAGHRIB',
  ISHA = 'ISHA',
}

export enum GoalCategory {
  IBADAH = 'IBADAH',
  KNOWLEDGE = 'KNOWLEDGE',
  FAMILY = 'FAMILY',
  WORK = 'WORK',
  HEALTH = 'HEALTH',
  COMMUNITY = 'COMMUNITY',
  PERSONAL = 'PERSONAL',
}

// ============================================================================
// Core Models
// ============================================================================

export interface User {
  id: string
  name: string | null
  email: string
  emailVerified: Date | null
  image: string | null
  location: string | null
  timezone: string
  createdAt: Date
  updatedAt: Date
}

export interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: Priority
  urgent: boolean
  important: boolean
  estimatedTime: number | null
  energyLevel: EnergyLevel | null
  dueDate: Date | null
  completedAt: Date | null
  createdAt: Date
  updatedAt: Date
  userId: string
  categoryId: string | null
  category?: Category
  subtasks?: Subtask[]
  tags?: Tag[]
  goalId?: string | null
  goal?: Goal | null
}

export interface Subtask {
  id: string
  title: string
  completed: boolean
  taskId: string
  createdAt: Date
}

export interface Category {
  id: string
  name: string
  color: string
  icon: string | null
  userId: string
  createdAt: Date
}

export interface Tag {
  id: string
  name: string
  createdAt: Date
}

export interface Habit {
  id: string
  title: string
  description: string | null
  frequency: HabitFrequency
  targetDays: number
  streak: number
  longestStreak: number
  userId: string
  createdAt: Date
  updatedAt: Date
  completions?: HabitCompletion[]
}

export interface HabitCompletion {
  id: string
  habitId: string
  date: Date
  note: string | null
}

export interface Analytics {
  id: string
  userId: string
  date: Date
  tasksCreated: number
  tasksCompleted: number
  focusTimeMinutes: number
  productivityScore: number
  energyLevel: number
  createdAt: Date
}

export interface IslamicQuote {
  id: string
  text: string
  source: string
  category: QuoteCategory
  author: string | null
  isArabic: boolean
  createdAt: Date
}

export interface PrayerTime {
  id: string
  userId: string
  date: Date
  fajr: string
  dhuhr: string
  asr: string
  maghrib: string
  isha: string
  location: string
}

export interface PrayerTracking {
  id: string
  userId: string
  date: Date
  prayerName: PrayerName
  completedAt: Date | null
  onTime: boolean
}

export interface JournalEntry {
  id: string
  userId: string
  date: Date
  gratitude1: string | null
  gratitude2: string | null
  gratitude3: string | null
  reflection: string | null
  mood: string | null
}

export interface Goal {
  id: string
  userId: string
  title: string
  description: string | null
  category: GoalCategory
  target: number
  progress: number
  deadline: Date | null
  completed: boolean
  createdAt: Date
  updatedAt: Date
  tasks?: Task[]
}

export interface UserPreference {
  id: string
  userId: string
  showHijriDate: boolean
  prayerReminderMinutes: number
  ramadanMode: boolean
  language: string
}

// ============================================================================
// UI State Types
// ============================================================================

export type ViewMode = 'grid' | 'list'
export type FilterType = 'all' | 'pending' | 'completed' | 'urgent' | 'important'
export type SortOption = 'priority' | 'dueDate' | 'createdAt' | 'title'
export type SortDirection = 'asc' | 'desc'

export interface TaskFilters {
  status?: TaskStatus | null
  priority?: Priority | null
  categoryId?: string | null
  search?: string
  urgent?: boolean
  important?: boolean
}

export interface TaskSortOptions {
  sortBy: SortOption
  direction: SortDirection
}

// ============================================================================
// Statistics & Analytics Types
// ============================================================================

export interface UserStats {
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  urgentTasks: number
  completionRate: number
  currentStreak: number
  longestStreak: number
  focusTimeToday: number
  productivityScore: number
  trend?: TrendData
}

export interface TrendData {
  direction: 'up' | 'down' | 'neutral'
  percentage: number
  label?: string
}

export interface ChartData {
  date: string
  value: number
  label?: string
}

// ============================================================================
// Prayer Times Types
// ============================================================================

export interface PrayerTimesData {
  fajr: string
  dhuhr: string
  asr: string
  maghrib: string
  isha: string
  date: Date
  location: string
  nextPrayer?: {
    name: PrayerName
    time: string
    timeUntil: string
  }
}

export interface HijriDate {
  day: number
  month: number
  year: number
  monthName: string
  formatted: string
}
