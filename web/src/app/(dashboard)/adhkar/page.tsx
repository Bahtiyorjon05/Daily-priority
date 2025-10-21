'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Circle, RotateCcw, Sun, Moon, Sparkles, TrendingUp } from 'lucide-react'

interface AdhkarItem {
  id: string
  arabic: string
  transliteration: string
  translation: string
  count: number
  completed: number
  source: string
}

type AdhkarPeriod = 'morning' | 'evening'

const morningAdhkar: AdhkarItem[] = [
  {
    id: 'm1',
    arabic: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ',
    transliteration: 'Aṣbaḥnā wa aṣbaḥa l-mulku lillāh',
    translation: 'We have entered the morning and the kingdom belongs to Allah',
    count: 1,
    completed: 0,
    source: 'Muslim'
  },
  {
    id: 'm2',
    arabic: 'اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا',
    transliteration: 'Allāhumma bika aṣbaḥnā wa bika amsaynā',
    translation: 'O Allah, by You we enter the morning and by You we enter the evening',
    count: 1,
    completed: 0,
    source: 'Abu Dawud'
  },
  {
    id: 'm3',
    arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
    transliteration: 'Subḥānallāhi wa biḥamdih',
    translation: 'Glory be to Allah and praise Him',
    count: 100,
    completed: 0,
    source: 'Bukhari & Muslim'
  },
  {
    id: 'm4',
    arabic: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ',
    transliteration: 'Lā ilāha illallāhu waḥdahu lā sharīka lah',
    translation: 'There is no god but Allah alone, with no partner',
    count: 10,
    completed: 0,
    source: 'Tirmidhi'
  },
  {
    id: 'm5',
    arabic: 'أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ',
    transliteration: 'Astaghfirullāha wa atūbu ilayh',
    translation: 'I seek forgiveness from Allah and I repent to Him',
    count: 100,
    completed: 0,
    source: 'Bukhari'
  },
  {
    id: 'm6',
    arabic: 'سُبْحَانَ اللَّهِ',
    transliteration: 'Subḥānallāh',
    translation: 'Glory be to Allah',
    count: 33,
    completed: 0,
    source: 'Muslim'
  },
  {
    id: 'm7',
    arabic: 'الْحَمْدُ لِلَّهِ',
    transliteration: 'Alḥamdulillāh',
    translation: 'All praise is due to Allah',
    count: 33,
    completed: 0,
    source: 'Muslim'
  },
  {
    id: 'm8',
    arabic: 'اللَّهُ أَكْبَرُ',
    transliteration: 'Allāhu Akbar',
    translation: 'Allah is the Greatest',
    count: 34,
    completed: 0,
    source: 'Muslim'
  }
]

const eveningAdhkar: AdhkarItem[] = [
  {
    id: 'e1',
    arabic: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ',
    transliteration: 'Amsaynā wa amsā l-mulku lillāh',
    translation: 'We have entered the evening and the kingdom belongs to Allah',
    count: 1,
    completed: 0,
    source: 'Muslim'
  },
  {
    id: 'e2',
    arabic: 'اللَّهُمَّ بِكَ أَمْسَيْنَا وَبِكَ أَصْبَحْنَا',
    transliteration: 'Allāhumma bika amsaynā wa bika aṣbaḥnā',
    translation: 'O Allah, by You we enter the evening and by You we enter the morning',
    count: 1,
    completed: 0,
    source: 'Abu Dawud'
  },
  {
    id: 'e3',
    arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
    transliteration: 'Subḥānallāhi wa biḥamdih',
    translation: 'Glory be to Allah and praise Him',
    count: 100,
    completed: 0,
    source: 'Bukhari & Muslim'
  },
  {
    id: 'e4',
    arabic: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ',
    transliteration: 'Lā ilāha illallāhu waḥdahu lā sharīka lah',
    translation: 'There is no god but Allah alone, with no partner',
    count: 10,
    completed: 0,
    source: 'Tirmidhi'
  },
  {
    id: 'e5',
    arabic: 'أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ',
    transliteration: 'Astaghfirullāha wa atūbu ilayh',
    translation: 'I seek forgiveness from Allah and I repent to Him',
    count: 100,
    completed: 0,
    source: 'Bukhari'
  },
  {
    id: 'e6',
    arabic: 'سُبْحَانَ اللَّهِ',
    transliteration: 'Subḥānallāh',
    translation: 'Glory be to Allah',
    count: 33,
    completed: 0,
    source: 'Muslim'
  },
  {
    id: 'e7',
    arabic: 'الْحَمْدُ لِلَّهِ',
    transliteration: 'Alḥamdulillāh',
    translation: 'All praise is due to Allah',
    count: 33,
    completed: 0,
    source: 'Muslim'
  },
  {
    id: 'e8',
    arabic: 'اللَّهُ أَكْبَرُ',
    transliteration: 'Allāhu Akbar',
    translation: 'Allah is the Greatest',
    count: 34,
    completed: 0,
    source: 'Muslim'
  }
]

