'use client'

import { memo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Zap, 
  Trash2, 
  AlertCircle, 
  Star, 
  Brain, 
  Sparkles 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface Task {
  id: string
  title: string
  description?: string
  status: string
  urgent: boolean
  important: boolean
  estimatedTime?: number
  energyLevel?: string
  aiSuggested: boolean
  aiReason?: string
  createdAt: string
  completedAt?: string
  priority?: string
  dueDate?: string
  category?: {
    name: string
    color: string
  }
}

interface TaskCardProps {
  task: Task
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onSelect?: (id: string) => void
  isSelected?: boolean
  bulkMode?: boolean
  viewMode: 'grid' | 'list'
}

function TaskCard({
  task,
  onToggle,
  onDelete,
  onSelect,
  isSelected,
  bulkMode,
  viewMode
}: TaskCardProps) {
  const priorityColor = task.urgent 
    ? 'border-l-red-500' 
    : task.important 
      ? 'border-l-amber-500' 
      : 'border-l-blue-500'
  
  // Memoized handlers
  const handleToggle = useCallback(() => {
    onToggle(task.id)
  }, [onToggle, task.id])
  
  const handleDelete = useCallback(() => {
    onDelete(task.id)
  }, [onDelete, task.id])
  
  const handleSelect = useCallback(() => {
    onSelect?.(task.id)
  }, [onSelect, task.id])
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -2 }}
      className={'relative group transition-all duration-300 ' + (viewMode === 'grid' ? 'h-full' : '')}
      role="article"
      aria-label={'Task: ' + (task.title)}
    >
      <Card 
        className={'relative overflow-hidden bg-white dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600 transition-all duration-300 ' + (task.status === 'COMPLETED' ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-700' : '') + ' ' + (priorityColor) + ' border-l-4 ' + (viewMode === 'grid' ? 'h-full' : '')}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {bulkMode ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSelect}
                className={'h-6 w-6 rounded-full transition-all duration-200 ' + (isSelected
                    ? 'text-blue-600 hover:text-blue-700 bg-blue-50 dark:bg-blue-950/30'
                    : 'text-gray-400 hover:text-blue-600')}
                aria-label={isSelected ? "Deselect task" : "Select task"}
              >
                {isSelected ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <Circle className="h-5 w-5" />
                )}
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggle}
                className={'h-6 w-6 rounded-full transition-all duration-200 ' + (task.status === 'COMPLETED'
                    ? 'text-emerald-600 hover:text-emerald-700'
                    : 'text-gray-400 hover:text-emerald-600')}
                aria-label={task.status === 'COMPLETED' ? "Mark task as incomplete" : "Mark task as complete"}
              >
                {task.status === 'COMPLETED' ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <Circle className="h-5 w-5" />
                )}
              </Button>
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <h3 className={'font-semibold text-base ' + (task.status === 'COMPLETED'
                    ? 'line-through text-gray-500 dark:text-gray-400'
                    : 'text-gray-900 dark:text-gray-100')}>
                  {task.title}
                </h3>
                {task.category && (
                  <div className="flex items-center gap-1 ml-2">
                    <div 
                      className="h-2 w-2 rounded-full" 
                      style={{ backgroundColor: task.category.color || '#6B7280' }}
                      aria-label={'Category: ' + (task.category.name)}
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      {task.category.name}
                    </span>
                  </div>
                )}
              </div>

              {task.description && (
                <p className={'text-sm mb-3 leading-relaxed ' + (task.status === 'COMPLETED'
                    ? 'text-gray-400'
                    : 'text-gray-600 dark:text-gray-400')}>
                  {task.description}
                </p>
              )}

              {/* AI Reason Display */}
              {task.aiSuggested && task.aiReason && (
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-2 mb-3">
                  <div className="flex items-center gap-1 mb-1">
                    <Sparkles className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                    <span className="text-purple-700 dark:text-purple-300 font-medium text-xs">AI Insight</span>
                  </div>
                  <p className="text-purple-600 dark:text-purple-400 text-xs">{task.aiReason}</p>
                </div>
              )}

              {/* Task Metadata */}
              <div className="flex items-center gap-3 mb-3 text-xs text-gray-500 dark:text-gray-400">
                {task.estimatedTime && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{task.estimatedTime}min</span>
                  </div>
                )}
                {task.energyLevel && (
                  <div className="flex items-center gap-1">
                    <Zap className={'h-3 w-3 ' + (task.energyLevel === 'high' ? 'text-green-500' :
                      task.energyLevel === 'medium' ? 'text-yellow-500' : 'text-gray-500')} />
                    <span className="capitalize">{task.energyLevel}</span>
                  </div>
                )}
                {task.completedAt && (
                  <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Completed</span>
                  </div>
                )}
              </div>
              
              {/* Priority and AI Tags */}
              <div className="flex items-center gap-2 flex-wrap">
                {task.urgent && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-medium">
                    <AlertCircle className="h-3 w-3" />
                    Urgent
                  </span>
                )}
                {task.important && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium">
                    <Star className="h-3 w-3" />
                    Important
                  </span>
                )}
                {task.aiSuggested && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-700 dark:text-purple-400 text-xs font-medium border border-purple-200 dark:border-purple-800">
                    <Brain className="h-3 w-3" />
                    AI Suggested
                  </span>
                )}
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              className="h-6 w-6 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              aria-label={'Delete task: ' + (task.title)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Memoize the component to prevent unnecessary re-renders
export default memo(TaskCard, (prevProps, nextProps) => {
  // Custom comparison function to determine if the component should re-render
  return (
    prevProps.task.id === nextProps.task.id &&
    prevProps.task.status === nextProps.task.status &&
    prevProps.task.title === nextProps.task.title &&
    prevProps.task.description === nextProps.task.description &&
    prevProps.task.urgent === nextProps.task.urgent &&
    prevProps.task.important === nextProps.task.important &&
    prevProps.task.estimatedTime === nextProps.task.estimatedTime &&
    prevProps.task.energyLevel === nextProps.task.energyLevel &&
    prevProps.task.aiSuggested === nextProps.task.aiSuggested &&
    prevProps.task.aiReason === nextProps.task.aiReason &&
    prevProps.task.category?.name === nextProps.task.category?.name &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.bulkMode === nextProps.bulkMode &&
    prevProps.viewMode === nextProps.viewMode
  )
})