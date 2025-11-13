'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle2, Circle, Sun, Moon, Sparkles, BarChart3, Calendar, Award, Flame, TrendingUp, BookOpen, Star } from 'lucide-react'
import { toast } from 'sonner'

interface AdhkarItem {
  id: string
  arabic: string
  transliteration: string
  translation: string
  target: number
  source: string
  benefits?: string
}

interface AdhkarProgress {
  adhkarId: string
  completed: boolean
  count: number
}

interface Statistics {
  totalCompletions: number
  currentStreak: number
  longestStreak: number
  morningCompletions: number
  eveningCompletions: number
  generalCompletions: number
  completionRate: number
  last7Days: boolean[]
  last30Days: { date: string; completed: number; total: number }[]
}

type AdhkarCategory = 'morning' | 'evening' | 'general'

const ADHKAR_DATA: Record<AdhkarCategory, AdhkarItem[]> = {
  morning: [
    {
      id: 'm1',
      arabic: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ',
      transliteration: 'Asbahnaa wa asbahal-mulku lillaah walhamdulillaah',
      translation: 'We have entered the morning and the kingdom belongs to Allah, and all praise is for Allah',
      target: 1,
      source: 'Muslim',
      benefits: 'Protection and blessings for the day'
    },
    {
      id: 'm2',
      arabic: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ',
      transliteration: 'Allaahu laa ilaaha illaa huwal-hayyul-qayyoom (Ayatul Kursi)',
      translation: 'Allah - there is no deity except Him, the Ever-Living, the Sustainer',
      target: 1,
      source: 'Quran 2:255',
      benefits: 'Complete protection throughout the day'
    },
    {
      id: 'm3',
      arabic: 'بِسْمِ اللهِ الَّذِي لاَ يَضُرُّ مَعَ اسْمِهِ شَيْءٌ',
      transliteration: 'Bismillaahil-lathee laa yadurru ma-asmihi shay-un',
      translation: 'In the name of Allah with whose name nothing is harmed',
      target: 3,
      source: 'Abu Dawud',
      benefits: 'Protection from all harm'
    },
    {
      id: 'm4',
      arabic: 'رَضِيتُ بِاللهِ رَبًّا وَبِالْإِسْلَامِ دِينًا وَبِمُحَمَّدٍ نَبِيًّا',
      transliteration: 'Radeetu billaahi rabba wa bil-islaami deena wa bi-muhammadin nabiyya',
      translation: 'I am pleased with Allah as my Lord, Islam as my religion, and Muhammad as my Prophet',
      target: 3,
      source: 'Abu Dawud',
      benefits: 'Paradise is guaranteed'
    },
    {
      id: 'm5',
      arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
      transliteration: 'Subhaanallaahi wa bihamdihi',
      translation: 'Glory be to Allah and praise Him',
      target: 100,
      source: 'Bukhari & Muslim',
      benefits: 'Sins forgiven even if like the foam of the sea'
    },
    {
      id: 'm6',
      arabic: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ',
      transliteration: 'Laa ilaaha illallaahu wahdahu laa shareeka lah',
      translation: 'There is no god but Allah alone, with no partner',
      target: 10,
      source: 'Tirmidhi',
      benefits: 'Reward of freeing slaves, protection from Satan'
    }
  ],
  evening: [
    {
      id: 'e1',
      arabic: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ',
      transliteration: 'Amsaynaa wa amsal-mulku lillaah walhamdulillaah',
      translation: 'We have entered the evening and the kingdom belongs to Allah, and all praise is for Allah',
      target: 1,
      source: 'Muslim',
      benefits: 'Protection and blessings for the night'
    },
    {
      id: 'e2',
      arabic: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ',
      transliteration: 'Allaahu laa ilaaha illaa huwal-hayyul-qayyoom (Ayatul Kursi)',
      translation: 'Allah - there is no deity except Him, the Ever-Living, the Sustainer',
      target: 1,
      source: 'Quran 2:255',
      benefits: 'Complete protection throughout the night'
    },
    {
      id: 'e3',
      arabic: 'بِسْمِ اللهِ الَّذِي لاَ يَضُرُّ مَعَ اسْمِهِ شَيْءٌ',
      transliteration: 'Bismillaahil-lathee laa yadurru ma-asmihi shay-un',
      translation: 'In the name of Allah with whose name nothing is harmed',
      target: 3,
      source: 'Abu Dawud',
      benefits: 'Protection from all harm'
    },
    {
      id: 'e4',
      arabic: 'رَضِيتُ بِاللهِ رَبًّا وَبِالْإِسْلَامِ دِينًا وَبِمُحَمَّدٍ نَبِيًّا',
      transliteration: 'Radeetu billaahi rabba wa bil-islaami deena wa bi-muhammadin nabiyya',
      translation: 'I am pleased with Allah as my Lord, Islam as my religion, and Muhammad as my Prophet',
      target: 3,
      source: 'Abu Dawud',
      benefits: 'Paradise is guaranteed'
    },
    {
      id: 'e5',
      arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
      transliteration: 'Subhaanallaahi wa bihamdihi',
      translation: 'Glory be to Allah and praise Him',
      target: 100,
      source: 'Bukhari & Muslim',
      benefits: 'Sins forgiven even if like the foam of the sea'
    }
  ],
  general: [
    {
      id: 'g1',
      arabic: 'سُبْحَانَ اللَّهِ',
      transliteration: 'Subhaanallaah',
      translation: 'Glory be to Allah',
      target: 33,
      source: 'Muslim'
    },
    {
      id: 'g2',
      arabic: 'الْحَمْدُ لِلَّهِ',
      transliteration: 'Alhamdulillaah',
      translation: 'All praise is due to Allah',
      target: 33,
      source: 'Muslim'
    },
    {
      id: 'g3',
      arabic: 'اللَّهُ أَكْبَرُ',
      transliteration: 'Allaahu Akbar',
      translation: 'Allah is the Greatest',
      target: 34,
      source: 'Muslim'
    },
    {
      id: 'g4',
      arabic: 'أَسْتَغْفِرُ اللَّهَ',
      transliteration: 'Astaghfirullaah',
      translation: 'I seek forgiveness from Allah',
      target: 100,
      source: 'Bukhari',
      benefits: 'Opens doors of mercy and provision'
    }
  ]
}

export default function AdhkarPage() {
  const [category, setCategory] = useState<AdhkarCategory>('morning')
  const [progress, setProgress] = useState<Map<string, AdhkarProgress>>(new Map())
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [activeTab, setActiveTab] = useState('adhkar')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Load both in parallel to avoid race condition
    Promise.all([loadProgress(), loadStatistics()])
  }, [category])

  async function loadProgress() {
    try {
      const response = await fetch(`/api/adhkar?category=${category}&date=${new Date().toISOString()}`)
      if (response.ok) {
        const data = await response.json()
        const progressMap = new Map<string, AdhkarProgress>()
        data.progress?.forEach((p: any) => {
          progressMap.set(p.adhkarId, {
            adhkarId: p.adhkarId,
            completed: p.completed,
            count: p.count
          })
        })
        setProgress(progressMap)
      }
    } catch (error) {
      console.error('Error loading progress:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadStatistics() {
    try {
      const response = await fetch('/api/adhkar/statistics')
      if (response.ok) {
        const data = await response.json()
        setStatistics(data.statistics)
      }
    } catch (error) {
      console.error('Error loading statistics:', error)
    }
  }

  async function toggleComplete(item: AdhkarItem) {
    const current = progress.get(item.id)
    const newCompleted = !current?.completed

    const newProgress = new Map(progress)
    newProgress.set(item.id, {
      adhkarId: item.id,
      completed: newCompleted,
      count: newCompleted ? item.target : 0
    })
    setProgress(newProgress)

    try {
      const response = await fetch('/api/adhkar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adhkarId: item.id,
          adhkarName: item.transliteration,
          category,
          count: newCompleted ? item.target : 0,
          target: item.target
        })
      })

      if (response.ok) {
        if (newCompleted) {
          toast.success('Dhikr completed!', {
            description: `Masha Allah! ${item.transliteration}`,
            duration: 2000
          })
        }
        loadStatistics()
      }
    } catch (error) {
      console.error('Error saving progress:', error)
      toast.error('Failed to save progress')
      setProgress(progress)
    }
  }

  const adhkarList = ADHKAR_DATA[category]
  const completedCount = adhkarList.filter(item => progress.get(item.id)?.completed).length
  const totalCount = adhkarList.length
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 dark:from-gray-950 dark:via-emerald-950/10 dark:to-gray-950">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-3 py-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl shadow-2xl">
              <BookOpen className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Daily Adhkar
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Remember Allah morning and evening - Track your spiritual journey
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-14 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-2 border-green-200 dark:border-green-800 shadow-lg">
            <TabsTrigger 
              value="adhkar" 
              className="text-base font-semibold text-gray-700 dark:text-gray-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-emerald-600 data-[state=active]:text-green-950 dark:data-[state=active]:text-white transition-all"
            >
              <Star className="h-5 w-5 mr-2" />
              Adhkar
            </TabsTrigger>
            <TabsTrigger 
              value="stats" 
              className="text-base font-semibold text-gray-700 dark:text-gray-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-emerald-600 data-[state=active]:text-green-950 dark:data-[state=active]:text-white transition-all"
            >
              <BarChart3 className="h-5 w-5 mr-2" />
              Statistics
            </TabsTrigger>
          </TabsList>

          {/* Adhkar Tab */}
          <TabsContent value="adhkar" className="space-y-6 mt-8">
            {/* Category Buttons */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <Button
                onClick={() => setCategory('morning')}
                className={`h-20 sm:h-24 flex flex-col items-center justify-center gap-2 text-sm sm:text-base font-bold transition-all duration-300 ${
                  category === 'morning'
                    ? 'bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-amber-950 dark:text-white shadow-2xl shadow-amber-500/40 scale-105 border-4 border-amber-300'
                    : 'bg-white/80 dark:bg-gray-800/80 text-amber-700 dark:text-amber-300 border-2 border-amber-200 dark:border-amber-800 hover:border-amber-400 hover:scale-105 hover:shadow-xl'
                }`}
              >
                <Sun className="h-7 w-7 sm:h-8 sm:w-8" />
                Morning
              </Button>
              <Button
                onClick={() => setCategory('evening')}
                className={`h-20 sm:h-24 flex flex-col items-center justify-center gap-2 text-sm sm:text-base font-bold transition-all duration-300 ${
                  category === 'evening'
                    ? 'bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-purple-700 text-indigo-950 dark:text-white shadow-2xl shadow-indigo-500/40 scale-105 border-4 border-indigo-300'
                    : 'bg-white/80 dark:bg-gray-800/80 text-indigo-700 dark:text-indigo-300 border-2 border-indigo-200 dark:border-indigo-800 hover:border-indigo-400 hover:scale-105 hover:shadow-xl'
                }`}
              >
                <Moon className="h-7 w-7 sm:h-8 sm:w-8" />
                Evening
              </Button>
              <Button
                onClick={() => setCategory('general')}
                className={`h-20 sm:h-24 flex flex-col items-center justify-center gap-2 text-sm sm:text-base font-bold transition-all duration-300 ${
                  category === 'general'
                    ? 'bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-green-950 dark:text-white shadow-2xl shadow-green-500/40 scale-105 border-4 border-green-300'
                    : 'bg-white/80 dark:bg-gray-800/80 text-green-700 dark:text-green-300 border-2 border-green-200 dark:border-green-800 hover:border-green-400 hover:scale-105 hover:shadow-xl'
                }`}
              >
                <Sparkles className="h-7 w-7 sm:h-8 sm:w-8" />
                General
              </Button>
            </div>

            {/* Progress Card */}
            <Card className={`p-6 sm:p-8 transition-all duration-500 ${
              completedCount === totalCount
                ? 'bg-gradient-to-br from-green-100 to-emerald-200 dark:from-green-950/60 dark:to-emerald-950/60 border-4 border-green-500 shadow-2xl shadow-green-500/30 animate-pulse'
                : 'bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-2 border-gray-200 dark:border-gray-700 shadow-xl'
            }`}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Today's Progress</h3>
                  {completedCount === totalCount && (
                    <Sparkles className="h-8 w-8 text-green-600 dark:text-green-400 animate-pulse" />
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex items-end justify-between">
                    <span className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      {completedCount}
                    </span>
                    <span className="text-3xl sm:text-4xl font-semibold text-gray-400">/ {totalCount}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 transition-all duration-700 rounded-full"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                    <p className="text-right text-xl font-bold text-green-600 dark:text-green-400">{progressPercentage}%</p>
                  </div>
                </div>
                {completedCount === totalCount && (
                  <div className="pt-4 border-t border-green-300 dark:border-green-700">
                    <p className="text-center text-lg font-semibold text-green-700 dark:text-green-300">
                      🎉 Alhamdulillah! All {category} adhkar completed! 🎉
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Adhkar List */}
            <div className="grid gap-4">{adhkarList.map((item, index) => {
              const isComplete = progress.get(item.id)?.completed || false

              return (
                <Card
                  key={item.id}
                  className={`group p-5 sm:p-6 transition-all duration-300 cursor-pointer hover:scale-[1.02] ${
                    isComplete
                      ? 'bg-gradient-to-r from-green-50 to-emerald-100 dark:from-green-950/50 dark:to-emerald-950/50 border-2 border-green-400 dark:border-green-600 shadow-xl shadow-green-500/20'
                      : 'bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-2 border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700 hover:shadow-2xl'
                  }`}
                  onClick={() => toggleComplete(item)}
                >
                  <div className="flex gap-4 sm:gap-5">
                    {/* Checkbox */}
                    <div className="flex-shrink-0 pt-1">
                      {isComplete ? (
                        <CheckCircle2 className="h-10 w-10 sm:h-12 sm:w-12 text-green-600 dark:text-green-400 drop-shadow-lg" />
                      ) : (
                        <Circle className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 dark:text-gray-600 group-hover:text-green-500 transition-colors" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-3">
                      {/* Arabic */}
                      <p
                        className="text-2xl sm:text-3xl lg:text-4xl font-bold text-right leading-loose bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent"
                        dir="rtl"
                        style={{ fontFamily: 'Amiri, Traditional Arabic, serif' }}
                      >
                        {item.arabic}
                      </p>

                      {/* Transliteration */}
                      <p className="text-sm sm:text-base lg:text-lg italic text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
                        {item.transliteration}
                      </p>

                      {/* Translation */}
                      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                        {item.translation}
                      </p>

                      {/* Benefits */}
                      {item.benefits && (
                        <div className="pt-2">
                          <p className="text-xs sm:text-sm text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800">
                            ✨ <strong>Benefits:</strong> {item.benefits}
                          </p>
                        </div>
                      )}

                      {/* Footer Tags */}
                      <div className="flex flex-wrap gap-2 pt-2">
                        <span className="inline-flex items-center bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-200 text-xs sm:text-sm px-3 py-1.5 rounded-full border border-blue-200 dark:border-blue-800 font-semibold">
                          Repeat {item.target}x
                        </span>
                        <span className="inline-flex items-center bg-purple-100 dark:bg-purple-950/50 text-purple-800 dark:text-purple-200 text-xs sm:text-sm px-3 py-1.5 rounded-full border border-purple-200 dark:border-purple-800">
                          {item.source}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}</div>
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="stats" className="space-y-6 mt-8">
            {statistics && (
              <>
                {/* Main Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="p-5 sm:p-6 space-y-3 bg-gradient-to-br from-orange-50 to-red-100 dark:from-orange-950/40 dark:to-red-950/40 border-2 border-orange-300 dark:border-orange-700 hover:scale-105 transition-transform shadow-xl">
                    <Flame className="h-10 w-10 text-orange-600 dark:text-orange-400" />
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Current Streak</p>
                    <p className="text-4xl sm:text-5xl font-bold text-orange-600 dark:text-orange-400">{statistics.currentStreak}</p>
                    <p className="text-xs text-gray-500">consecutive days</p>
                  </Card>

                  <Card className="p-5 sm:p-6 space-y-3 bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-950/40 dark:to-pink-950/40 border-2 border-purple-300 dark:border-purple-700 hover:scale-105 transition-transform shadow-xl">
                    <Award className="h-10 w-10 text-purple-600 dark:text-purple-400" />
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Best Streak</p>
                    <p className="text-4xl sm:text-5xl font-bold text-purple-600 dark:text-purple-400">{statistics.longestStreak}</p>
                    <p className="text-xs text-gray-500">days record</p>
                  </Card>

                  <Card className="p-5 sm:p-6 space-y-3 bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-950/40 dark:to-cyan-950/40 border-2 border-blue-300 dark:border-blue-700 hover:scale-105 transition-transform shadow-xl">
                    <Calendar className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Total Completed</p>
                    <p className="text-4xl sm:text-5xl font-bold text-blue-600 dark:text-blue-400">{statistics.totalCompletions}</p>
                    <p className="text-xs text-gray-500">adhkar</p>
                  </Card>

                  <Card className="p-5 sm:p-6 space-y-3 bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/40 dark:to-emerald-950/40 border-2 border-green-300 dark:border-green-700 hover:scale-105 transition-transform shadow-xl">
                    <TrendingUp className="h-10 w-10 text-green-600 dark:text-green-400" />
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Success Rate</p>
                    <p className="text-4xl sm:text-5xl font-bold text-green-600 dark:text-green-400">{statistics.completionRate}%</p>
                    <p className="text-xs text-gray-500">last 30 days</p>
                  </Card>
                </div>

                {/* Category Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950/30 dark:to-orange-950/30 border-2 border-amber-300 dark:border-amber-700 shadow-xl">
                    <div className="flex items-center gap-4">
                      <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-lg">
                        <Sun className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Morning Adhkar</p>
                        <p className="text-3xl font-bold text-amber-700 dark:text-amber-300">{statistics.morningCompletions}</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-indigo-950/30 dark:to-purple-950/30 border-2 border-indigo-300 dark:border-indigo-700 shadow-xl">
                    <div className="flex items-center gap-4">
                      <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-lg">
                        <Moon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Evening Adhkar</p>
                        <p className="text-3xl font-bold text-indigo-700 dark:text-indigo-300">{statistics.eveningCompletions}</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/30 dark:to-emerald-950/30 border-2 border-green-300 dark:border-green-700 shadow-xl">
                    <div className="flex items-center gap-4">
                      <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-lg">
                        <Sparkles className="h-8 w-8 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">General Adhkar</p>
                        <p className="text-3xl font-bold text-green-700 dark:text-green-300">{statistics.generalCompletions}</p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Last 7 Days */}
                <Card className="p-6 sm:p-8 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-2 border-gray-200 dark:border-gray-700 shadow-xl">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-3">
                    <BarChart3 className="h-6 w-6 text-green-600" />
                    Last 7 Days
                  </h3>
                  <div className="grid grid-cols-7 gap-2 sm:gap-3">
                    {statistics.last7Days.map((completed, index) => {
                      const date = new Date()
                      date.setDate(date.getDate() - (6 - index))
                      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
                      
                      return (
                        <div key={index} className="flex flex-col items-center gap-2">
                          <div className="text-xs sm:text-sm font-bold text-gray-600 dark:text-gray-400">{dayName}</div>
                          <div
                            className={`w-full h-24 sm:h-32 rounded-xl transition-all shadow-lg ${
                              completed
                                ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/50'
                                : 'bg-gray-200 dark:bg-gray-700'
                            }`}
                          />
                        </div>
                      )
                    })}
                  </div>
                </Card>

                {/* Last 30 Days */}
                <Card className="p-6 sm:p-8 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-2 border-gray-200 dark:border-gray-700 shadow-xl">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-3">
                    <Calendar className="h-6 w-6 text-green-600" />
                    Last 30 Days
                  </h3>
                  <div className="grid grid-cols-10 gap-2">
                    {statistics.last30Days.map((day, index) => (
                      <div
                        key={index}
                        className={`aspect-square rounded-lg transition-all ${
                          day.completed > 0
                            ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-md hover:scale-110'
                            : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                        title={`${day.date}: ${day.completed} / ${day.total}`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-center gap-6 mt-6 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-gradient-to-br from-green-500 to-emerald-600" />
                      <span className="text-gray-600 dark:text-gray-400">Completed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-gray-200 dark:bg-gray-700" />
                      <span className="text-gray-600 dark:text-gray-400">Not completed</span>
                    </div>
                  </div>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
