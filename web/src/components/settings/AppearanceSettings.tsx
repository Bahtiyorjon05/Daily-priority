'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useTheme } from '@/components/theme-provider'
import { Sun, Moon, Monitor, Palette } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme()

  const themes = [
    { value: 'light', label: 'Light', icon: Sun, description: 'Clean and bright interface' },
    { value: 'dark', label: 'Dark', icon: Moon, description: 'Easy on the eyes at night' },
    { value: 'system', label: 'System', icon: Monitor, description: 'Follow system settings' },
  ]

  return (
    <Card className="border-2 border-slate-200 dark:border-slate-800 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          <CardTitle className="text-2xl">Appearance</CardTitle>
        </div>
        <CardDescription className="text-base">Customize how the app looks and feels</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <Label className="text-base font-semibold">Theme Preference</Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {themes.map((t) => (
              <button
                key={t.value}
                onClick={() => setTheme(t.value as any)}
                className={cn(
                  'flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all hover:scale-105',
                  theme === t.value
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-950 shadow-lg ring-2 ring-purple-200 dark:ring-purple-800'
                    : 'border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md'
                )}
              >
                <div className={cn(
                  'p-3 rounded-full',
                  theme === t.value 
                    ? 'bg-purple-100 dark:bg-purple-900' 
                    : 'bg-slate-100 dark:bg-slate-800'
                )}>
                  <t.icon className={cn(
                    'h-7 w-7',
                    theme === t.value 
                      ? 'text-purple-600 dark:text-purple-400' 
                      : 'text-slate-600 dark:text-slate-400'
                  )} />
                </div>
                <div className="text-center space-y-1">
                  <span className={cn(
                    'text-base font-semibold block',
                    theme === t.value && 'text-purple-700 dark:text-purple-300'
                  )}>
                    {t.label}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {t.description}
                  </span>
                </div>
                {theme === t.value && (
                  <div className="mt-2 px-3 py-1 rounded-full bg-purple-600 text-white text-xs font-medium">
                    Active
                  </div>
                )}
              </button>
            ))}
          </div>
          <p className="text-sm text-slate-500 mt-4">
            Theme changes apply instantly and are saved to your account
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
