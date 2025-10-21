'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Clock, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

const recentSearches = [
  'Prayer times',
  'Add new task',
  'Focus session',
  'Goals progress'
]

const quickActions = [
  { icon: Target, label: 'Add Task', action: '/dashboard' },
  { icon: Clock, label: 'Focus Timer', action: '/focus' }
]

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (isOpen) {
      setQuery('')
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-20"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl mx-4 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-slate-200 dark:border-slate-700">
              <Search className="h-5 w-5 text-slate-500" />
              <Input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search anything..."
                className="border-0 text-lg bg-transparent focus:ring-0"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 rounded-lg"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-4 max-h-96 overflow-y-auto">
              {query ? (
                <div>
                  <p className="text-sm text-slate-500 mb-3">Search results for "{query}"</p>
                  <div className="space-y-2">
                    <p className="text-slate-600 dark:text-slate-400 text-sm">No results found. Try a different search term.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Quick Actions */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Quick Actions</h3>
                    <div className="space-y-1">
                      {quickActions.map((action) => {
                        const Icon = action.icon
                        return (
                          <Button
                            key={action.label}
                            variant="ghost"
                            className="w-full justify-start hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                          >
                            <Icon className="h-4 w-4 mr-3 text-slate-500" />
                            {action.label}
                          </Button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Recent Searches */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Recent Searches</h3>
                    <div className="space-y-1">
                      {recentSearches.map((search) => (
                        <Button
                          key={search}
                          variant="ghost"
                          className="w-full justify-start hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                          onClick={() => setQuery(search)}
                        >
                          <Clock className="h-4 w-4 mr-3 text-slate-400" />
                          {search}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
