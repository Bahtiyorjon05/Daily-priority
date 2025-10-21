'use client'

import { Button, type ButtonProps } from '@/components/ui/button'

interface AccessibleButtonProps extends ButtonProps {
  ariaLabel?: string
  shortcut?: string
}

export default function AccessibleButton({ 
  ariaLabel, 
  shortcut, 
  children, 
  ...props 
}: AccessibleButtonProps) {
  return (
    <Button 
      aria-label={ariaLabel}
      {...props}
    >
      {children}
      {shortcut && (
        <span className="ml-2 text-xs bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded">
          {shortcut}
        </span>
      )}
    </Button>
  )
}