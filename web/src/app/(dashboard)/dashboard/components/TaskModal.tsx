'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Flag, AlertCircle, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface TaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (taskData: {
    title: string
    description?: string
    priority: 'LOW' | 'MEDIUM' | 'HIGH'
    urgent: boolean
    important: boolean
  }) => void
}

export default function TaskModal({ isOpen, onClose, onSave }: TaskModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
    urgent: false,
    important: false
  })

  const handleSave = () => {
    if (!formData.title.trim()) return
    
    onSave(formData)
    setFormData({
      title: '',
      description: '',
      priority: 'MEDIUM',
      urgent: false,
      important: false
    })
  }

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'MEDIUM',
      urgent: false,
      important: false
    })
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg"
          >
            <Card className="border-0 shadow-2xl bg-white dark:bg-slate-900">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    Create New Task
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClose}
                    className="h-8 w-8 rounded-lg"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Title */}
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                    Task Title *
                  </label>
                  <Input
                    autoFocus
                    placeholder="What needs to be done?"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="border-slate-300 dark:border-slate-600 focus:border-emerald-500 dark:focus:border-emerald-400"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                    Description
                  </label>
                  <Textarea
                    placeholder="Add more details..."
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="border-slate-300 dark:border-slate-600 focus:border-emerald-500 dark:focus:border-emerald-400 resize-none"
                  />
                </div>

                {/* Priority */}
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 block">
                    Priority Level
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['LOW', 'MEDIUM', 'HIGH'] as const).map((priority) => (
                      <Button
                        key={priority}
                        variant={formData.priority === priority ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, priority }))}
                        className={`
                          ${formData.priority === priority 
                            ? priority === 'HIGH' ? 'bg-red-600 hover:bg-red-700' :
                              priority === 'MEDIUM' ? 'bg-amber-600 hover:bg-amber-700' :
                              'bg-green-600 hover:bg-green-700'
                            : 'border-slate-300 dark:border-slate-600'
                          }
                        `}
                      >
                        {priority}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Flags */}
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant={formData.urgent ? 'default' : 'outline'}
                    onClick={() => setFormData(prev => ({ ...prev, urgent: !prev.urgent }))}
                    className={`
                      justify-start h-12
                      ${formData.urgent 
                        ? 'bg-red-600 hover:bg-red-700 text-white' 
                        : 'border-slate-300 dark:border-slate-600'
                      }
                    `}
                  >
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Urgent
                  </Button>

                  <Button
                    variant={formData.important ? 'default' : 'outline'}
                    onClick={() => setFormData(prev => ({ ...prev, important: !prev.important }))}
                    className={`
                      justify-start h-12
                      ${formData.important 
                        ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                        : 'border-slate-300 dark:border-slate-600'
                      }
                    `}
                  >
                    <Flag className="h-4 w-4 mr-2" />
                    Important
                  </Button>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={!formData.title.trim()}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                  >
                    <Target className="h-4 w-4 mr-2" />
                    Create Task
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
