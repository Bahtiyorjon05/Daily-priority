'use client'

import { Toaster } from 'sonner'
import { useTheme } from 'next-themes'

export function ToastProvider() {
  const { theme } = useTheme()
  
  return (
    <Toaster
      position="top-right"
      theme={theme as 'light' | 'dark' | 'system'}
      richColors
      closeButton
      expand={true}
      duration={4000}
      toastOptions={{
        style: {
          background: 'hsl(var(--background))',
          border: '1px solid hsl(var(--border))',
          color: 'hsl(var(--foreground))',
        },
      }}
    />
  )
}