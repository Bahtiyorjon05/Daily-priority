import * as React from 'react'
import { cn } from '@/lib/utils'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string; // Add label support
  error?: string; // Add error message support
  description?: string; // Add description support
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, description, variant = 'default', size = 'md', id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    
    const variants = {
      default: 'border-input focus:border-ring',
      primary: 'border-blue-300 focus:border-blue-500 focus:ring-blue-500/20 dark:border-blue-700 dark:focus:border-blue-500',
      success: 'border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500/20 dark:border-emerald-700 dark:focus:border-emerald-500',
      warning: 'border-amber-300 focus:border-amber-500 focus:ring-amber-500/20 dark:border-amber-700 dark:focus:border-amber-500',
      destructive: 'border-red-300 focus:border-red-500 focus:ring-red-500/20 dark:border-red-700 dark:focus:border-red-500'
    } as const;

    // Get the correct class based on size
    let sizeClass = '';
    switch (size) {
      case 'sm':
        sizeClass = 'h-8 text-sm px-2.5 py-1.5';
        break;
      case 'md':
        sizeClass = 'h-10 text-sm px-3 py-2';
        break;
      case 'lg':
        sizeClass = 'h-12 text-base px-4 py-3';
        break;
      default:
        sizeClass = 'h-10 text-sm px-3 py-2';
    }

    // Get the correct class based on variant
    const variantClass = variants[variant] || variants.default;

    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={inputId} 
            className="block text-sm font-medium leading-none tracking-tight peer-disabled:cursor-not-allowed peer-disabled:opacity-70 transition-colors duration-200 mb-2"
          >
            {label}
            {props.required && <span className="text-destructive"> *</span>}
          </label>
        )}
        
        {description && (
          <p id={`${inputId}-description`} className="text-sm text-muted-foreground mb-2">
            {description}
          </p>
        )}
        
        <input
          id={inputId}
          type={type}
          className={cn(
            'flex w-full rounded-lg border bg-background transition-all duration-200 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            variantClass,
            sizeClass,
            error && 'border-destructive focus-visible:ring-destructive',
            className
          )}
          ref={ref}
          aria-describedby={description ? `${inputId}-description` : undefined}
          aria-invalid={!!error}
          {...props}
        />
        
        {error && (
          <p id={`${inputId}-error`} className="text-sm font-medium text-destructive mt-1" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }