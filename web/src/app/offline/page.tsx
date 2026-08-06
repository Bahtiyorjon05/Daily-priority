'use client'

import { useT } from '@/lib/i18n/client'
import { WifiOff, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function OfflinePage() {
  const { t } = useT()
  const handleRetry = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="text-center space-y-6 max-w-md px-4">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="p-6 bg-slate-200 dark:bg-slate-800 rounded-full">
            <WifiOff className="h-16 w-16 text-slate-600 dark:text-slate-400" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          {t('ui.youReOffline')}
        </h1>

        {/* Description */}
        <p className="text-lg text-slate-600 dark:text-slate-400">
          It looks like you've lost your internet connection. Don't worry, your
          data is safe and will sync when you're back online.
        </p>

        {/* Features available offline */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 text-left">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">
            {t('ui.availableOffline')}
          </h2>
          <ul className="space-y-2 text-slate-600 dark:text-slate-400">
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span>{t('ui.viewCachedTasksAndGoals')}</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span>{t('ui.createNewTasksWillSyncLater')}</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span>{t('ui.useFocusTimer')}</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span>{t('ui.readJournalEntries')}</span>
            </li>
          </ul>
        </div>

        {/* Retry button */}
        <Button onClick={handleRetry} size="lg" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          {t('ui.tryAgain')}
        </Button>

        {/* Additional info */}
        <p className="text-sm text-slate-500 dark:text-slate-500">
          {t('ui.changesYouMakeOfflineWillAutomaticallySyncWh')}
        </p>
      </div>
    </div>
  )
}
