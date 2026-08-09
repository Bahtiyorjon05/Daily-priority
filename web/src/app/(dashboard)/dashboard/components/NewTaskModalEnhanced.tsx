'use client'

import { useT } from '@/lib/i18n/client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Target,
  BookOpen,
  Clock,
  Zap,
  Tag,
  CheckCircle2,
  Star,
  X,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface NewTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateTask: (task: any) => void
}

export default function NewTaskModalEnhanced({ 
  isOpen, 
  onClose, 
  onCreateTask 
}: NewTaskModalProps) {
  const { t } = useT()
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    urgent: false,
    important: false,
    category: '',
    dueDate: '',
    estimatedTime: 30,
    energyLevel: 'medium',
    priority: 'medium',
    aiOptimized: false,
    aiReasoning: ''
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const taskTemplates = [
    { name: t('ui.quickCall'), icon: '📞', template: { title: t('ui.quickPhoneCall'), estimatedTime: 15, energyLevel: 'low' } },
    { name: t('ui.deepWork'), icon: '🧠', template: { title: t('ui.deepWorkSession'), estimatedTime: 120, energyLevel: 'high', important: true } },
    { name: t('ui.emailCheck'), icon: '📧', template: { title: t('ui.checkAndRespondToEmails'), estimatedTime: 30, energyLevel: 'medium' } },
    { name: t('ui.exercise'), icon: '💪', template: { title: t('ui.workoutSession'), estimatedTime: 45, energyLevel: 'high', category: 'Health' } }
  ]
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!newTask.title.trim()) {
      newErrors.title = t('ui.taskTitleIsRequired')
    }
    
    if (newTask.estimatedTime < 5 || newTask.estimatedTime > 480) {
      newErrors.estimatedTime = t('ui.estimatedTimeMustBeBetween5And480Minutes')
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleCreateTask = () => {
    if (validateForm()) {
      onCreateTask(newTask)
      // Reset form
      setNewTask({
        title: '',
        description: '',
        urgent: false,
        important: false,
        category: '',
        dueDate: '',
        estimatedTime: 30,
        energyLevel: 'medium',
        priority: 'medium',
        aiOptimized: false,
        aiReasoning: ''
      })
      setErrors({})
    }
  }
  
  const handleTemplateSelect = (template: any) => {
    setNewTask(prev => ({ ...prev, ...template.template }))
  }
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 modal-overlay"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-700 modal-panel overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('ui.createNewTask')}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('ui.addANewTaskToYourPriorityList')}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Task Templates */}
            <div className="mb-6">
              <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 block flex items-center gap-2">
                <Zap className="h-4 w-4" />
                {t('ui.quickTemplates')}
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {taskTemplates.map((template, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    onClick={() => handleTemplateSelect(template)}
                    className="h-14 flex flex-col items-center justify-center gap-1 text-xs hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <span className="text-lg">{template.icon}</span>
                    <span>{template.name}</span>
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="space-y-5">
              {/* Task Title */}
              <div>
                <Label htmlFor="title" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  {t('ui.taskTitle')}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={newTask.title || ''}
                  onChange={(e) => {
                    setNewTask(prev => ({ ...prev, title: e.target.value }))
                    if (errors.title) {
                      setErrors(prev => {
                        const newErrors = { ...prev }
                        delete newErrors.title
                        return newErrors
                      })
                    }
                  }}
                  placeholder={t('ui.whatNeedsToBeDone')}
                  className={'mt-2 h-11 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 dark:focus:ring-emerald-400/20 ' + (errors.title ? 'border-red-500' : '')}
                />
                {errors.title && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    {errors.title}
                  </p>
                )}
              </div>
              
              {/* Description */}
              <div>
                <Label htmlFor="description" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  {t('ui.descriptionOptional')}
                </Label>
                <Textarea
                  id="description"
                  value={newTask.description || ''}
                  onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={t('ui.addDetailsAboutYourTask')}
                  className="mt-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 dark:focus:ring-emerald-400/20 resize-none"
                  rows={3}
                />
              </div>

              {/* Time and Energy */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="estimatedTime" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {t('ui.estimatedTimeMinutes')}
                  </Label>
                  <Input
                    id="estimatedTime"
                    type="number"
                    min="5"
                    max="480"
                    value={newTask.estimatedTime}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 30
                      setNewTask(prev => ({ ...prev, estimatedTime: value }))
                      if (errors.estimatedTime) {
                        setErrors(prev => {
                          const newErrors = { ...prev }
                          delete newErrors.estimatedTime
                          return newErrors
                        })
                      }
                    }}
                    className={'mt-2 h-11 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-emerald-500 dark:focus:border-emerald-400 ' + (errors.estimatedTime ? 'border-red-500' : '')}
                  />
                  {errors.estimatedTime && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      {errors.estimatedTime}
                    </p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="energyLevel" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    {t('ui.energyLevel')}
                  </Label>
                  <select
                    id="energyLevel"
                    value={newTask.energyLevel}
                    onChange={(e) => setNewTask(prev => ({ ...prev, energyLevel: e.target.value }))}
                    className="mt-2 h-11 w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-md px-3 text-gray-900 dark:text-gray-100 focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="low">{t('ui.lowEnergy')}</option>
                    <option value="medium">{t('ui.mediumEnergy')}</option>
                    <option value="high">{t('ui.highEnergy')}</option>
                  </select>
                </div>
              </div>

              {/* Category */}
              <div>
                <Label htmlFor="category" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  {t('ui.categoryOptional')}
                </Label>
                <Input
                  id="category"
                  value={newTask.category}
                  onChange={(e) => setNewTask(prev => ({ ...prev, category: e.target.value }))}
                  placeholder={t('ui.eGWorkPersonalHealthLearning')}
                  className="mt-2 h-11 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 dark:focus:ring-emerald-400/20"
                />
              </div>
              
              {/* Priority Options */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('ui.priorityOptions')}</Label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={newTask.urgent}
                        onChange={(e) => setNewTask(prev => ({ ...prev, urgent: e.target.checked }))}
                        className="sr-only"
                      />
                      <div className={'w-5 h-5 rounded border-2 transition-all ' + (newTask.urgent 
                          ? 'bg-red-500 border-red-500' 
                          : 'border-gray-300 dark:border-gray-600 group-hover:border-red-400')}>
                        {newTask.urgent && <CheckCircle2 className="w-3 h-3 text-white absolute top-0.5 left-0.5" />}
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-red-600 dark:group-hover:text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {t('ui.urgent')}
                    </span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={newTask.important}
                        onChange={(e) => setNewTask(prev => ({ ...prev, important: e.target.checked }))}
                        className="sr-only"
                      />
                      <div className={'w-5 h-5 rounded border-2 transition-all ' + (newTask.important 
                          ? 'bg-amber-500 border-amber-500' 
                          : 'border-gray-300 dark:border-gray-600 group-hover:border-amber-400')}>
                        {newTask.important && <Star className="w-3 h-3 text-white absolute top-0.5 left-0.5" />}
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-amber-600 dark:group-hover:text-amber-400 flex items-center gap-1">
                      <Star className="h-4 w-4" />
                      {t('ui.important')}
                    </span>
                  </label>
                </div>
              </div>
              
              {/* AI Optimization Info */}
              {newTask.aiOptimized && (
                <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border border-purple-200 dark:border-purple-800">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-purple-700 dark:text-purple-300 font-medium text-sm">{t('ui.aiOptimizedPriority')}</p>
                        <p className="text-purple-600 dark:text-purple-400 text-xs mt-1">{newTask.aiReasoning}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
            
            <div className="flex items-center gap-3 mt-6">
              <Button 
                onClick={handleCreateTask} 
                disabled={!newTask.title.trim()}
                className="flex-1 h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('ui.createTask')}
              </Button>
              <Button 
                variant="outline" 
                onClick={onClose}
                className="h-11 px-4 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                {t('common.cancel')}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}