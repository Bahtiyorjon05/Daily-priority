'use client'

import { motion } from 'framer-motion'
import { Flame, Calendar } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { useDailyQuote } from '@/hooks/useDailyQuote'
import { useUserStats } from '@/hooks/use-user-stats'

interface WelcomeSectionProps {
  session: any
}

const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 17) return 'Good Afternoon'
  return 'Good Evening'
}

const getTodayDate = () => {
  const today = new Date()
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }
  return today.toLocaleDateString('en-US', options)
}

export default function WelcomeSection({ session }: WelcomeSectionProps) {
  const { quote, loading: quoteLoading } = useDailyQuote()
  const { stats, loading: statsLoading } = useUserStats()

  const displayName = (session?.user?.name || 'User').trim()
  const showArabic = quote?.arabic && /[\u0600-\u06FF]/.test(quote.arabic)

  return (
    <Card className="border-none shadow-lg bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 text-white overflow-hidden relative">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
      </div>

      <CardContent className="p-6 sm:p-8 relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Left Section */}
          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-4 mb-6"
            >
              <Avatar className="h-16 w-16 border-2 border-white/30 shadow-xl">
                <AvatarImage src={session?.user?.image || ''} />
                <AvatarFallback className="bg-white/20 text-white text-xl font-bold">
                  {displayName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold mb-1">
                  {getGreeting()}, {displayName}!
                </h1>
                <div className="flex items-center gap-2 text-white/90">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">{getTodayDate()}</span>
                </div>
              </div>
            </motion.div>

            {/* Daily Quote */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/15 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/20 max-w-full lg:max-w-2xl"
            >
              {quoteLoading ? (
                <div className="animate-pulse">
                  <div className="h-6 bg-white/20 rounded-lg mb-3" />
                  <div className="h-4 bg-white/10 rounded w-3/4" />
                </div>
              ) : (
                <>
                  <p className="text-white/95 text-base sm:text-lg font-medium italic leading-relaxed mb-3">
                    "{quote?.text || 'And whoever relies upon Allah - then He is sufficient for him.'}"
                  </p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="px-3 py-1 rounded-full bg-emerald-500/30 text-emerald-100 text-xs font-medium">
                      {quote?.category || 'Quran'}
                    </div>
                    <p className="text-white/80 text-sm font-medium">
                      — {quote?.source || 'Quran 65:3'}
                    </p>
                  </div>
                  {showArabic && (
                    <p className="text-white/80 text-right mt-3 text-lg">
                      {quote?.arabic}
                    </p>
                  )}
                </>
              )}
            </motion.div>
          </div>

          {/* Right Section - Streak */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white/20 backdrop-blur-md rounded-2xl p-4 sm:p-6 text-center border border-white/30 lg:min-w-[160px] w-full sm:w-auto"
          >
            {statsLoading ? (
              <div className="animate-pulse">
                <div className="w-16 h-16 bg-white/20 rounded-full mx-auto mb-3" />
                <div className="h-4 bg-white/20 rounded mb-2" />
                <div className="h-3 bg-white/10 rounded w-20 mx-auto" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-center gap-3 mb-3">
                  <Flame className="h-6 sm:h-8 w-6 sm:w-8 text-orange-300" />
                  <span className="text-3xl sm:text-4xl font-bold">{stats?.currentStreak || 0}</span>
                </div>
                <p className="text-white/90 text-sm font-medium">Day Streak</p>
                <p className="text-white/70 text-xs mt-1">
                  {stats?.currentStreak && stats.currentStreak > 0 ? 'Keep it up!' : 'Start your journey!'}
                </p>
              </>
            )}
          </motion.div>
        </div>
      </CardContent>
    </Card>
  )
}
