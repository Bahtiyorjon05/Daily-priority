/**
 * TaskModal Component
 * Create and edit tasks
 */

'use client'

import { memo, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Loader2 } from 'lucide-react'
import Modal from './Modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { TaskModalProps } from '@/types/components'
import type { Task } from '@/types/models'
import { Priority, EnergyLevel, TaskStatus } from '@/types/models'
import { PRIORITY_BG_COLORS, PRIORITY_TEXT_COLORS } from '@/constants/colors'
import { TASK_ESTIMATED_TIMES } from '@/constants/defaults'
import { cn } from '@/lib/utils'

interface TaskFormData {
  title: string
  description: string
  priority: Priority
  urgent: boolean
  important: boolean
  estimatedTime: number | null
  energyLevel: EnergyLevel | null
  dueDate: string
  categoryId: string
  goalId: string
}

const TaskModal = memo<TaskModalProps>(({
  isOpen,
  onClose,
  onSubmit,
  task,
  mode = 'create',
  categories = [],
  goals = [],
  isLoading = false,
}) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TaskFormData>({
    defaultValues: {
      title: '',
      description: '',
      priority: Priority.MEDIUM,
      urgent: false,
      important: false,
      estimatedTime: null,
      energyLevel: null,
      dueDate: '',
      categoryId: '',
      goalId: '',
    },
  })

  // Load task data when editing
  useEffect(() => {
    if (task && mode === 'edit') {
      reset({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        urgent: task.urgent,
        important: task.important,
        estimatedTime: task.estimatedTime,
        energyLevel: task.energyLevel,
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        categoryId: task.categoryId || '',
        goalId: task.goalId || '',
      })
    } else {
      reset()
    }
  }, [task, mode, reset])

  const watchUrgent = watch('urgent')
  const watchImportant = watch('important')
  const watchPriority = watch('priority')

  const handleFormSubmit = (data: TaskFormData) => {
    onSubmit({
      ...data,
      estimatedTime: data.estimatedTime || undefined,
      energyLevel: data.energyLevel || undefined,
      dueDate: data.dueDate || undefined,
      categoryId: data.categoryId || undefined,
      goalId: data.goalId || undefined,
    } as Partial<Task>)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Create New Task' : 'Edit Task'}
      description={mode === 'create' ? 'Add a new task to your list' : 'Update task details'}
      size="lg"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">
            Title <span className="text-red-500">*</span>
          </Label>
          <Input
            id="title"
            placeholder="Enter task title..."
            {...register('title', { required: 'Title is required' })}
            className={errors.title ? 'border-red-500' : ''}
          />
          {errors.title && (
            <p className="text-sm text-red-500">{errors.title.message}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Add details about this task..."
            rows={4}
            {...register('description')}
          />
        </div>

        {/* Priority & Flags */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={watchPriority}
              onValueChange={(value) => setValue('priority', value as Priority)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(Priority).map((priority) => (
                  <SelectItem key={priority} value={priority}>
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'h-2 w-2 rounded-full',
                          PRIORITY_BG_COLORS[priority]
                        )}
                      />
                      {priority}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Flags</Label>
            <div className="flex gap-2">
              <Badge
                variant={watchUrgent ? 'destructive' : 'outline'}
                className="cursor-pointer"
                onClick={() => setValue('urgent', !watchUrgent)}
              >
                Urgent
              </Badge>
              <Badge
                variant={watchImportant ? 'secondary' : 'outline'}
                className="cursor-pointer"
                onClick={() => setValue('important', !watchImportant)}
              >
                Important
              </Badge>
            </div>
          </div>
        </div>

        {/* Estimated Time & Energy Level */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="estimatedTime">Estimated Time</Label>
            <Select
              value={watch('estimatedTime')?.toString() || '0'}
              onValueChange={(value) =>
                setValue('estimatedTime', value === '0' ? null : parseInt(value))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">None</SelectItem>
                {TASK_ESTIMATED_TIMES.map((time) => (
                  <SelectItem key={time.value} value={time.value.toString()}>
                    {time.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="energyLevel">Energy Level</Label>
            <Select
              value={watch('energyLevel') || 'NONE'}
              onValueChange={(value) =>
                setValue('energyLevel', value === 'NONE' ? null : (value as EnergyLevel))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select energy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">None</SelectItem>
                {Object.values(EnergyLevel).map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Due Date */}
        <div className="space-y-2">
          <Label htmlFor="dueDate">Due Date</Label>
          <Input id="dueDate" type="date" {...register('dueDate')} />
        </div>

        {/* Category & Goal */}
        {(categories.length > 0 || goals.length > 0) && (
          <div className="grid grid-cols-2 gap-4">
            {categories.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="categoryId">Category</Label>
                <Select
                  value={watch('categoryId') || 'none'}
                  onValueChange={(value) => setValue('categoryId', value === 'none' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {goals.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="goalId">Link to Goal</Label>
                <Select
                  value={watch('goalId') || 'none'}
                  onValueChange={(value) => setValue('goalId', value === 'none' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select goal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {goals.map((goal) => (
                      <SelectItem key={goal.id} value={goal.id}>
                        {goal.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'create' ? 'Create Task' : 'Update Task'}
          </Button>
        </div>
      </form>
    </Modal>
  )
})

TaskModal.displayName = 'TaskModal'

export default TaskModal
