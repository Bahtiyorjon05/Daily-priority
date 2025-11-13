'use client'

import { Card } from '@/components/ui/card'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { TrendingUp } from 'lucide-react'

interface ChartDataPoint {
  date: string
  completion: number
  onTime: number
}

interface PrayerChartProps {
  data: ChartDataPoint[]
  period: 'daily' | 'weekly' | 'monthly'
}

export default function PrayerChart({ data, period }: PrayerChartProps) {
  const periodLabels = {
    daily: 'Last 7 Days',
    weekly: 'Last 8 Weeks',
    monthly: 'Last 12 Months'
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Card className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-700 dark:text-gray-300">
                {entry.name}: {entry.value}%
              </span>
            </div>
          ))}
        </Card>
      )
    }
    return null
  }

  return (
    <Card className="p-6 bg-white dark:bg-gray-800 border border-white/30 dark:border-gray-700/50 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
            <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-300">Prayer Trends</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{periodLabels[period]}</p>
          </div>
        </div>
      </div>

      {data.length > 0 ? (
        <div className="space-y-8">
          {/* Line Chart for Trends */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Completion Trend</h4>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis 
                  dataKey="date" 
                  stroke="#9CA3AF" 
                  style={{ fontSize: '12px' }}
                  tick={{ fill: '#9CA3AF' }}
                />
                <YAxis 
                  stroke="#9CA3AF" 
                  style={{ fontSize: '12px' }}
                  tick={{ fill: '#9CA3AF' }}
                  domain={[0, 100]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                  iconType="circle"
                />
                <Line 
                  type="monotone" 
                  dataKey="completion" 
                  name="Completion Rate"
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ fill: '#10b981', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="onTime" 
                  name="On-Time Rate"
                  stroke="#f59e0b" 
                  strokeWidth={3}
                  dot={{ fill: '#f59e0b', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart for Comparison */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Performance Comparison</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis 
                  dataKey="date" 
                  stroke="#9CA3AF" 
                  style={{ fontSize: '12px' }}
                  tick={{ fill: '#9CA3AF' }}
                />
                <YAxis 
                  stroke="#9CA3AF" 
                  style={{ fontSize: '12px' }}
                  tick={{ fill: '#9CA3AF' }}
                  domain={[0, 100]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                  iconType="rect"
                />
                <Bar 
                  dataKey="completion" 
                  name="Completion Rate"
                  fill="#10b981" 
                  radius={[8, 8, 0, 0]}
                />
                <Bar 
                  dataKey="onTime" 
                  name="On-Time Rate"
                  fill="#f59e0b" 
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Average</p>
              <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                {Math.round(data.reduce((acc, d) => acc + d.completion, 0) / data.length)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Best Day</p>
              <p className="text-lg font-bold text-green-700 dark:text-green-300">
                {Math.max(...data.map(d => d.completion))}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">On-Time Avg</p>
              <p className="text-lg font-bold text-orange-700 dark:text-orange-300">
                {Math.round(data.reduce((acc, d) => acc + d.onTime, 0) / data.length)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Trend</p>
              <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                {data.length > 1 && data[data.length - 1].completion > data[0].completion ? '📈' : '📉'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Not enough data to display charts.</p>
          <p className="text-sm mt-2">Keep tracking your prayers to see trends here.</p>
        </div>
      )}
    </Card>
  )
}
