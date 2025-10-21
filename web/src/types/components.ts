/**
 * Component prop types
 * Reusable component interfaces
 */

import type {
  Task,
  Category,
  Habit,
  Goal,
  UserStats,
  TrendData,
  ViewMode,
  FilterType,
  SortOption,
  PrayerTimesData,
  TaskStatus,
  Priority
} from './models'

// ============================================================================
// Task Component Props
// ============================================================================

export interface TaskCardProps {
  task: Task
  viewMode?: ViewMode
  onEdit?: (task: Task) => void
  onDelete?: (taskId: string) => void
  onToggleComplete?: (taskId: string) => void
  onToggleUrgent?: (taskId: string) => void
  onToggleImportant?: (taskId: string) => void
  showCategory?: boolean
  showActions?: boolean
  isSelected?: boolean
  onSelect?: (taskId: string) => void
  className?: string
}

export interface TaskListProps {
  tasks: Task[]
  viewMode?: ViewMode
  isLoading?: boolean
  onTaskClick?: (task: Task) => void
  onTaskEdit?: (task: Task) => void
  onTaskDelete?: (taskId: string) => void
  onTaskToggle?: (taskId: string) => void
  emptyState?: React.ReactNode
  className?: string
}

export interface TaskFiltersProps {
  activeFilter: FilterType
  onFilterChange: (filter: FilterType) => void
  searchTerm: string
  onSearchChange: (search: string) => void
  sortBy: SortOption
  onSortChange: (sort: SortOption) => void
  categories?: Category[]
  selectedCategory?: string | null
  onCategoryChange?: (categoryId: string | null) => void
  taskCounts?: {
    all: number
    pending: number
    completed: number
    urgent: number
    important: number
  }
  className?: string
}

export interface TaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (task: Partial<Task>) => void
  task?: Task | null
  mode?: 'create' | 'edit'
  categories?: Category[]
  goals?: Goal[]
  isLoading?: boolean
}

// ============================================================================
// Stat Component Props
// ============================================================================

export interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  color?: 'blue' | 'emerald' | 'purple' | 'amber' | 'rose' | 'indigo'
  trend?: TrendData
  progress?: number
  subtitle?: string
  onClick?: () => void
  isLoading?: boolean
  className?: string
}

export interface StatsGridProps {
  stats: UserStats
  isLoading?: boolean
  onStatClick?: (statType: string) => void
  className?: string
}

// ============================================================================
// Prayer Component Props
// ============================================================================

export interface PrayerTimesWidgetProps {
  prayerTimes?: PrayerTimesData
  isLoading?: boolean
  onRefresh?: () => void
  compact?: boolean
  showNextPrayer?: boolean
  className?: string
}

export interface PrayerTimeCardProps {
  name: string
  time: string
  isNext?: boolean
  isCompleted?: boolean
  onToggleComplete?: () => void
  timeUntil?: string
  className?: string
}

// ============================================================================
// Modal Component Props
// ============================================================================

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  className?: string
}

export interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  isLoading?: boolean
}

// ============================================================================
// Layout Component Props
// ============================================================================

export interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  userName?: string
  userEmail?: string
  userImage?: string
  className?: string
}

export interface TopBarProps {
  onMenuClick: () => void
  onSearchClick: () => void
  onNotificationsClick: () => void
  userName?: string
  userImage?: string
  notificationCount?: number
  className?: string
}

export interface DashboardLayoutProps {
  children: React.ReactNode
  sidebar?: React.ReactNode
  header?: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

// ============================================================================
// Empty State Component Props
// ============================================================================

export interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

// ============================================================================
// Loading State Component Props
// ============================================================================

export interface LoadingStateProps {
  text?: string
  size?: 'sm' | 'md' | 'lg'
  fullScreen?: boolean
  className?: string
}

export interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular'
  width?: string | number
  height?: string | number
  count?: number
  className?: string
}

// ============================================================================
// Error Component Props
// ============================================================================

export interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
  retryText?: string
  className?: string
}

// ============================================================================
// Chart Component Props
// ============================================================================

export interface ChartData {
  date: string
  value: number
  label?: string
}

export interface LineChartProps {
  data: ChartData[]
  height?: number
  color?: string
  showGrid?: boolean
  showTooltip?: boolean
  className?: string
}

export interface BarChartProps {
  data: ChartData[]
  height?: number
  color?: string
  showGrid?: boolean
  showTooltip?: boolean
  className?: string
}

// ============================================================================
// AI Component Props
// ============================================================================

export interface AISuggestionsProps {
  onAcceptSuggestion: (suggestion: any) => void
  onDismiss: () => void
  userId?: string
  isLoading?: boolean
  className?: string
}

export interface AIChatProps {
  onSendMessage: (message: string) => void
  messages?: Array<{
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
  }>
  isLoading?: boolean
  className?: string
}

// ============================================================================
// Form Component Props
// ============================================================================

export interface FormFieldProps {
  label: string
  name: string
  type?: 'text' | 'email' | 'password' | 'textarea' | 'select' | 'checkbox'
  placeholder?: string
  required?: boolean
  error?: string
  helperText?: string
  disabled?: boolean
  options?: Array<{ label: string; value: string }>
  className?: string
}

// ============================================================================
// Button Component Props
// ============================================================================

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

// ============================================================================
// Dropdown Component Props
// ============================================================================

export interface DropdownProps {
  trigger: React.ReactNode
  items: Array<{
    label: string
    icon?: React.ReactNode
    onClick: () => void
    variant?: 'default' | 'danger'
    disabled?: boolean
  }>
  align?: 'start' | 'center' | 'end'
  className?: string
}
