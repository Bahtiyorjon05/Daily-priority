'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, Circle, Trash2, AlertCircle, Flag, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface Task {
  id: string
  title: string
  description?: string
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  urgent: boolean
  important: boolean
  createdAt: string
  completedAt?: string
}

interface TaskItemProps {
  task: Task
  onToggle: () => void
  onDelete: () => void
}

export default function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  const isCompleted = task.status === 'COMPLETED'
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
      case 'MEDIUM': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300'
      case 'LOW': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
      default: return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
    }
  }

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`
        group border transition-all duration-300 shadow-sm hover:shadow-lg
        ${isCompleted 
          ? 'bg-emerald-50/60 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-800/50' 
          : 'bg-white/95 dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700'
        }
      `}>
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            {/* Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className={`
                h-7 w-7 rounded-full flex-shrink-0 transition-all
                ${isCompleted
                  ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
                  : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
                }
              `}
            >
              {isCompleted ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <Circle className="h-5 w-5" />
              )}
            </Button>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className={`
                text-lg font-semibold mb-1 tracking-tight
                ${isCompleted 
                  ? 'line-through text-slate-500 dark:text-slate-400' 
                  : 'text-slate-900 dark:text-slate-100'
                }
              `}>
                {task.title}
              </h3>
              
              {task.description && (
                <p className={`
                  text-sm mb-3 line-clamp-2 leading-relaxed
                  ${isCompleted 
                    ? 'text-slate-400 dark:text-slate-500' 
                    : 'text-slate-600 dark:text-slate-400'
                  }
                `}>
                  {task.description}
                </p>
              )}

              {/* Tags */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`
                  inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                  ${getPriorityColor(task.priority)}
                `}>
                  {task.priority}
                </span>
                
                {task.urgent && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 text-xs font-medium">
                    <AlertCircle className="h-3 w-3" />
                    Urgent
                  </span>
                )}
                
                {task.important && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 text-xs font-medium">
                    <Flag className="h-3 w-3" />
                    Important
                  </span>
                )}

                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium">
                  <Clock className="h-3 w-3" />
                  {new Date(task.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Delete Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="
                h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 
                opacity-0 group-hover:opacity-100 transition-all flex-shrink-0
              "
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
