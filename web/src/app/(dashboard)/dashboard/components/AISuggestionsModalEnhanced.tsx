'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { 
  Brain, 
  Sparkles, 
  Lightbulb, 
  Plus, 
  X, 
  Target, 
  Clock, 
  Zap, 
  AlertCircle, 
  Star 
} from 'lucide-react'
import { Button } from '@/components/ui/button'

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

interface AISuggestionsModalProps {
  isOpen: boolean
  onClose: () => void
  suggestions: Task[]
  onAcceptSuggestion: (suggestion: Task) => void
  onAcceptAll: (suggestions: Task[]) => void
  onDismissSuggestion: (id: string) => void
}

export default function AISuggestionsModalEnhanced({
  isOpen,
  onClose,
  suggestions,
  onAcceptSuggestion,
  onAcceptAll,
  onDismissSuggestion
}: AISuggestionsModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] shadow-2xl border border-gray-200 dark:border-gray-700 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Brain className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">AI Task Suggestions</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Smart recommendations based on your productivity patterns</p>
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
            
            <div className="space-y-4">
              {suggestions.length === 0 ? (
                <div className="text-center py-8">
                  <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No AI suggestions available yet</h4>
                  <p className="text-gray-600 dark:text-gray-400">Complete more tasks to help AI understand your patterns!</p>
                  <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">Our AI learns from your habits to provide personalized recommendations</p>
                </div>
              ) : (
                suggestions.map((suggestion, index) => (
                  <motion.div
                    key={suggestion.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200 group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100">{suggestion.title}</h4>
                          {suggestion.urgent && (
                            <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded-full font-medium flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Urgent
                            </span>
                          )}
                          {suggestion.important && (
                            <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs rounded-full font-medium flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              Important
                            </span>
                          )}
                        </div>
                        {suggestion.description && (
                          <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{suggestion.description}</p>
                        )}
                        {suggestion.aiReason && (
                          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3 mb-3">
                            <div className="flex items-center gap-2 mb-1">
                              <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                              <span className="text-purple-700 dark:text-purple-300 font-medium text-sm">AI Insight</span>
                            </div>
                            <p className="text-purple-600 dark:text-purple-400 text-sm">{suggestion.aiReason}</p>
                          </div>
                        )}
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                          {suggestion.estimatedTime && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {suggestion.estimatedTime}min
                            </span>
                          )}
                          {suggestion.energyLevel && (
                            <span className="flex items-center gap-1">
                              <Zap className="h-3 w-3" />
                              {suggestion.energyLevel} energy
                            </span>
                          )}
                          {suggestion.category && (
                            <span className="flex items-center gap-1">
                              <div 
                                className="h-2 w-2 rounded-full" 
                                style={{ backgroundColor: suggestion.category.color }}
                              />
                              {suggestion.category.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onDismissSuggestion(suggestion.id)}
                          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 h-8 w-8 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => onAcceptSuggestion(suggestion)}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white h-8"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {suggestions.length > 0 && (
              <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Close
                </Button>
                <Button
                  onClick={() => onAcceptAll(suggestions)}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  disabled={suggestions.length === 0}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add All ({suggestions.length})
                </Button>
              </div>
            )}
            
            {/* AI Learning Info */}
            {suggestions.length > 0 && (
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
                    <Brain className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-blue-700 dark:text-blue-300 font-medium text-sm">How AI Suggestions Work</p>
                    <p className="text-blue-600 dark:text-blue-400 text-xs mt-1">
                      Our AI analyzes your task completion patterns, productivity trends, and time management to suggest tasks 
                      that align with your goals and energy levels throughout the day.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}