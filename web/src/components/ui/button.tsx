import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'success' | 'warning' | 'premium'
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'xs' | 'xl'
  isLoading?: boolean // Add loading state for accessibility
  shadow?: 'sm' | 'md' | 'lg' | 'xl' | 'none'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', isLoading = false, shadow = 'md', children, ...props }, ref) => {
    const variants = {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-95',
      outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:border-accent-foreground/20 active:scale-95',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-95',
      ghost: 'hover:bg-accent hover:text-accent-foreground active:scale-95',
      link: 'text-primary underline-offset-4 hover:underline',
      success: 'bg-emerald-500 text-white hover:bg-emerald-600 active:scale-95',
      warning: 'bg-amber-500 text-white hover:bg-amber-600 active:scale-95',
      premium: 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700 active:scale-95'
    }

    const sizes = {
      default: 'h-10 px-4 py-2',
      sm: 'h-9 rounded-md px-3 text-xs',
      lg: 'h-12 rounded-lg px-8 text-base',
      icon: 'h-10 w-10',
      xs: 'h-8 rounded-md px-2.5 text-xs',
      xl: 'h-14 rounded-xl px-10 text-lg'
    }

    const shadows = {
      none: '',
      sm: 'shadow-sm',
      md: 'shadow',
      lg: 'shadow-lg',
      xl: 'shadow-xl'
    }

    const shadowHover = {
      none: 'hover:shadow-none',
      sm: 'hover:shadow',
      md: 'hover:shadow-lg',
      lg: 'hover:shadow-xl',
      xl: 'hover:shadow-2xl'
    }

    // Ensure buttons have proper accessible attributes
    const ariaProps = {
      'aria-busy': isLoading,
      'aria-disabled': props.disabled || isLoading,
    }

    return (
      <button
        className={cn(
          'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed ui-element',
          variants[variant],
          sizes[size],
          shadows[shadow],
          shadowHover[shadow],
          className
        )}
        ref={ref}
        {...ariaProps}
        {...props}
      >
        {isLoading ? (
          <>
            <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
            <span className="sr-only">Loading</span>
          </>
        ) : null}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

export { Button }