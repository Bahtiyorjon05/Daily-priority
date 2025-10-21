'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  progress?: number
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
}

export default function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color, 
  progress 
}: StatCardProps) {
  const colorClasses = {
    blue: 'from-blue-500 to-indigo-500',
    emerald: 'from-emerald-500 to-teal-500',
    purple: 'from-purple-500 to-violet-500',
    amber: 'from-amber-500 to-yellow-500',
    rose: 'from-rose-500 to-pink-500'
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="h-full"
    >
      <Card className="relative overflow-hidden bg-white/90 dark:bg-gray-800/60 backdrop-blur-sm border border-slate-200 hover:border-emerald-300 dark:border-slate-700 dark:hover:border-emerald-700 shadow-sm hover:shadow-lg transition-all duration-300 h-full">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-1">{title}</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-gray-100 tracking-tight">{value}</p>
              {subtitle && (
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">{subtitle}</p>
              )}
            </div>
            <div className={'h-12 w-12 rounded-xl flex items-center justify-center bg-gradient-to-br ' + (colorClasses[color as keyof typeof colorClasses])}>
              <Icon className="h-6 w-6 text-white" />
            </div>
          </div>
          
          {progress !== undefined && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <motion.div 
                  className={'h-2 rounded-full bg-gradient-to-r ' + (colorClasses[color as keyof typeof colorClasses])}
                  initial={{ width: 0 }}
                  animate={{ width: (progress) + '%' }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
