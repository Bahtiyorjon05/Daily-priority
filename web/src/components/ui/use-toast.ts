'use client'

import { useState, useCallback } from 'react'

interface Toast {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
}

const toasts: Toast[] = []
let listeners: Array<(toasts: Toast[]) => void> = []

const addToast = (toast: Omit<Toast, 'id'>) => {
  const id = Math.random().toString(36)
  const newToast = { ...toast, id }
  toasts.push(newToast)
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    removeToast(id)
  }, 5000)
  
  listeners.forEach(listener => listener([...toasts]))
  return id
}

const removeToast = (id: string) => {
  const index = toasts.findIndex(t => t.id === id)
  if (index > -1) {
    toasts.splice(index, 1)
    listeners.forEach(listener => listener([...toasts]))
  }
}

export function useToast() {
  const [toastList, setToastList] = useState<Toast[]>([...toasts])
  
  const toast = useCallback((props: Omit<Toast, 'id'>) => {
    return addToast(props)
  }, [])
  
  const dismiss = useCallback((id: string) => {
    removeToast(id)
  }, [])
  
  // Subscribe to toast changes
  useState(() => {
    const listener = (newToasts: Toast[]) => setToastList([...newToasts])
    listeners.push(listener)
    
    return () => {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  })
  
  return {
    toast,
    dismiss,
    toasts: toastList
  }
}
