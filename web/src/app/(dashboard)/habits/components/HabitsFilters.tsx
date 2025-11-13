'use client'

import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface HabitsFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedFrequency: 'ALL' | 'DAILY' | 'WEEKLY' | 'CUSTOM'
  onFrequencyChange: (frequency: 'ALL' | 'DAILY' | 'WEEKLY' | 'CUSTOM') => void
  sortBy: 'date' | 'streak' | 'name'
  onSortChange: (sort: 'date' | 'streak' | 'name') => void
}

export function HabitsFilters({
  searchQuery,
  onSearchChange,
  selectedFrequency,
  onFrequencyChange,
  sortBy,
  onSortChange
}: HabitsFiltersProps) {
  return (
    <div className="space-y-4 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800/50 p-6 rounded-2xl border-2 border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 dark:text-gray-400" />
        <Input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search habits..."
          className="pl-12 h-12 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 focus:border-emerald-500 dark:focus:border-emerald-500 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 rounded-xl text-sm"
        />
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Frequency Filter */}
        <div>
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 block uppercase tracking-wide">
            Frequency
          </label>
          <Select value={selectedFrequency} onValueChange={onFrequencyChange}>
            <SelectTrigger className="h-11 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600">
              <SelectItem value="ALL" className="text-gray-900 dark:text-white focus:bg-emerald-50 dark:focus:bg-emerald-900/20">All Frequencies</SelectItem>
              <SelectItem value="DAILY" className="text-emerald-700 dark:text-emerald-400 focus:bg-emerald-50 dark:focus:bg-emerald-900/20">📅 Daily</SelectItem>
              <SelectItem value="WEEKLY" className="text-blue-700 dark:text-blue-400 focus:bg-blue-50 dark:focus:bg-blue-900/20">📆 Weekly</SelectItem>
              <SelectItem value="CUSTOM" className="text-purple-700 dark:text-purple-400 focus:bg-purple-50 dark:focus:bg-purple-900/20">⚙️ Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort */}
        <div>
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 block uppercase tracking-wide">
            Sort By
          </label>
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="h-11 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600">
              <SelectItem value="date" className="text-gray-900 dark:text-white focus:bg-emerald-50 dark:focus:bg-emerald-900/20">📅 Date Created</SelectItem>
              <SelectItem value="streak" className="text-gray-900 dark:text-white focus:bg-emerald-50 dark:focus:bg-emerald-900/20">🔥 Streak</SelectItem>
              <SelectItem value="name" className="text-gray-900 dark:text-white focus:bg-emerald-50 dark:focus:bg-emerald-900/20">🔤 Name</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
