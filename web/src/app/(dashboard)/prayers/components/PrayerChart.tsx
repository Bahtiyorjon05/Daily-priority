'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface ChartDataPoint {
  date: string
  completion: number
  onTime: number
}

interface PrayerChartProps {
  data: ChartDataPoint[]
  period?: 'daily' | 'weekly' | 'monthly'
}

export default function PrayerChart({ data, period = 'daily' }: PrayerChartProps) {
  const [chartType, setChartType] = useState<'line' | 'bar'>('line')

  // Transform data for chart display
  const chartData = data.map(point => ({
    date: point.date,
    completionRate: Math.round(point.completion),
    onTimeRate: Math.round(point.onTime)
  }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-gray-900 dark:text-white mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm font-medium">
              {entry.name}: {entry.value}%
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (!data || data.length === 0) {
    return (
      <Card className="p-6 bg-white dark:bg-gray-800 border border-white/30 dark:border-gray-700/50 shadow-lg">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Prayer Completion Trends</h3>
        <div className="flex items-center justify-center h-80 text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <p>No prayer data available yet.</p>
            <p className="text-sm mt-2">Start tracking your prayers to see trends here.</p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 bg-white dark:bg-gray-800 border border-white/30 dark:border-gray-700/50 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Prayer Completion Trends</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Track your prayer completion and punctuality over time
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={chartType === 'line' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartType('line')}
            className={chartType === 'line' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
          >
            Line
          </Button>
          <Button
            variant={chartType === 'bar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartType('bar')}
            className={chartType === 'bar' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
          >
            Bar
          </Button>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis 
                dataKey="date" 
                stroke="#6B7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="#6B7280"
                style={{ fontSize: '12px' }}
                domain={[0, 100]}
                label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft', style: { fontSize: '12px', fill: '#6B7280' } }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ fontSize: '14px' }}
                iconType="circle"
              />
              <Line 
                type="monotone" 
                dataKey="completionRate" 
                stroke="#10B981" 
                strokeWidth={3}
                name="Completion Rate"
                dot={{ fill: '#10B981', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="onTimeRate" 
                stroke="#F59E0B" 
                strokeWidth={3}
                name="On-Time Rate"
                dot={{ fill: '#F59E0B', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis 
                dataKey="date" 
                stroke="#6B7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="#6B7280"
                style={{ fontSize: '12px' }}
                domain={[0, 100]}
                label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft', style: { fontSize: '12px', fill: '#6B7280' } }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ fontSize: '14px' }}
                iconType="circle"
              />
              <Bar 
                dataKey="completionRate" 
                fill="#10B981" 
                name="Completion Rate"
                radius={[8, 8, 0, 0]}
              />
              <Bar 
                dataKey="onTimeRate" 
                fill="#F59E0B" 
                name="On-Time Rate"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Legend Explanation */}
      <div className="flex flex-wrap gap-6 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-emerald-500"></div>
          <span className="text-sm text-gray-700 dark:text-gray-300">
            <strong>Completion Rate:</strong> Percentage of prayers completed each day
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-amber-500"></div>
          <span className="text-sm text-gray-700 dark:text-gray-300">
            <strong>On-Time Rate:</strong> Percentage of completed prayers prayed on time
          </span>
        </div>
      </div>
    </Card>
  )
}
