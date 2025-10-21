import * as React from 'react'
import { cn } from '@/lib/utils'

export type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  role?: string; // Add role support for accessibility
  ariaLabel?: string; // Add aria-label support
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'destructive' | 'premium';
  hoverEffect?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, role, ariaLabel, variant = 'default', hoverEffect = true, ...props }, ref) => {
    const variants = {
      default: 'border bg-card text-card-foreground shadow-sm',
      primary: 'border border-blue-200 bg-blue-50/50 text-card-foreground shadow-sm dark:border-blue-800/50 dark:bg-blue-950/20',
      secondary: 'border border-gray-200 bg-gray-50/50 text-card-foreground shadow-sm dark:border-gray-700/50 dark:bg-gray-900/20',
      success: 'border border-emerald-200 bg-emerald-50/50 text-card-foreground shadow-sm dark:border-emerald-800/50 dark:bg-emerald-950/20',
      warning: 'border border-amber-200 bg-amber-50/50 text-card-foreground shadow-sm dark:border-amber-800/50 dark:bg-amber-950/20',
      destructive: 'border border-red-200 bg-red-50/50 text-card-foreground shadow-sm dark:border-red-800/50 dark:bg-red-950/20',
      premium: 'border border-purple-200 bg-gradient-to-br from-purple-50/50 to-indigo-50/50 text-card-foreground shadow-sm dark:border-purple-800/50 dark:from-purple-950/20 dark:to-indigo-950/20'
    }

    const hoverEffects = {
      default: hoverEffect ? 'hover:shadow-md transition-shadow duration-300' : '',
      primary: hoverEffect ? 'hover:shadow-md hover:border-blue-300 transition-all duration-300 dark:hover:border-blue-700' : '',
      secondary: hoverEffect ? 'hover:shadow-md hover:border-gray-300 transition-all duration-300 dark:hover:border-gray-600' : '',
      success: hoverEffect ? 'hover:shadow-md hover:border-emerald-300 transition-all duration-300 dark:hover:border-emerald-700' : '',
      warning: hoverEffect ? 'hover:shadow-md hover:border-amber-300 transition-all duration-300 dark:hover:border-amber-700' : '',
      destructive: hoverEffect ? 'hover:shadow-md hover:border-red-300 transition-all duration-300 dark:hover:border-red-700' : '',
      premium: hoverEffect ? 'hover:shadow-md hover:border-purple-300 transition-all duration-300 dark:hover:border-purple-700' : ''
    }

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl transition-all duration-300',
          variants[variant],
          hoverEffects[variant],
          className
        )}
        role={role}
        aria-label={ariaLabel}
        {...props}
      />
    )
  }
)
Card.displayName = 'Card'

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 p-6', className)}
      {...props}
    />
  )
)
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement> & { level?: 1 | 2 | 3 | 4 | 5 | 6 }>(
  ({ className, level = 3, children, ...props }, ref) => {
    // Map level to heading tag
    const headingTags = {
      1: 'h1',
      2: 'h2',
      3: 'h3',
      4: 'h4',
      5: 'h5',
      6: 'h6'
    } as const;

    const Tag = headingTags[level] as keyof React.JSX.IntrinsicElements;
    
    return React.createElement(
      Tag,
      {
        ref,
        className: cn('text-2xl font-semibold leading-none tracking-tight', className),
        ...props
      },
      children
    );
  }
)
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
)
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
)
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center p-6 pt-0', className)}
      {...props}
    />
  )
)
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }