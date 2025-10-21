'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Target,
  Trophy,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Circle,
  Plus,
  Sparkles,
  Lightbulb,
  Zap,
  Star,
  Award,
  Flame,
  Minus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { generateTaskSuggestions } from '@/lib/ai'

interface Goal {
  id: string
  title: string
  description: string
  target: number
  current: number
  deadline: string
  category: string
  progress: number
  status: 'active' | 'completed' | 'archived'
  createdAt: string
  aiSuggested?: boolean
  aiReason?: string
}

interface AISuggestion {
  id: string
  title: string
  description: string
  reason: string
  category: string
  target?: number
  deadline?: string
}

export default function AIGoalTracker() {
  const [goals, setGoals] = useState<Goal[]>([
    {
      id: '1',
      title: 'Complete Daily Prayers',
      description: 'Perform all 5 daily prayers consistently',
      target: 30,
      current: 21,
      deadline: '2024-06-30',
      category: 'Spiritual',
      progress: 70,
      status: 'active',
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      title: 'Read 10 Pages Daily',
      description: 'Read Islamic knowledge books daily',
      target: 300,
      current: 150,
      deadline: '2024-07-15',
      category: 'Knowledge',
      progress: 50,
      status: 'active',
      createdAt: new Date().toISOString()
    },
    {
      id: '3',
      title: 'Charity Goal',
      description: 'Give charity at least 3 times per week',
      target: 12,
      current: 8,
      deadline: '2024-06-25',
      category: 'Charity',
      progress: 67,
      status: 'active',
      createdAt: new Date().toISOString()
    }
  ])
  
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [showNewGoal, setShowNewGoal] = useState(false)
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null)

  // Generate AI-powered goal suggestions
  const generateGoalSuggestions = async () => {
    setLoadingSuggestions(true)
    
    try {
      // Get user context for AI suggestions
      const userContext = {
        completedTasks: goals.filter(g => g.status === 'completed').map(g => g.title),
        currentTime: new Date().toLocaleTimeString(),
        userGoals: 'Improve spiritual growth and productivity',
        energyLevel: 'MEDIUM'
      }
      
      const suggestions = await generateTaskSuggestions(userContext)
      
      // Transform AI suggestions into goal format
      const formattedSuggestions = suggestions.tasks.slice(0, 2).map((suggestion: any, index: number) => ({
        id: 'ai-' + (Date.now()) + '-' + (index),
        title: suggestion.title,
        description: suggestion.description,
        reason: suggestion.reason,
        category: 'Personal Development',
        target: 10, // Default target
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
      }))
      
      setAiSuggestions(formattedSuggestions)
    } catch (error) {
      console.error('Error generating goal suggestions:', error)
      // Fallback suggestions
      setAiSuggestions([
        {
          id: 'fallback-1',
          title: 'Increase Quran Recitation',
          description: 'Recite one juz\' of Quran daily',
          reason: 'Regular Quran recitation increases spirituality and knowledge',
          category: 'Spiritual',
          target: 30
        },
        {
          id: 'fallback-2',
          title: 'Daily Reflection Journal',
          description: 'Write 3 things you\'re grateful for each day',
          reason: 'Gratitude practice improves mental well-being and mindfulness',
          category: 'Wellness',
          target: 21
        }
      ])
    } finally {
      setLoadingSuggestions(false)
    }
  }

  // Accept AI suggestion as new goal
  const acceptAISuggestion = (suggestion: AISuggestion) => {
    const newGoal: Goal = {
      id: 'goal-' + (Date.now()),
      title: suggestion.title,
      description: suggestion.description,
      target: suggestion.target || 10,
      current: 0,
      deadline: suggestion.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      category: suggestion.category,
      progress: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      aiSuggested: true,
      aiReason: suggestion.reason
    }
    
    setGoals(prev => [...prev, newGoal])
    setAiSuggestions(prev => prev.filter(s => s.id !== suggestion.id))
  }

  // Update goal progress
  const updateGoalProgress = (goalId: string, increment: number) => {
    setGoals(prev => prev.map(goal => {
      if (goal.id === goalId) {
        const newCurrent = Math.min(goal.target, Math.max(0, goal.current + increment))
        const newProgress = Math.round((newCurrent / goal.target) * 100)
        const newStatus = newProgress >= 100 ? 'completed' : goal.status
        
        return {
          ...goal,
          current: newCurrent,
          progress: newProgress,
          status: newStatus
        }
      }
      return goal
    }))
  }

  // Get category color
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Spiritual': 'from-emerald-500 to-teal-500',
      'Knowledge': 'from-blue-500 to-indigo-500',
      'Charity': 'from-amber-500 to-orange-500',
      'Wellness': 'from-purple-500 to-violet-500',
      'Personal Development': 'from-pink-500 to-rose-500',
      'default': 'from-gray-500 to-slate-500'
    }
    
    return colors[category] || colors['default']
  }

  // Get active goals
  const activeGoals = goals.filter(goal => goal.status === 'active')
  const completedGoals = goals.filter(goal => goal.status === 'completed')

  return (
    <div className="space-y-6">
      {/* Goals Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Target className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            Goal Tracker
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Track your progress and achieve your objectives
          </p>
        </div>
        <Button 
          onClick={() => setShowNewGoal(true)}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Goal
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200/50 dark:border-blue-800/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Active Goals</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{activeGoals.length}</p>
              </div>
              <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-200/50 dark:border-emerald-800/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">Completed</p>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{completedGoals.length}</p>
              </div>
              <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                <Trophy className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200/50 dark:border-amber-800/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-600 dark:text-amber-400 text-sm font-medium">Success Rate</p>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                  {goals.length > 0 ? Math.round((completedGoals.length / goals.length) * 100) : 0}%
                </p>
              </div>
              <div className="h-10 w-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI-Powered Goal Suggestions */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200/50 dark:border-purple-800/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            AI Goal Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-purple-700 dark:text-purple-300">
              Personalized goals based on your progress
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={generateGoalSuggestions}
              disabled={loadingSuggestions}
              className="border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30"
            >
              {loadingSuggestions ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent mr-2" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              Refresh Suggestions
            </Button>
          </div>
          
          {loadingSuggestions ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="p-3 rounded-xl bg-white/50 dark:bg-white/10 animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-3/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : aiSuggestions.length > 0 ? (
            <div className="space-y-3">
              {aiSuggestions.map((suggestion) => (
                <motion.div
                  key={suggestion.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-xl bg-white/50 dark:bg-white/10 border border-purple-200/50 dark:border-purple-800/50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                        {suggestion.title}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {suggestion.description}
                      </p>
                      <div className="flex items-center gap-1 mt-2">
                        <Lightbulb className="h-3 w-3 text-amber-500" />
                        <span className="text-xs text-amber-600 dark:text-amber-400">
                          {suggestion.reason}
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => acceptAISuggestion(suggestion)}
                      className="h-8 text-xs border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <Sparkles className="h-8 w-8 text-purple-400 mx-auto mb-2" />
              <p className="text-sm text-purple-600 dark:text-purple-400">
                No AI suggestions available. Complete more goals to unlock personalized recommendations.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              Active Goals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeGoals.map((goal) => (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl border border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {goal.title}
                      </h3>
                      {goal.aiSuggested && (
                        <div className="flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-purple-500" />
                          <span className="text-xs text-purple-600 dark:text-purple-400">AI</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {goal.description}
                    </p>
                    
                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          Progress: {goal.current}/{goal.target}
                        </span>
                        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          {goal.progress}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <motion.div
                          className={'h-2 rounded-full bg-gradient-to-r ' + (getCategoryColor(goal.category))}
                          initial={{ width: 0 }}
                          animate={{ width: (goal.progress) + '%' }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </div>
                    
                    {/* Goal Details */}
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Due: {new Date(goal.deadline).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className={'h-2 w-2 rounded-full bg-gradient-to-r ' + (getCategoryColor(goal.category))}></div>
                        <span>{goal.category}</span>
                      </div>
                    </div>
                    
                    {goal.aiSuggested && goal.aiReason && (
                      <div className="mt-3 p-2 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-800/50">
                        <div className="flex items-center gap-1 mb-1">
                          <Lightbulb className="h-3 w-3 text-purple-500" />
                          <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                            AI Recommendation
                          </span>
                        </div>
                        <p className="text-xs text-purple-600 dark:text-purple-400">
                          {goal.aiReason}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setExpandedGoal(expandedGoal === goal.id ? null : goal.id)}
                    className="h-8 w-8"
                  >
                    <Circle className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Expanded Actions */}
                {expandedGoal === goal.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateGoalProgress(goal.id, -1)}
                          disabled={goal.current <= 0}
                          className="h-8 w-8 p-0"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm font-medium w-8 text-center">
                          {goal.current}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateGoalProgress(goal.id, 1)}
                          disabled={goal.current >= goal.target}
                          className="h-8 w-8 p-0"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateGoalProgress(goal.id, 1)}
                          disabled={goal.current >= goal.target}
                          className="h-8 text-xs"
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Mark Progress
                        </Button>
                        {goal.progress >= 100 && (
                          <Button
                            size="sm"
                            className="h-8 text-xs bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                          >
                            <Trophy className="h-3 w-3 mr-1" />
                            Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              Completed Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completedGoals.map((goal) => (
                <div
                  key={goal.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/50"
                >
                  <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <Trophy className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-amber-900 dark:text-amber-100 text-sm">
                      {goal.title}
                    </h4>
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      Completed on {new Date(goal.deadline).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-amber-500" />
                    <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                      {goal.target} pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {goals.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No goals yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Start by setting your first goal to track your progress
            </p>
            <Button 
              onClick={() => setShowNewGoal(true)}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Goal
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}