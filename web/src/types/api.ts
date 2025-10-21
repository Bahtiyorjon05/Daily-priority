/**
 * API request and response types
 * Type-safe API contracts
 */

import type {
  Task,
  Category,
  Habit,
  Goal,
  JournalEntry,
  UserStats,
  Analytics,
  IslamicQuote,
  PrayerTime,
  PrayerTracking,
  TaskStatus,
  Priority,
  EnergyLevel,
  HabitFrequency,
  GoalCategory
} from './models'

// ============================================================================
// Generic API Response Types
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

export interface ApiError {
  success: false
  error: string
  statusCode: number
  details?: Record<string, any>
}

// ============================================================================
// Task API Types
// ============================================================================

export interface CreateTaskRequest {
  title: string
  description?: string
  priority?: Priority
  urgent?: boolean
  important?: boolean
  estimatedTime?: number
  energyLevel?: EnergyLevel
  dueDate?: string | Date
  categoryId?: string
  goalId?: string
  tags?: string[]
  aiSuggested?: boolean
  aiReason?: string
}

export interface UpdateTaskRequest {
  title?: string
  description?: string
  status?: TaskStatus
  priority?: Priority
  urgent?: boolean
  important?: boolean
  estimatedTime?: number
  energyLevel?: EnergyLevel
  dueDate?: string | Date | null
  categoryId?: string | null
  goalId?: string | null
  completedAt?: string | Date | null
}

export interface TasksResponse {
  success: boolean
  data: Task[]
  total: number
}

export interface TaskResponse {
  success: boolean
  data: Task
}

export interface TasksQueryParams {
  page?: number
  limit?: number
  status?: TaskStatus
  priority?: Priority
  categoryId?: string
  search?: string
  urgent?: boolean
  important?: boolean
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}

// ============================================================================
// Habit API Types
// ============================================================================

export interface CreateHabitRequest {
  title: string
  description?: string
  frequency?: HabitFrequency
  targetDays?: number
}

export interface UpdateHabitRequest {
  title?: string
  description?: string
  frequency?: HabitFrequency
  targetDays?: number
}

export interface HabitCompleteRequest {
  date?: string | Date
  note?: string
}

export interface HabitsResponse {
  success: boolean
  data: Habit[]
}

// ============================================================================
// Goal API Types
// ============================================================================

export interface CreateGoalRequest {
  title: string
  description?: string
  category?: GoalCategory
  target: number
  deadline?: string | Date
}

export interface UpdateGoalRequest {
  title?: string
  description?: string
  category?: GoalCategory
  target?: number
  progress?: number
  deadline?: string | Date | null
  completed?: boolean
}

export interface GoalsResponse {
  success: boolean
  data: Goal[]
}

// ============================================================================
// Journal API Types
// ============================================================================

export interface CreateJournalRequest {
  date?: string | Date
  gratitude1?: string
  gratitude2?: string
  gratitude3?: string
  reflection?: string
  mood?: string
}

export interface UpdateJournalRequest {
  gratitude1?: string
  gratitude2?: string
  gratitude3?: string
  reflection?: string
  mood?: string
}

export interface JournalResponse {
  success: boolean
  data: JournalEntry
}

// ============================================================================
// Category API Types
// ============================================================================

export interface CreateCategoryRequest {
  name: string
  color?: string
  icon?: string
}

export interface CategoriesResponse {
  success: boolean
  data: Category[]
}

// ============================================================================
// Analytics API Types
// ============================================================================

export interface AnalyticsQueryParams {
  startDate?: string
  endDate?: string
  granularity?: 'day' | 'week' | 'month'
}

export interface AnalyticsResponse {
  success: boolean
  data: {
    stats: UserStats
    chartData: Analytics[]
    insights: string[]
  }
}

// ============================================================================
// AI API Types
// ============================================================================

export interface AISuggestRequest {
  userContext: {
    completedTasks?: string[]
    currentTime?: string
    userGoals?: string
    energyLevel?: EnergyLevel
    recentActivities?: string[]
  }
  requestType: 'task_suggestions' | 'productivity_insights' | 'goal_recommendations'
}

export interface AISuggestResponse {
  success: boolean
  data: {
    suggestions: AISuggestion[]
    insights?: string[]
    reasoning?: string
  }
}

export interface AISuggestion {
  title: string
  description: string
  priority: Priority
  estimatedTime?: number
  energyLevel?: EnergyLevel
  reason: string
  category?: string
}

// ============================================================================
// Auth API Types
// ============================================================================

export interface RegisterRequest {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  password: string
  confirmPassword: string
}

export interface VerifyCodeRequest {
  email: string
  code: string
}

export interface SetPasswordRequest {
  password: string
  confirmPassword: string
}

export interface AuthResponse {
  success: boolean
  message: string
  data?: {
    user?: {
      id: string
      name: string
      email: string
    }
    token?: string
  }
}

// ============================================================================
// User API Types
// ============================================================================

export interface UpdateProfileRequest {
  name?: string
  location?: string
  timezone?: string
}

export interface UpdateProfileImageRequest {
  image: string // Base64 or URL
}

export interface UserStatsResponse {
  success: boolean
  data: UserStats
}

// ============================================================================
// Prayer Times API Types
// ============================================================================

export interface PrayerTimesQueryParams {
  date?: string
  latitude?: number
  longitude?: number
}

export interface PrayerTimesResponse {
  success: boolean
  data: PrayerTime
}

export interface PrayerTrackingRequest {
  prayerName: string
  completedAt?: string | Date
  onTime?: boolean
}

// ============================================================================
// Quotes API Types
// ============================================================================

export interface DailyQuoteResponse {
  success: boolean
  data: IslamicQuote
}

export interface QuotesResponse {
  success: boolean
  data: IslamicQuote[]
}
