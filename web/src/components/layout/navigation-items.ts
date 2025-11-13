import type { ComponentType } from 'react'
import {
  Home,
  Activity,
  Sparkles,
  Timer,
  Calendar,
  Target,
  BookHeart,
  BarChart3,
  Settings,
} from 'lucide-react'

export type NavItem = {
  path: string
  icon: ComponentType<{ className?: string }>
  label: string
  description: string
  // Tailwind-safe static classes (no dynamic building)
  gradient: string // e.g., 'bg-gradient-to-r from-blue-500 to-cyan-500'
  bgHover: string // e.g., 'hover:bg-blue-50 dark:hover:bg-blue-950/30'
  text: string // e.g., 'text-blue-700 dark:text-blue-300'
  shadowActive: string // e.g., 'shadow-blue-500/25'
}

export const navigationItems: NavItem[] = [
  {
    path: '/dashboard',
    icon: Home,
    label: 'Dashboard',
    description: 'Overview',
    gradient: 'bg-gradient-to-r from-blue-500 to-cyan-500',
    bgHover: 'hover:bg-blue-50 dark:hover:bg-blue-950/30',
    text: 'text-blue-700 dark:text-blue-300',
    shadowActive: 'shadow-blue-500/25',
  },
  {
    path: '/analytics',
    icon: BarChart3,
    label: 'Analytics',
    description: 'Insights',
    gradient: 'bg-gradient-to-r from-indigo-500 to-purple-500',
    bgHover: 'hover:bg-indigo-50 dark:hover:bg-indigo-950/30',
    text: 'text-indigo-700 dark:text-indigo-300',
    shadowActive: 'shadow-indigo-500/25',
  },
  {
    path: '/prayers',
    icon: Activity,
    label: 'Prayers',
    description: 'Prayer times',
    gradient: 'bg-gradient-to-r from-emerald-500 to-teal-500',
    bgHover: 'hover:bg-emerald-50 dark:hover:bg-emerald-950/30',
    text: 'text-emerald-700 dark:text-emerald-300',
    shadowActive: 'shadow-emerald-500/25',
  },
  {
    path: '/adhkar',
    icon: Sparkles,
    label: 'Adhkar',
    description: 'Remembrance',
    gradient: 'bg-gradient-to-r from-purple-500 to-violet-500',
    bgHover: 'hover:bg-purple-50 dark:hover:bg-purple-950/30',
    text: 'text-purple-700 dark:text-purple-300',
    shadowActive: 'shadow-purple-500/25',
  },
  {
    path: '/focus',
    icon: Timer,
    label: 'Focus',
    description: 'Deep work',
    gradient: 'bg-gradient-to-r from-orange-500 to-red-500',
    bgHover: 'hover:bg-orange-50 dark:hover:bg-orange-950/30',
    text: 'text-orange-700 dark:text-orange-300',
    shadowActive: 'shadow-orange-500/25',
  },
  {
    path: '/calendar',
    icon: Calendar,
    label: 'Calendar',
    description: 'Schedule',
    gradient: 'bg-gradient-to-r from-teal-500 to-cyan-500',
    bgHover: 'hover:bg-teal-50 dark:hover:bg-teal-950/30',
    text: 'text-teal-700 dark:text-teal-300',
    shadowActive: 'shadow-teal-500/25',
  },
  {
    path: '/goals',
    icon: Target,
    label: 'Goals',
    description: 'Progress',
    gradient: 'bg-gradient-to-r from-amber-500 to-yellow-500',
    bgHover: 'hover:bg-amber-50 dark:hover:bg-amber-950/30',
    text: 'text-amber-700 dark:text-amber-300',
    shadowActive: 'shadow-amber-500/25',
  },
  {
    path: '/habits',
    icon: Target,
    label: 'Habits',
    description: 'Build daily',
    gradient: 'bg-gradient-to-r from-green-500 to-emerald-500',
    bgHover: 'hover:bg-green-50 dark:hover:bg-green-950/30',
    text: 'text-green-700 dark:text-green-300',
    shadowActive: 'shadow-green-500/25',
  },
  {
    path: '/journal',
    icon: BookHeart,
    label: 'Journal',
    description: 'Reflect',
    gradient: 'bg-gradient-to-r from-pink-500 to-rose-500',
    bgHover: 'hover:bg-pink-50 dark:hover:bg-pink-950/30',
    text: 'text-pink-700 dark:text-pink-300',
    shadowActive: 'shadow-pink-500/25',
  },
  {
    path: '/settings',
    icon: Settings,
    label: 'Settings',
    description: 'Preferences',
    gradient: 'bg-gradient-to-r from-slate-500 to-gray-500',
    bgHover: 'hover:bg-slate-50 dark:hover:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-300',
    shadowActive: 'shadow-slate-500/25',
  },
]
