/**
 * TaskFilters Component
 * Comprehensive task filtering UI
 */

'use client'

import { memo, useCallback } from 'react'
import {
  Search,
  SlidersHorizontal,
  Grid3x3,
  List,
  ArrowUpDown,
  Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { TaskFiltersProps } from '@/types/components'
import { cn } from '@/lib/utils'

const TaskFilters = memo<TaskFiltersProps>(({
  activeFilter,
  onFilterChange,
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
  categories,
  selectedCategory,
  onCategoryChange,
  taskCounts = {
    all: 0,
    pending: 0,
    completed: 0,
    urgent: 0,
    important: 0,
  },
  className,
}) => {
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onSearchChange(e.target.value)
    },
    [onSearchChange]
  )

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search tasks..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="pl-10"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <Button
          variant={activeFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFilterChange('all')}
          className="whitespace-nowrap"
        >
          All
          <Badge variant="secondary" className="ml-2">
            {taskCounts.all}
          </Badge>
        </Button>

        <Button
          variant={activeFilter === 'pending' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFilterChange('pending')}
          className="whitespace-nowrap"
        >
          Pending
          <Badge variant="secondary" className="ml-2">
            {taskCounts.pending}
          </Badge>
        </Button>

        <Button
          variant={activeFilter === 'completed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFilterChange('completed')}
          className="whitespace-nowrap"
        >
          Completed
          <Badge variant="secondary" className="ml-2">
            {taskCounts.completed}
          </Badge>
        </Button>

        <Button
          variant={activeFilter === 'urgent' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFilterChange('urgent')}
          className="whitespace-nowrap"
        >
          Urgent
          <Badge variant="secondary" className="ml-2">
            {taskCounts.urgent}
          </Badge>
        </Button>

        <Button
          variant={activeFilter === 'important' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFilterChange('important')}
          className="whitespace-nowrap"
        >
          Important
          <Badge variant="secondary" className="ml-2">
            {taskCounts.important}
          </Badge>
        </Button>
      </div>

      {/* Advanced filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Category filter */}
          {categories && categories.length > 0 && onCategoryChange && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Category
                  {selectedCategory && (
                    <Badge variant="secondary" className="ml-1">
                      1
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Filter by category</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onCategoryChange(null)}>
                  All categories
                </DropdownMenuItem>
                {categories.map((category) => (
                  <DropdownMenuItem
                    key={category.id}
                    onClick={() => onCategoryChange(category.id)}
                  >
                    <div
                      className="h-3 w-3 rounded-full mr-2"
                      style={{ backgroundColor: category.color }}
                    />
                    {category.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Sort menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowUpDown className="h-4 w-4" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onSortChange('priority')}>
                Priority
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSortChange('dueDate')}>
                Due date
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSortChange('createdAt')}>
                Created date
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSortChange('title')}>
                Title
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
})

TaskFilters.displayName = 'TaskFilters'

export default TaskFilters
