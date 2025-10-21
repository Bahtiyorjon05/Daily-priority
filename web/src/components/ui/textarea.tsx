import * as React from 'react'
import { cn } from '@/lib/utils'

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string; // Add label support
  error?: string; // Add error message support
  description?: string; // Add description support
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, description, id, ...props }, ref) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
    
    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={textareaId} 
            className="block text-sm font-medium leading-none tracking-tight peer-disabled:cursor-not-allowed peer-disabled:opacity-70 transition-colors duration-200 mb-2"
          >
            {label}
            {props.required && <span className="text-destructive"> *</span>}
          </label>
        )}
        
        {description && (
          <p id={`${textareaId}-description`} className="text-sm text-muted-foreground mb-2">
            {description}
          </p>
        )}
        
        <textarea
          id={textareaId}
          className={cn(
            'flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm transition-all duration-200 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:border-ring/50 disabled:cursor-not-allowed disabled:opacity-50 resize-none',
            error && 'border-destructive focus-visible:ring-destructive',
            className
          )}
          ref={ref}
          aria-describedby={description ? `${textareaId}-description` : undefined}
          aria-invalid={!!error}
          {...props}
        />
        
        {error && (
          <p id={`${textareaId}-error`} className="text-sm font-medium text-destructive mt-1" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }