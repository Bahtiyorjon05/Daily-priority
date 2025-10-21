import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

export function formatTime(minutes: number): string {
  if (minutes < 60) return (minutes) + 'm'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? (hours) + 'h ' + (mins) + 'm' : (hours) + 'h'
}

export function getQuadrant(urgent: boolean, important: boolean): string {
  if (urgent && important) return 'DO_FIRST'
  if (!urgent && important) return 'SCHEDULE'
  if (urgent && !important) return 'DELEGATE'
  return 'ELIMINATE'
}

export function getPriorityColor(priority: string): string {
  const colors = {
    URGENT: 'text-red-600 bg-red-50 border-red-200',
    HIGH: 'text-orange-600 bg-orange-50 border-orange-200',
    MEDIUM: 'text-blue-600 bg-blue-50 border-blue-200',
    LOW: 'text-gray-600 bg-gray-50 border-gray-200'
  }
  return colors[priority as keyof typeof colors] || colors.MEDIUM
}

export function getEnergyColor(energy: string): string {
  const colors = {
    HIGH: 'text-green-600',
    MEDIUM: 'text-yellow-600',
    LOW: 'text-red-600'
  }
  return colors[energy as keyof typeof colors] || colors.MEDIUM
}

export function calculateStreak(completions: Date[]): number {
  if (completions.length === 0) return 0
  
  const sorted = completions.sort((a, b) => b.getTime() - a.getTime())
  let streak = 1
  
  for (let i = 0; i < sorted.length - 1; i++) {
    const diff = Math.abs(sorted[i].getTime() - sorted[i + 1].getTime())
    const daysDiff = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (daysDiff === 1) {
      streak++
    } else {
      break
    }
  }
  
  return streak
}

export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function getMotivationalQuote(): string {
  const quotes = [
    "Focus on being productive instead of busy.",
    "The key is not to prioritize what's on your schedule, but to schedule your priorities.",
    "You don't have to be great to start, but you have to start to be great.",
    "Success is the sum of small efforts repeated day in and day out.",
    "The secret of getting ahead is getting started.",
    "Don't watch the clock; do what it does. Keep going.",
    "The future depends on what you do today.",
    "Productivity is never an accident. It is always the result of commitment to excellence.",
  ]
  return quotes[Math.floor(Math.random() * quotes.length)]
}