export default function AdhkarPage() {
  const [period, setPeriod] = useState<AdhkarPeriod>('morning')
  const [adhkar, setAdhkar] = useState<AdhkarItem[]>(morningAdhkar)

  useEffect(() => {
    loadProgress()
  }, [period])

  function loadProgress() {
    const today = new Date().toDateString()
    const key = 'adhkar-' + (period) + '-' + (today)
    const stored = localStorage.getItem(key)

    if (stored) {
      setAdhkar(JSON.parse(stored))
    } else {
      setAdhkar(period === 'morning' ? morningAdhkar : eveningAdhkar)
    }
  }

  function saveProgress(updatedAdhkar: AdhkarItem[]) {
    const today = new Date().toDateString()
    const key = 'adhkar-' + (period) + '-' + (today)
    localStorage.setItem(key, JSON.stringify(updatedAdhkar))
  }

  function incrementCount(id: string) {
    const updated = adhkar.map(item => {
      if (item.id === id && item.completed < item.count) {
        return { ...item, completed: item.completed + 1 }
      }
      return item
    })
    setAdhkar(updated)
    saveProgress(updated)
  }

  function decrementCount(id: string) {
    const updated = adhkar.map(item => {
      if (item.id === id && item.completed > 0) {
        return { ...item, completed: item.completed - 1 }
      }
      return item
    })
    setAdhkar(updated)
    saveProgress(updated)
  }

  function resetAll() {
    const reset = adhkar.map(item => ({ ...item, completed: 0 }))
    setAdhkar(reset)
    saveProgress(reset)
  }

  function switchPeriod(newPeriod: AdhkarPeriod) {
    setPeriod(newPeriod)
  }

  const totalCount = adhkar.reduce((sum, item) => sum + item.count, 0)
  const completedCount = adhkar.reduce((sum, item) => sum + item.completed, 0)
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  const allCompleted = completedCount === totalCount

  return (
    <div className="min-h-screen p-6 space-y-6 animate-fade-in relative bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 ui-element">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 right-1/3 w-96 h-96 bg-lime-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative z-10 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Daily Adhkar
          </h1>
          <p className="text-gray-700 dark:text-gray-300">Remember Allah morning and evening</p>
        </div>

        {/* Period Selector */}
        <div className="flex gap-3">
          <Button
            variant={period === 'morning' ? 'default' : 'outline'}
            onClick={() => switchPeriod('morning')}
            className={'gap-2 flex-1 transition-all duration-300 ui-element ' + (period === 'morning'
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-transparent shadow-md'
                : 'border-green-300 dark:border-green-700 hover:border-green-500 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-950/20')}
          >
            <Sun className="h-4 w-4" />
            Morning Adhkar
          </Button>
          <Button
            variant={period === 'evening' ? 'default' : 'outline'}
            onClick={() => switchPeriod('evening')}
            className={'gap-2 flex-1 transition-all duration-300 ui-element ' + (period === 'evening'
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-transparent shadow-md'
                : 'border-green-300 dark:border-green-700 hover:border-green-500 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-950/20')}
          >
            <Moon className="h-4 w-4" />
            Evening Adhkar
          </Button>
        </div>

        {/* Progress Card */}
        <Card className={'p-6 space-y-4 bg-white dark:bg-gray-800 backdrop-blur-xl border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 transition-all duration-300 ui-element ' + (allCompleted
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-500 dark:border-green-600 animate-pulse-glow shadow-lg shadow-green-500/20'
            : '')}>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-gray-700 dark:text-gray-300">Overall Progress</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {completedCount} / {totalCount}
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">{progressPercentage}% Complete</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              {allCompleted && (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 animate-float">
                  <Sparkles className="h-5 w-5" />
                  <span className="font-medium">Completed!</span>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={resetAll}
                className="gap-2 border-green-300 dark:border-green-700 hover:border-green-500 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-950/20 ui-element"
              >
                <RotateCcw className="h-4 w-4" />
                Reset All
              </Button>
            </div>
          </div>

          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-green-600 to-emerald-600 h-full rounded-full transition-all duration-500"
              style={{ width: (progressPercentage) + '%' }}
            />
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 space-y-2 bg-white dark:bg-gray-800 backdrop-blur-xl border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 hover:shadow-lg transition-all duration-300 ui-element">
            <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400 animate-float" />
            <p className="text-sm text-gray-700 dark:text-gray-300">Total Items</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{adhkar.length}</p>
          </Card>
          <Card className="p-6 space-y-2 bg-white dark:bg-gray-800 backdrop-blur-xl border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 hover:shadow-lg transition-all duration-300 ui-element">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400 animate-float" style={{ animationDelay: '0.2s' }} />
            <p className="text-sm text-gray-700 dark:text-gray-300">Completed Items</p>
            <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              {adhkar.filter(a => a.completed === a.count).length}
            </p>
          </Card>
          <Card className="p-6 space-y-2 bg-white dark:bg-gray-800 backdrop-blur-xl border-gray-200 dark:border-gray-700 hover:border-amber-300 dark:hover:border-amber-600 hover:shadow-lg transition-all duration-300 ui-element">
            <Circle className="h-8 w-8 text-amber-600 dark:text-amber-400 animate-float" style={{ animationDelay: '0.4s' }} />
            <p className="text-sm text-gray-700 dark:text-gray-300">Remaining</p>
            <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
              {totalCount - completedCount}
            </p>
          </Card>
        </div>

        {/* Adhkar List */}
        <div className="space-y-4">
          {adhkar.map((item, index) => {
          const isComplete = item.completed === item.count
          const progressPct = (item.completed / item.count) * 100

          return (
            <Card
              key={item.id}
              className={'p-6 space-y-4 transition-all duration-300 bg-white dark:bg-gray-800 backdrop-blur-xl border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 hover:shadow-lg ui-element ' + (isComplete ? 'opacity-75' : '')}
              style={{ animationDelay: (index * 50) + 'ms' }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  {/* Arabic */}
                  <p className="text-2xl font-arabic text-right leading-relaxed bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent font-bold" dir="rtl">
                    {item.arabic}
                  </p>

                  {/* Transliteration */}
                  <p className="text-lg italic text-gray-700 dark:text-gray-300">
                    {item.transliteration}
                  </p>

                  {/* Translation */}
                  <p className="text-base leading-relaxed text-gray-800 dark:text-gray-200">
                    {item.translation}
                  </p>

                  {/* Source */}
                  <p className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <span className="bg-green-100 dark:bg-green-950/30 border border-green-200 dark:border-green-800 px-3 py-1 rounded-full">Source: {item.source}</span>
                  </p>
                </div>

                <div className="flex flex-col items-center gap-2">
                  {isComplete ? (
                    <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400 animate-pulse-glow" />
                  ) : (
                    <Circle className="h-8 w-8 text-gray-400 dark:text-gray-600" />
                  )}
                </div>
              </div>

              {/* Counter */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Count: {item.completed} / {item.count}
                  </span>
                  <span className="text-sm text-green-700 dark:text-green-300">
                    {Math.round(progressPct)}%
                  </span>
                </div>

                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-green-600 to-emerald-600 h-full rounded-full transition-all duration-300"
                    style={{ width: (progressPct) + '%' }}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => decrementCount(item.id)}
                    disabled={item.completed === 0}
                    className="flex-1 border-green-300 dark:border-green-700 hover:border-green-500 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-950/20 ui-element"
                  >
                    -1
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => incrementCount(item.id)}
                    disabled={item.completed >= item.count}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md ui-element"
                  >
                    +1
                  </Button>
                  {item.count >= 10 && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        const updated = adhkar.map(a => {
                          if (a.id === item.id) {
                            return { ...a, completed: Math.min(a.count, a.completed + 10) }
                          }
                          return a
                        })
                        setAdhkar(updated)
                        saveProgress(updated)
                      }}
                      disabled={item.completed >= item.count}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md ui-element"
                    >
                      +10
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
        </div>

        {/* Completion Message */}
        {allCompleted && (
          <Card className="p-8 text-center bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-500 dark:border-green-600 animate-slide-in backdrop-blur-xl shadow-lg shadow-green-500/20 ui-element">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-green-600 dark:text-green-400 animate-pulse-glow" />
            <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Alhamdulillah! Completed!</h3>
            <p className="text-gray-700 dark:text-gray-300">
              You have completed all {period} adhkar. May Allah accept your remembrance.
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}
