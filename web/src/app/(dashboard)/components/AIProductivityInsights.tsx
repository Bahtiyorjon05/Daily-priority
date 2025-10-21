'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Clock, 
  Zap, 
  Brain, 
  Sparkles, 
  Lightbulb, 
  Award, 
  Flame, 
  Calendar,
  CheckCircle2,
  Circle,
  TrendingDown,
  TrendingUp as TrendingUpIcon,
  RefreshCw,
  Filter,
  Search,
  X,
  Star,
  Users,
  BookOpen
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { analyzeProductivity } from '@/lib/ai'
import { toast } from 'sonner'

interface ProductivityMetric {
  id: string
  title: string
  value: number | string
  change: number
  trend: 'up' | 'down' | 'neutral'
  icon: any
  color: string
  description: string
}

interface ProductivityInsight {
  id: string
  type: 'success' | 'improvement' | 'celebration' | 'suggestion' | 'warning'
  title: string
  message: string
  action: string
  priority: 'high' | 'medium' | 'low'
  metric?: string
}

interface ProductivityAnalysis {
  score: number
  analysis: string
  recommendations: string[]
  trends: {
    completionRate: { current: number; previous: number; change: number }
    focusTime: { current: number; previous: number; change: number }
    taskEfficiency: { current: number; previous: number; change: number }
  }
}

