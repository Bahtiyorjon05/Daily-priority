'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Activity, 
  AlertCircle, 
  Compass, 
  Zap, 
  Target, 
  Lightbulb,
  Clock,
  Star,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import PrayerTimeCard from '../dashboard/components/PrayerTimeCard'

interface PrayerTime {
  name: string
  arabicName: string
  time: string
  passed: boolean
  nextPrayerIn?: string
}

interface AIRecommendation {
  id: string
  type: 'preparation' | 'reflection' | 'dhikr' | 'focus'
  title: string
  description: string
  benefit: string
  priority: 'high' | 'medium' | 'low'
}

export default function AIEnhancedPrayerTimes({
  prayerTimes,
  nextPrayer,
  location,
  locationLoading,
  locationError,
  qiblaDirection,
  onRefresh
}: {
  prayerTimes: PrayerTime[]
  nextPrayer: any
  location: { city: string; country: string } | null
  locationLoading: boolean
  locationError: string | null
  qiblaDirection: number
  onRefresh: () => void
}) {
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>([])
  const [loadingRecommendations, setLoadingRecommendations] = useState(false)
  const [expandedRecommendation, setExpandedRecommendation] = useState<string | null>(null)

  // Generate AI-powered recommendations based on prayer times
  useEffect(() => {
    const generateRecommendations = async () => {
      if (!nextPrayer) return
      
      setLoadingRecommendations(true)
      
      try {
        // In a real implementation, this would call the AI service
        // For now, we'll simulate AI recommendations
        const currentTime = new Date()
        const currentHour = currentTime.getHours()
        
        // Determine time of day for context-aware recommendations
        let timeContext = 'day'
        if (currentHour < 6) timeContext = 'night'
        else if (currentHour < 12) timeContext = 'morning'
        else if (currentHour < 17) timeContext = 'afternoon'
        else timeContext = 'evening'
        
        // Generate context-aware recommendations
        const recommendations: AIRecommendation[] = [
          {
            id: 'prep-1',
            type: 'preparation',
            title: 'Prepare for Next Prayer',
            description: 'The ' + (nextPrayer.name) + ' prayer is in ' + (nextPrayer.timeUntil || 'soon') + '. Take a few moments to prepare spiritually and physically.',
            benefit: 'Proper preparation increases khushu (humility) during prayer',
            priority: 'high'
          },
          {
            id: 'dhikr-1',
            type: 'dhikr',
            title: 'Post-Prayer Remembrance',
            description: 'After completing your prayer, recite "Subhanallah" 33 times, "Alhamdulillah" 33 times, and "Allahu Akbar" 33 times.',
            benefit: 'This dhikr brings peace to the heart and increases blessings',
            priority: 'medium'
          }
        ]
        
        // Add time-specific recommendations
        if (timeContext === 'morning') {
          recommendations.push({
            id: 'focus-1',
            type: 'focus',
            title: 'Morning Productivity Boost',
            description: 'Use the energy from Fajr prayer to tackle your most important tasks of the day.',
            benefit: 'Morning productivity is 40% higher when starting with prayer',
            priority: 'high'
          })
        } else if (timeContext === 'afternoon') {
          recommendations.push({
            id: 'reflection-1',
            type: 'reflection',
            title: 'Midday Reflection',
            description: 'Take a moment during Dhuhr to reflect on your morning accomplishments and reset your intentions.',
            benefit: 'Midday reflection helps maintain focus and purpose',
            priority: 'medium'
          })
        } else if (timeContext === 'evening') {
          recommendations.push({
            id: 'dhikr-2',
            type: 'dhikr',
            title: 'Evening Supplications',
            description: 'Recite Ayatul Kursi and the last three chapters of the Quran before sleeping.',
            benefit: 'These supplications provide protection throughout the night',
            priority: 'high'
          })
        }
        
        setAiRecommendations(recommendations)
      } catch (error) {
        console.error('Failed to generate AI recommendations:', error)
        // Fallback recommendations
        setAiRecommendations([
          {
            id: 'fallback-1',
            type: 'preparation',
            title: 'Prepare for Prayer',
            description: 'Take a few moments to prepare for your next prayer with wudu and intention.',
            benefit: 'Proper preparation increases khushu during prayer',
            priority: 'high'
          }
        ])
      } finally {
        setLoadingRecommendations(false)
      }
    }

    generateRecommendations()
  }, [nextPrayer])

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'preparation': return Target
      case 'reflection': return Lightbulb
      case 'dhikr': return Sparkles
      case 'focus': return Zap
      default: return Star
    }
  }

  const getRecommendationColor = (type: string) => {
    switch (type) {
      case 'preparation': return 'from-blue-500 to-cyan-500'
      case 'reflection': return 'from-purple-500 to-violet-500'
      case 'dhikr': return 'from-amber-500 to-yellow-500'
      case 'focus': return 'from-emerald-500 to-teal-500'
      default: return 'from-gray-500 to-slate-500'
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
      {/* Prayer Times Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-emerald-600 dark:to-teal-600 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">🕌 Prayer Times</h2>
            {locationLoading ? (
              <div className="text-white/80 flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                Getting your location...
              </div>
            ) : location ? (
              <p className="text-white/80">📍 {location.city}, {location.country}</p>
            ) : locationError ? (
              <div className="text-white/80 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{locationError}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRefresh}
                  className="text-white/80 hover:text-white hover:bg-white/10 ml-2 px-2 py-1 text-xs"
                >
                  Retry
                </Button>
              </div>
            ) : (
              <p className="text-white/80">📍 Default Location</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-center bg-white/20 rounded-lg p-2 backdrop-blur-sm">
              <div className="text-xs text-white/80">Qibla</div>
              <div className="text-lg font-bold text-white">🧭 {qiblaDirection}°</div>
            </div>
            {!locationLoading && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                className="text-white/80 hover:text-white hover:bg-white/10 backdrop-blur-sm"
                disabled={locationLoading}
              >
                <Activity className="w-4 h-4 mr-1" />
                Refresh
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Prayer Times Grid */}
      <div className="p-5">
        {locationLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading prayer times...</p>
            </div>
          </div>
        ) : prayerTimes.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {prayerTimes.filter(prayer => prayer.name !== 'Sunrise').map((prayer, index) => (
              <PrayerTimeCard 
                key={prayer.name}
                prayer={prayer}
                isNext={prayer.name === nextPrayer?.name}
                timeUntil={prayer.nextPrayerIn}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400 mb-4">
              <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Unable to load prayer times</p>
              <p className="text-sm">Check your internet connection and try again</p>
            </div>
            <Button
              variant="outline"
              onClick={onRefresh}
              className="text-sm"
            >
              Try Again
            </Button>
          </div>
        )}
      </div>
      
      {/* AI-Powered Recommendations */}
      <div className="border-t border-gray-200 dark:border-gray-700/50 p-5 bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">AI Recommendations</h3>
        </div>
        
        {loadingRecommendations ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="p-3 rounded-xl bg-white/50 dark:bg-white/10 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : aiRecommendations.length > 0 ? (
          <div className="space-y-3">
            {aiRecommendations.map((recommendation) => {
              const Icon = getRecommendationIcon(recommendation.type)
              const isExpanded = expandedRecommendation === recommendation.id
              
              return (
                <motion.div
                  key={recommendation.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl overflow-hidden border border-gray-200/50 dark:border-gray-700/50"
                >
                  <Button
                    variant="ghost"
                    className="w-full p-3 h-auto justify-start hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    onClick={() => setExpandedRecommendation(isExpanded ? null : recommendation.id)}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className={'p-2 rounded-lg bg-gradient-to-br ' + (getRecommendationColor(recommendation.type))}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                            {recommendation.title}
                          </p>
                          {recommendation.priority === 'high' && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-amber-500" />
                              <span className="text-xs text-amber-600 dark:text-amber-400">Priority</span>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {recommendation.description}
                        </p>
                      </div>
                    </div>
                  </Button>
                  
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-3 pb-3"
                    >
                      <div className="pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
                        <div className="flex items-start gap-2">
                          <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-amber-700 dark:text-amber-300">Benefit</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {recommendation.benefit}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-4">
            <Sparkles className="h-8 w-8 text-purple-400 mx-auto mb-2" />
            <p className="text-sm text-purple-600 dark:text-purple-400">
              AI recommendations will appear here
            </p>
          </div>
        )}
      </div>
      
      {/* Next Prayer Reminder */}
      {nextPrayer && !locationLoading && (
        <div className="border-t border-gray-200 dark:border-gray-700/50 p-5 bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Next Prayer
              </h3>
              <p className="text-emerald-600 dark:text-emerald-400 font-medium">
                {nextPrayer.name} at {nextPrayer.time}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {nextPrayer.timeUntil ? 'in ' + (nextPrayer.timeUntil) : 'Starting soon'}
              </p>
            </div>
            <Button 
              size="sm" 
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
            >
              Set Reminder
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}