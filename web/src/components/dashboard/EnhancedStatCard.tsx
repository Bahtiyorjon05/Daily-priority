'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface EnhancedStatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  progress?: number
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  className?: string
}

export default function EnhancedStatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color, 
  progress,
  trend,
  trendValue,
  className
}: EnhancedStatCardProps) {
  const colorClasses = {
    blue: 'from-blue-500 to-indigo-500',
    emerald: 'from-emerald-500 to-teal-500',
    purple: 'from-purple-500 to-violet-500',
    amber: 'from-amber-500 to-yellow-500',
    rose: 'from-rose-500 to-pink-500'
  }
  
  const trendColors = {
    up: 'text-emerald-600 dark:text-emerald-400',
    down: 'text-red-600 dark:text-red-400',
    neutral: 'text-gray-600 dark:text-gray-400'
  }
  
  const TrendIcon = () => {
    if (!trend) return null
    
    return (
      <div className={`flex items-center ${trendColors[trend]}`}>
        {trend === 'up' ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        ) : trend === 'down' ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
          </svg>
        )}
        {trendValue && <span className="text-xs font-medium ml-1">{trendValue}</span>}
      </div>
    )
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className={cn("h-full", className)}
    >
      <Card className="relative overflow-hidden bg-card text-card-foreground border border-border hover:shadow-lg transition-all duration-300 h-full group">
        {/* Background gradient overlay */}
        <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
        
        <CardContent className="p-5 relative z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-sm font-medium">{title}</p>
                {trend && <TrendIcon />}
              </div>
              
              <div className="flex items-end mt-2">
                <p className="text-2xl font-bold text-foreground">{value}</p>
                {subtitle && (
                  <p className="text-muted-foreground text-sm ml-2 mb-1">{subtitle}</p>
                )}
              </div>
            </div>
            
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} shadow-md`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
          </div>
          
          {progress !== undefined && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-muted dark:bg-muted/50 rounded-full h-2 overflow-hidden">
                <motion.div 
                  className={`h-2 rounded-full bg-gradient-to-r ${colorClasses[color as keyof typeof colorClasses]}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
              
              {/* Progress markers */}
              <div className="flex justify-between mt-1">
                {[0, 25, 50, 75, 100].map((marker) => (
                  <div 
                    key={marker} 
                    className={`w-1 h-1 rounded-full ${
                      progress >= marker 
                        ? `bg-gradient-to-r ${colorClasses[color as keyof typeof colorClasses]}`
                        : 'bg-muted dark:bg-muted/50'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-gradient-to-br from-white/20 to-transparent dark:from-white/10 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 -translate-y-12 translate-x-12"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 rounded-full bg-gradient-to-br from-white/20 to-transparent dark:from-white/10 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-8 -translate-x-8"></div>
        </CardContent>
      </Card>
    </motion.div>
  )
}