export default function AIProductivityInsights({ session }: { session: any }) {
  const [metrics, setMetrics] = useState<ProductivityMetric[]>([])
  const [insights, setInsights] = useState<ProductivityInsight[]>([])
  const [analysis, setAnalysis] = useState<ProductivityAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('week')
  const [statsSnapshot, setStatsSnapshot] = useState({
    tasksCompleted: 0,
    totalTasks: 0,
    productivityScore: 0,
    streak: 0,
    weeklyGoals: 0,
    completedGoals: 0,
    focusMinutes: 0,
    completionRate: 0
  })

  // Mock data for demonstration
  useEffect(() => {
    const loadInsights = async () => {
      try {
        setLoading(true)

        const [statsRes, tasksRes] = await Promise.all([
          fetch('/api/user/stats'),
          fetch('/api/tasks?limit=50')
        ])

        const statsJson = statsRes.ok ? await statsRes.json() : null
        const tasksJson = tasksRes.ok ? await tasksRes.json() : { tasks: [] }

        const tasks = Array.isArray(tasksJson?.tasks) ? tasksJson.tasks : []
        const tasksCompleted = statsJson?.tasksCompleted ?? 0
        const totalTasks = statsJson?.totalTasks ?? 0
        const productivityScore = statsJson?.productivityScore ?? 0
        const streak = statsJson?.streak ?? 0
        const weeklyGoals = statsJson?.weeklyGoals ?? 0
        const completedGoals = statsJson?.completedGoals ?? 0
        const focusMinutes = tasks.reduce((total: number, task: any) => total + (task?.estimatedTime ?? 0), 0)
        const completionRate = totalTasks > 0 ? (tasksCompleted / totalTasks) * 100 : 0
        const goalAchievement = weeklyGoals > 0 ? (completedGoals / weeklyGoals) * 100 : 0
        const efficiency = totalTasks > 0 ? Math.min(100, Math.round(completionRate + Math.min(20, focusMinutes / 30))) : 0
        const focusHours = focusMinutes / 60

        setStatsSnapshot({
          tasksCompleted,
          totalTasks,
          productivityScore,
          streak,
          weeklyGoals,
          completedGoals,
          focusMinutes,
          completionRate
        })

        const metricsData: ProductivityMetric[] = [
          {
            id: 'completion',
            title: 'Task Completion Rate',
            value: `${Math.round(completionRate)}%`,
            change: 0,
            trend: completionRate >= 70 ? 'up' : completionRate <= 30 ? 'down' : 'neutral',
            icon: CheckCircle2,
            color: 'from-emerald-500 to-teal-500',
            description: 'Percentage of tasks completed'
          },
          {
            id: 'focus',
            title: 'Daily Focus Time',
            value: focusHours > 0 ? `${focusHours.toFixed(1)}h` : '0h',
            change: 0,
            trend: focusHours > 0 ? 'up' : 'neutral',
            icon: Clock,
            color: 'from-blue-500 to-indigo-500',
            description: 'Average focused work time per day'
          },
          {
            id: 'productivity',
            title: 'Productivity Score',
            value: productivityScore,
            change: 0,
            trend: productivityScore >= 70 ? 'up' : productivityScore <= 30 ? 'down' : 'neutral',
            icon: TrendingUp,
            color: 'from-purple-500 to-pink-500',
            description: 'Overall productivity rating (0-100)'
          },
          {
            id: 'goals',
            title: 'Goal Achievement',
            value: `${Math.round(goalAchievement)}%`,
            change: 0,
            trend: goalAchievement >= 70 ? 'up' : goalAchievement <= 30 ? 'down' : 'neutral',
            icon: Target,
            color: 'from-amber-500 to-orange-500',
            description: 'Percentage of weekly goals achieved'
          },
          {
            id: 'streak',
            title: 'Consistency Streak',
            value: streak,
            change: 0,
            trend: streak > 0 ? 'up' : 'neutral',
            icon: Flame,
            color: 'from-red-500 to-rose-500',
            description: 'Consecutive days of task completion'
          },
          {
            id: 'efficiency',
            title: 'Task Efficiency',
            value: `${efficiency}%`,
            change: 0,
            trend: efficiency >= 70 ? 'up' : efficiency <= 30 ? 'down' : 'neutral',
            icon: Zap,
            color: 'from-cyan-500 to-blue-500',
            description: 'Time spent vs. estimated time'
          }
        ]

        const generatedInsights: ProductivityInsight[] = []

        if (totalTasks === 0) {
          generatedInsights.push({
            id: 'insight-start',
            type: 'suggestion',
            title: 'Welcome to your productivity hub',
            message: 'Create your first task to unlock personalized productivity insights and recommendations.',
            action: 'Add a task',
            priority: 'high'
          })
        } else {
          generatedInsights.push({
            id: 'insight-completion',
            type: completionRate >= 70 ? 'success' : 'improvement',
            title: completionRate >= 70 ? 'Strong Task Completion' : 'Completion Rate Opportunity',
            message: `You have completed ${tasksCompleted} of ${totalTasks} tasks (${Math.round(completionRate)}% completion).`,
            action: completionRate >= 70 ? 'Keep the momentum' : 'Review your pending tasks',
            priority: 'high',
            metric: 'completion'
          })

          if (weeklyGoals > 0) {
            if (goalAchievement >= 70) {
              generatedInsights.push({
                id: 'insight-goals',
                type: 'success',
                title: 'Great Goal Progress',
                message: `You have completed ${completedGoals} of ${weeklyGoals} weekly goals.`,
                action: 'Plan next week\'s goals',
                priority: 'medium',
                metric: 'goals'
              })
            } else {
              generatedInsights.push({
                id: 'insight-goals',
                type: 'improvement',
                title: 'Boost Weekly Goal Progress',
                message: `You have completed ${completedGoals} of ${weeklyGoals} weekly goals. Adjust your plan to stay on target.`,
                action: 'Schedule goal time',
                priority: 'medium',
                metric: 'goals'
              })
            }
          }

          if (focusMinutes === 0) {
            generatedInsights.push({
              id: 'insight-focus',
              type: 'suggestion',
              title: 'Start a Focus Session',
              message: 'Schedule a short focus session to build a deep-work habit and protect your time.',
              action: 'Start focus timer',
              priority: 'medium'
            })
          } else {
            generatedInsights.push({
              id: 'insight-focus',
              type: 'celebration',
              title: 'Nice Focus Time!',
              message: `You logged approximately ${focusHours.toFixed(1)} hours of focused work.`,
              action: 'Plan your next session',
              priority: 'medium'
            })
          }
        }

        if (generatedInsights.length === 0) {
          generatedInsights.push({
            id: 'insight-default',
            type: 'suggestion',
            title: 'Ready when you are',
            message: 'Add tasks and goals to start receiving tailored insights.',
            action: 'Create a task',
            priority: 'medium'
          })
        }

        const analysisSummary: ProductivityAnalysis = {
          score: productivityScore,
          analysis: totalTasks === 0
            ? 'You are just getting started. Complete your first task to unlock personalized productivity guidance.'
            : `You have completed ${tasksCompleted} of ${totalTasks} tasks with a ${Math.round(completionRate)}% completion rate and a ${streak}-day streak.`,
          recommendations: [
            totalTasks === 0
              ? 'Create your first task to build momentum.'
              : (completionRate < 70
                ? 'Review outstanding tasks and schedule time for the most important ones.'
                : 'Keep prioritizing high-impact tasks to maintain your progress.'),
            weeklyGoals > 0
              ? (goalAchievement < 70
                ? 'Adjust your weekly goals or break them into smaller steps to improve completion.'
                : 'Plan the next set of weekly goals while this momentum is high.')
              : 'Set a weekly goal to give your effort a clear direction.',
            focusMinutes === 0
              ? 'Schedule a 25-minute focus block today to practice deep work.'
              : 'Plan your next focus session to sustain your deep-work routine.'
          ],
          trends: {
            completionRate: {
              current: Math.round(completionRate),
              previous: Math.max(0, Math.round(completionRate) - 10),
              change: Math.round(completionRate - Math.max(0, completionRate - 10))
            },
            focusTime: {
              current: Math.round(focusMinutes),
              previous: Math.max(0, Math.round(focusMinutes) - 30),
              change: Math.round(focusMinutes - Math.max(0, focusMinutes - 30))
            },
            taskEfficiency: {
              current: efficiency,
              previous: Math.max(0, efficiency - 10),
              change: efficiency - Math.max(0, efficiency - 10)
            }
          }
        }

        setMetrics(metricsData)
        setInsights(generatedInsights)
        setAnalysis(analysisSummary)
      } catch (error) {
        console.error('Error loading productivity insights:', error)
        setStatsSnapshot({
          tasksCompleted: 0,
          totalTasks: 0,
          productivityScore: 0,
          streak: 0,
          weeklyGoals: 0,
          completedGoals: 0,
          focusMinutes: 0,
          completionRate: 0
        })
        setMetrics([
          {
            id: 'completion',
            title: 'Task Completion Rate',
            value: '0%',
            change: 0,
            trend: 'neutral',
            icon: CheckCircle2,
            color: 'from-emerald-500 to-teal-500',
            description: 'Percentage of tasks completed'
          },
          {
            id: 'focus',
            title: 'Daily Focus Time',
            value: '0h',
            change: 0,
            trend: 'neutral',
            icon: Clock,
            color: 'from-blue-500 to-indigo-500',
            description: 'Average focused work time per day'
          },
          {
            id: 'productivity',
            title: 'Productivity Score',
            value: 0,
            change: 0,
            trend: 'neutral',
            icon: TrendingUp,
            color: 'from-purple-500 to-pink-500',
            description: 'Overall productivity rating (0-100)'
          },
          {
            id: 'goals',
            title: 'Goal Achievement',
            value: '0%',
            change: 0,
            trend: 'neutral',
            icon: Target,
            color: 'from-amber-500 to-orange-500',
            description: 'Percentage of weekly goals achieved'
          },
          {
            id: 'streak',
            title: 'Consistency Streak',
            value: 0,
            change: 0,
            trend: 'neutral',
            icon: Flame,
            color: 'from-red-500 to-rose-500',
            description: 'Consecutive days of task completion'
          },
          {
            id: 'efficiency',
            title: 'Task Efficiency',
            value: '0%',
            change: 0,
            trend: 'neutral',
            icon: Zap,
            color: 'from-cyan-500 to-blue-500',
            description: 'Time spent vs. estimated time'
          }
        ])
        setInsights([
          {
            id: 'insight-error',
            type: 'warning',
            title: 'Unable to load insights',
            message: 'We could not load your productivity data yet. Try refreshing the page.',
            action: 'Refresh',
            priority: 'medium'
          }
        ])
        setAnalysis({
          score: 0,
          analysis: 'We could not load productivity insights yet. Refresh the page after completing a few tasks.',
          recommendations: [
            'Refresh the page after completing tasks or goals.',
            'Check your network connection before trying again.',
            'Contact support if the issue persists.'
          ],
          trends: {
            completionRate: { current: 0, previous: 0, change: 0 },
            focusTime: { current: 0, previous: 0, change: 0 },
            taskEfficiency: { current: 0, previous: 0, change: 0 }
          }
        })
      } finally {
        setLoading(false)
      }
    }

    loadInsights()
  }, [session?.user?.id])

  // Get AI-powered productivity analysis
  const getProductivityAnalysis = async () => {
    if (statsSnapshot.totalTasks === 0) {
      toast.info('Complete a few tasks to unlock AI-powered analysis.')
      return
    }

    setAnalysisLoading(true)
    
    try {
      const aiResult = await analyzeProductivity({
        completedTasks: statsSnapshot.tasksCompleted,
        totalTasks: statsSnapshot.totalTasks,
        focusTime: statsSnapshot.focusMinutes,
        completionRate: Math.round(statsSnapshot.completionRate)
      })

      const fallbackRecommendations = [
        'Review your upcoming tasks and schedule dedicated focus blocks.',
        'Continue tracking focus sessions to maintain your momentum.',
        'End each day by planning the next one to stay organized.'
      ]

      const efficiencyMetric = metrics.find(metric => metric.id === 'efficiency')
      const efficiencyValue = efficiencyMetric
        ? parseInt(String(efficiencyMetric.value).replace('%', ''), 10) || 0
        : Math.min(100, Math.round(statsSnapshot.completionRate))

      const updatedAnalysis: ProductivityAnalysis = {
        score: aiResult?.score ?? statsSnapshot.productivityScore,
        analysis: aiResult?.analysis || (
          statsSnapshot.completionRate >= 70
            ? 'You have a healthy completion rate. Keep investing time in your highest-impact work.'
            : 'There is room to improve your task completion. Focus on finishing key priorities before picking up new work.'
        ),
        recommendations: aiResult?.recommendations?.length ? aiResult.recommendations : fallbackRecommendations,
        trends: {
          completionRate: {
            current: Math.round(statsSnapshot.completionRate),
            previous: Math.max(0, Math.round(statsSnapshot.completionRate) - 10),
            change: Math.round(statsSnapshot.completionRate - Math.max(0, statsSnapshot.completionRate - 10))
          },
          focusTime: {
            current: Math.round(statsSnapshot.focusMinutes),
            previous: Math.max(0, Math.round(statsSnapshot.focusMinutes) - 30),
            change: Math.round(statsSnapshot.focusMinutes - Math.max(0, statsSnapshot.focusMinutes - 30))
          },
          taskEfficiency: {
            current: efficiencyValue,
            previous: Math.max(0, efficiencyValue - 10),
            change: efficiencyValue - Math.max(0, efficiencyValue - 10)
          }
        }
      }
      
      setAnalysis(updatedAnalysis)
      
      const aiInsights: ProductivityInsight[] = []

      if (statsSnapshot.completionRate >= 70) {
        aiInsights.push({
          id: 'ai-strong-completion',
          type: 'success',
          title: 'Great completion momentum',
          message: 'Your completion rate is on track. Keep scheduling important work during your peak energy hours.',
          action: 'Protect your focus time',
          priority: 'high',
          metric: 'completion'
        })
      } else {
        aiInsights.push({
          id: 'ai-improve-completion',
          type: 'improvement',
          title: 'Tighten task follow-through',
          message: 'Focus on finishing one high-impact task before starting the next to raise your completion rate.',
          action: 'Review top priority tasks',
          priority: 'high',
          metric: 'completion'
        })
      }

      if (statsSnapshot.focusMinutes === 0) {
        aiInsights.push({
          id: 'ai-focus-start',
          type: 'suggestion',
          title: 'Kickstart focus sessions',
          message: 'Plan a 25-minute deep-work block today to establish momentum.',
          action: 'Schedule focus block',
          priority: 'medium'
        })
      } else {
        aiInsights.push({
          id: 'ai-focus-celebrate',
          type: 'celebration',
          title: 'Nice focus streak',
          message: `You logged ${(statsSnapshot.focusMinutes / 60).toFixed(1)} hours of focused work. Keep this habit to compound your results.`,
          action: 'Plan next session',
          priority: 'medium'
        })
      }

      if (statsSnapshot.weeklyGoals > 0) {
        const goalAchievement = statsSnapshot.weeklyGoals > 0
          ? (statsSnapshot.completedGoals / statsSnapshot.weeklyGoals) * 100
          : 0

        if (goalAchievement >= 70) {
          aiInsights.push({
            id: 'ai-goal-success',
            type: 'success',
            title: 'Weekly goals on track',
            message: 'Your weekly goals are being completed consistently. Keep reviewing them at the start of each week.',
            action: 'Plan next goals',
            priority: 'medium',
            metric: 'goals'
          })
        } else {
          aiInsights.push({
            id: 'ai-goal-tune',
            type: 'suggestion',
            title: 'Refine weekly goals',
            message: 'Break bigger goals into smaller checkpoints so you can celebrate steady progress.',
            action: 'Adjust weekly goals',
            priority: 'medium',
            metric: 'goals'
          })
        }
      }

      setInsights(aiInsights)
      toast.success('AI productivity analysis updated!')
    } catch (error) {
      console.error('Error getting productivity analysis:', error)
      toast.error('Failed to get AI productivity analysis')
    } finally {
      setAnalysisLoading(false)
    }
  }

  // Get insight icon and color
  const getInsightStyle = (type: string) => {
    switch (type) {
      case 'success': return { icon: TrendingUpIcon, color: 'bg-green-100 dark:bg-green-950/20 border-green-200 dark:border-green-800' }
      case 'improvement': return { icon: TrendingUpIcon, color: 'bg-blue-100 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' }
      case 'celebration': return { icon: Award, color: 'bg-purple-100 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800' }
      case 'suggestion': return { icon: Lightbulb, color: 'bg-amber-100 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800' }
      case 'warning': return { icon: TrendingDown, color: 'bg-red-100 dark:bg-red-950/20 border-red-200 dark:border-red-800' }
      default: return { icon: BarChart3, color: 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700' }
    }
  }

  // Get priority indicator
  const getPriorityIndicator = (priority: string) => {
    switch (priority) {
      case 'high': return <Star className="h-3 w-3 text-amber-500" />
      case 'medium': return <div className="h-2 w-2 rounded-full bg-amber-500" />
      case 'low': return <div className="h-2 w-2 rounded-full bg-gray-400" />
      default: return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading productivity insights...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              AI Productivity Insights
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Data-driven insights to boost your productivity with AI-powered analysis
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
            </select>
            <Button 
              onClick={getProductivityAnalysis}
              disabled={analysisLoading}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              {analysisLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
              ) : (
                <Brain className="h-4 w-4 mr-2" />
              )}
              Refresh AI Analysis
            </Button>
          </div>
        </div>

        {/* Productivity Score */}
        <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Productivity Score</h2>
                <p className="text-emerald-100">Overall performance rating</p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold">{analysis?.score ?? statsSnapshot.productivityScore}</div>
                  <div className="text-emerald-100 text-sm">out of 100</div>
                </div>
                <div className="w-24 h-24 relative">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="white"
                      strokeWidth="8"
                      strokeDasharray={(((analysis?.score ?? statsSnapshot.productivityScore)) * 2.83) + ' 283'}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <TrendingUpIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics.map((metric, index) => {
            const Icon = metric.icon
            return (
              <motion.div
                key={metric.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">{metric.title}</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{metric.value}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{metric.description}</p>
                      </div>
                      <div className={'p-3 rounded-lg bg-gradient-to-br ' + (metric.color)}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-3">
                      {metric.trend === 'up' ? (
                        <TrendingUpIcon className="h-4 w-4 text-emerald-500" />
                      ) : metric.trend === 'down' ? (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      ) : (
                        <div className="h-4 w-4 text-gray-500" />
                      )}
                      <span className={'text-sm font-medium ' + (metric.trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' :
                        metric.trend === 'down' ? 'text-red-600 dark:text-red-400' :
                        'text-gray-600 dark:text-gray-400')}>
                        {metric.change > 0 ? '+' : ''}{metric.change}{typeof metric.value === 'number' ? '' : '%'}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">vs last period</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* Detailed Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI Analysis */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  AI Productivity Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analysisLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-3/4"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : analysis ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-800/50">
                      <div className="flex items-start gap-2">
                        <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <h3 className="font-medium text-purple-900 dark:text-purple-100">Key Insights</h3>
                          <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                            {analysis.analysis}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">AI Recommendations</h3>
                      <div className="space-y-3">
                        {analysis.recommendations.map((rec, index) => (
                          <div 
                            key={index} 
                            className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50"
                          >
                            <div className="p-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/30">
                              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{rec}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Performance Trends</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/50">
                          <div className="text-xs text-emerald-600 dark:text-emerald-400">Completion Rate</div>
                          <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                            {analysis.trends.completionRate.current}%
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <TrendingUpIcon className="h-3 w-3 text-emerald-500" />
                            <span className="text-xs text-emerald-600 dark:text-emerald-400">
                              +{analysis.trends.completionRate.change}%
                            </span>
                          </div>
                        </div>
                        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/50">
                          <div className="text-xs text-blue-600 dark:text-blue-400">Focus Time</div>
                          <div className="text-lg font-bold text-blue-700 dark:text-blue-300">
                            {Math.round(analysis.trends.focusTime.current / 60 * 10) / 10}h
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <TrendingUpIcon className="h-3 w-3 text-blue-500" />
                            <span className="text-xs text-blue-600 dark:text-blue-400">
                              +{Math.round(analysis.trends.focusTime.change / 60 * 10) / 10}h
                            </span>
                          </div>
                        </div>
                        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/50">
                          <div className="text-xs text-amber-600 dark:text-amber-400">Efficiency</div>
                          <div className="text-lg font-bold text-amber-700 dark:text-amber-300">
                            {analysis.trends.taskEfficiency.current}%
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <TrendingUpIcon className="h-3 w-3 text-amber-500" />
                            <span className="text-xs text-amber-600 dark:text-amber-400">
                              +{analysis.trends.taskEfficiency.change}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Brain className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                    <p className="text-purple-600 dark:text-purple-400">
                      AI analysis will appear here after refresh
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* AI Insights */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  AI Insights & Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {insights.map((insight, index) => {
                    const { icon: InsightIcon, color } = getInsightStyle(insight.type)
                    return (
                      <motion.div
                        key={insight.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={'p-4 rounded-lg border ' + (color)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-800">
                            <InsightIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                {insight.title}
                              </h3>
                              <div className="flex items-center gap-1">
                                {getPriorityIndicator(insight.priority)}
                                <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                  {insight.priority}
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {insight.message}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 mt-2 text-xs"
                            >
                              {insight.action}
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={getProductivityAnalysis}
                    disabled={analysisLoading}
                  >
                    {analysisLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-transparent mr-2" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Refresh Analysis
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                  >
                    <Target className="h-4 w-4 mr-2" />
                    Set Productivity Goals
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Focus Time
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
