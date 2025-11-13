import { Suspense } from 'react'
import SetPasswordClient from './SetPasswordClient'

function SetPasswordFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300">
      Loading set password experience...
    </div>
  )
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={<SetPasswordFallback />}>
      <SetPasswordClient />
    </Suspense>
  )
}
