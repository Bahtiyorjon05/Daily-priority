/**
 * Reusable style constants
 * Common CSS classes and style configurations
 */

// ============================================================================
// Card Styles
// ============================================================================

export const CARD_STYLES = {
  base: 'rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-300',
  hover: 'hover:shadow-lg hover:border-primary/20',
  interactive: 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]',
  glass: 'backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 border-white/20',
  gradient: 'bg-gradient-to-br',
} as const

export const CARD_PADDING = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8',
} as const

// ============================================================================
// Button Styles
// ============================================================================

export const BUTTON_STYLES = {
  base: 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  variants: {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    outline: 'border-2 border-input bg-background hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
  },
  sizes: {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 py-2 text-sm',
    lg: 'h-12 px-6 text-base',
  },
} as const

// ============================================================================
// Input Styles
// ============================================================================

export const INPUT_STYLES = {
  base: 'flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50',
  error: 'border-red-500 focus-visible:ring-red-500',
  success: 'border-green-500 focus-visible:ring-green-500',
} as const

// ============================================================================
// Badge Styles
// ============================================================================

export const BADGE_STYLES = {
  base: 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  variants: {
    default: 'bg-primary/10 text-primary border border-primary/20',
    secondary: 'bg-secondary text-secondary-foreground',
    outline: 'border border-input bg-background',
    success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
    warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
    danger: 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400',
    info: 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400',
  },
} as const

// ============================================================================
// Animation Styles
// ============================================================================

export const ANIMATION_STYLES = {
  fadeIn: 'animate-in fade-in duration-300',
  fadeOut: 'animate-out fade-out duration-200',
  slideIn: 'animate-in slide-in-from-bottom-4 duration-300',
  slideOut: 'animate-out slide-out-to-bottom-4 duration-200',
  scaleIn: 'animate-in zoom-in-95 duration-200',
  scaleOut: 'animate-out zoom-out-95 duration-200',
  spin: 'animate-spin',
  pulse: 'animate-pulse',
  bounce: 'animate-bounce',
} as const

// ============================================================================
// Layout Styles
// ============================================================================

export const LAYOUT_STYLES = {
  container: 'container mx-auto px-4 sm:px-6 lg:px-8',
  section: 'py-8 sm:py-12 lg:py-16',
  grid: 'grid gap-4 sm:gap-6',
  gridCols: {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  },
  flex: 'flex items-center',
  flexBetween: 'flex items-center justify-between',
  flexCenter: 'flex items-center justify-center',
} as const

// ============================================================================
// Text Styles
// ============================================================================

export const TEXT_STYLES = {
  h1: 'scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl',
  h2: 'scroll-m-20 text-3xl font-semibold tracking-tight',
  h3: 'scroll-m-20 text-2xl font-semibold tracking-tight',
  h4: 'scroll-m-20 text-xl font-semibold tracking-tight',
  p: 'leading-7',
  lead: 'text-xl text-muted-foreground',
  large: 'text-lg font-semibold',
  small: 'text-sm font-medium leading-none',
  muted: 'text-sm text-muted-foreground',
  truncate: 'truncate',
  ellipsis: 'overflow-hidden text-ellipsis',
} as const

// ============================================================================
// Shadow Styles
// ============================================================================

export const SHADOW_STYLES = {
  none: 'shadow-none',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  inner: 'shadow-inner',
  glow: 'shadow-lg shadow-primary/20',
} as const

// ============================================================================
// Border Radius Styles
// ============================================================================

export const RADIUS_STYLES = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
  full: 'rounded-full',
} as const

// ============================================================================
// Transition Styles
// ============================================================================

export const TRANSITION_STYLES = {
  base: 'transition-all duration-200',
  slow: 'transition-all duration-300',
  slower: 'transition-all duration-500',
  fast: 'transition-all duration-150',
  colors: 'transition-colors duration-200',
  transform: 'transition-transform duration-200',
  opacity: 'transition-opacity duration-200',
} as const

// ============================================================================
// Scroll Styles
// ============================================================================

export const SCROLL_STYLES = {
  smooth: 'scroll-smooth',
  hide: 'scrollbar-hide overflow-auto',
  thin: 'overflow-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700',
  custom: 'overflow-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-700',
} as const

// ============================================================================
// Focus Styles
// ============================================================================

export const FOCUS_STYLES = {
  ring: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  outline: 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
} as const

// ============================================================================
// Loading Skeleton Styles
// ============================================================================

export const SKELETON_STYLES = {
  base: 'animate-pulse rounded-md bg-gray-200 dark:bg-gray-800',
  text: 'h-4 bg-gray-200 dark:bg-gray-800 rounded',
  circle: 'rounded-full bg-gray-200 dark:bg-gray-800',
  avatar: 'rounded-full bg-gray-200 dark:bg-gray-800 w-10 h-10',
} as const

// ============================================================================
// Glass Effect Styles
// ============================================================================

export const GLASS_STYLES = {
  light: 'backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 border border-white/20',
  medium: 'backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border border-white/30',
  heavy: 'backdrop-blur-lg bg-white/60 dark:bg-gray-900/60 border border-white/40',
  frosted: 'backdrop-blur-xl bg-white/50 dark:bg-gray-900/50 border border-white/50',
} as const

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Combine card styles
 */
export function getCardStyles(options?: {
  hover?: boolean
  interactive?: boolean
  glass?: boolean
  padding?: keyof typeof CARD_PADDING
}): string {
  const classes: string[] = [CARD_STYLES.base]

  if (options?.hover) classes.push(CARD_STYLES.hover)
  if (options?.interactive) classes.push(CARD_STYLES.interactive)
  if (options?.glass) classes.push(CARD_STYLES.glass)
  if (options?.padding) classes.push(CARD_PADDING[options.padding])

  return classes.join(' ')
}

/**
 * Get button styles with variant and size
 */
export function getButtonStyles(
  variant: keyof typeof BUTTON_STYLES.variants = 'primary',
  size: keyof typeof BUTTON_STYLES.sizes = 'md'
): string {
  return `${BUTTON_STYLES.base} ${BUTTON_STYLES.variants[variant]} ${BUTTON_STYLES.sizes[size]}`
}

/**
 * Get badge styles with variant
 */
export function getBadgeStyles(variant: keyof typeof BADGE_STYLES.variants = 'default'): string {
  return `${BADGE_STYLES.base} ${BADGE_STYLES.variants[variant]}`
}

/**
 * Get grid column classes
 */
export function getGridCols(cols: keyof typeof LAYOUT_STYLES.gridCols): string {
  return `${LAYOUT_STYLES.grid} ${LAYOUT_STYLES.gridCols[cols]}`
}
