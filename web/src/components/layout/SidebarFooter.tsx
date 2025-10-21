'use client'

interface SidebarFooterProps {
  isCollapsed: boolean
}

export default function SidebarFooter({ isCollapsed }: SidebarFooterProps) {
  if (isCollapsed) {
    return (
      <div className="p-3 border-t border-slate-200/50 dark:border-slate-700/50">
        <div className="flex justify-center">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 border-t border-slate-200/50 dark:border-slate-700/50">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border border-emerald-200/50 dark:border-emerald-800/50">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
            Daily Priority v1.0
          </p>
        </div>
      </div>
    </div>
  )
}
