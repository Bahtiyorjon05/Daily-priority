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

interface GoalsFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedCategory: 'ALL' | 'IBADAH' | 'KNOWLEDGE' | 'FAMILY' | 'WORK' | 'HEALTH' | 'COMMUNITY' | 'PERSONAL'
  onCategoryChange: (category: 'ALL' | 'IBADAH' | 'KNOWLEDGE' | 'FAMILY' | 'WORK' | 'HEALTH' | 'COMMUNITY' | 'PERSONAL') => void
  selectedStatus: 'ALL' | 'ACTIVE' | 'COMPLETED' | 'OVERDUE'
  onStatusChange: (status: 'ALL' | 'ACTIVE' | 'COMPLETED' | 'OVERDUE') => void
  sortBy: 'date' | 'progress' | 'deadline' | 'category'
  onSortChange: (sort: 'date' | 'progress' | 'deadline' | 'category') => void
}

export function GoalsFilters({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  sortBy,
  onSortChange
}: GoalsFiltersProps) {
  return (
    <div className="space-y-4 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800/50 p-6 rounded-2xl border-2 border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 dark:text-gray-400" />
        <Input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search goals by title or description..."
          className="pl-12 h-12 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 focus:border-emerald-500 dark:focus:border-emerald-500 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 rounded-xl text-sm"
        />
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Category Filter */}
        <div>
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 block uppercase tracking-wide">
            Category
          </label>
          <Select value={selectedCategory} onValueChange={onCategoryChange}>
            <SelectTrigger className="h-11 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600">
              <SelectItem value="ALL" className="text-gray-900 dark:text-white focus:bg-emerald-50 dark:focus:bg-emerald-900/20">All Categories</SelectItem>
              <SelectItem value="IBADAH" className="text-purple-700 dark:text-purple-400 focus:bg-purple-50 dark:focus:bg-purple-900/20">Ibadah</SelectItem>
              <SelectItem value="KNOWLEDGE" className="text-blue-700 dark:text-blue-400 focus:bg-blue-50 dark:focus:bg-blue-900/20">Knowledge</SelectItem>
              <SelectItem value="FAMILY" className="text-pink-700 dark:text-pink-400 focus:bg-pink-50 dark:focus:bg-pink-900/20">Family</SelectItem>
              <SelectItem value="WORK" className="text-amber-700 dark:text-amber-400 focus:bg-amber-50 dark:focus:bg-amber-900/20">Work</SelectItem>
              <SelectItem value="HEALTH" className="text-green-700 dark:text-green-400 focus:bg-green-50 dark:focus:bg-green-900/20">Health</SelectItem>
              <SelectItem value="COMMUNITY" className="text-cyan-700 dark:text-cyan-400 focus:bg-cyan-50 dark:focus:bg-cyan-900/20">Community</SelectItem>
              <SelectItem value="PERSONAL" className="text-indigo-700 dark:text-indigo-400 focus:bg-indigo-50 dark:focus:bg-indigo-900/20">Personal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 block uppercase tracking-wide">
            Status
          </label>
          <Select value={selectedStatus} onValueChange={onStatusChange}>
            <SelectTrigger className="h-11 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600">
              <SelectItem value="ALL" className="text-gray-900 dark:text-white focus:bg-emerald-50 dark:focus:bg-emerald-900/20">All Status</SelectItem>
              <SelectItem value="ACTIVE" className="text-blue-700 dark:text-blue-400 focus:bg-blue-50 dark:focus:bg-blue-900/20">Active</SelectItem>
              <SelectItem value="COMPLETED" className="text-green-700 dark:text-green-400 focus:bg-green-50 dark:focus:bg-green-900/20">Completed</SelectItem>
              <SelectItem value="OVERDUE" className="text-red-700 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-900/20">Overdue</SelectItem>
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
              <SelectItem value="date" className="text-gray-900 dark:text-white focus:bg-emerald-50 dark:focus:bg-emerald-900/20">Date Created</SelectItem>
              <SelectItem value="progress" className="text-gray-900 dark:text-white focus:bg-emerald-50 dark:focus:bg-emerald-900/20">Progress</SelectItem>
              <SelectItem value="deadline" className="text-gray-900 dark:text-white focus:bg-emerald-50 dark:focus:bg-emerald-900/20">Deadline</SelectItem>
              <SelectItem value="category" className="text-gray-900 dark:text-white focus:bg-emerald-50 dark:focus:bg-emerald-900/20">Category</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
