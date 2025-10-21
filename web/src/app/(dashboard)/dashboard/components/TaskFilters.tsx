'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'

interface TaskFiltersProps {
  currentFilter: 'all' | 'pending' | 'completed'
  onFilterChange: (filter: 'all' | 'pending' | 'completed') => void
  taskCount: number
}

const filters = [
  { key: 'all', label: 'All Tasks', color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400' },
  { key: 'pending', label: 'Pending', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
  { key: 'completed', label: 'Completed', color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' }
] as const

export default function TaskFilters({ currentFilter, onFilterChange, taskCount }: TaskFiltersProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1 p-1 bg-slate-100/80 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        {filters.map((filter) => (
          <motion.div key={filter.key} className="relative">
            <Button
              variant={currentFilter === filter.key ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onFilterChange(filter.key)}
              className={`
                relative z-10 transition-all duration-200 rounded-lg
                ${currentFilter === filter.key 
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm' 
                  : 'hover:bg-white/60 dark:hover:bg-slate-700/50'
                }
              `}
            >
              {filter.label}
            </Button>
            {currentFilter === filter.key && (
              <motion.div
                layoutId="activeFilter"
                className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-sm"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </motion.div>
        ))}
      </div>
      
      <div className="text-sm text-slate-600 dark:text-slate-400">
        {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
      </div>
    </div>
  )
}
