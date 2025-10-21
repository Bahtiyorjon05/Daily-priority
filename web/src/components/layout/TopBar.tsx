'use client'

import { useState } from 'react'
import { Menu, Search, Bell, Sun, Moon, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useTheme } from '@/components/theme-provider'
import { SearchModal, NotificationsDropdown, UserDropdown } from './index'

interface TopBarProps {
  session: any
  onSidebarToggle: () => void
  isMobile: boolean
}

export default function TopBar({ session, onSidebarToggle, isMobile }: TopBarProps) {
  const { theme, systemTheme, setTheme } = useTheme()
  const [showSearch, setShowSearch] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onSidebarToggle}
              className="h-10 w-10 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Search - Hidden on mobile, shown on larger screens */}
            <div className="hidden md:block relative">
              <Button
                variant="ghost"
                onClick={() => setShowSearch(true)}
                className="w-80 justify-start bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl"
              >
                <Search className="h-4 w-4 mr-3 text-slate-500" />
                <span className="text-slate-500">Search anything...</span>
              </Button>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Mobile Search */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSearch(true)}
              className="md:hidden h-10 w-10 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Theme Toggle: cycle light → dark → system */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'
                setTheme(next)
              }}
              className="h-10 w-10 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label={`Switch theme (current: ${theme === 'system' ? `${systemTheme} (system)` : theme})`}
              title={`Switch theme (current: ${theme === 'system' ? `${systemTheme} (system)` : theme})`}
            >
              {theme === 'system' ? (
                <Monitor className="h-5 w-5" />
              ) : theme === 'light' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            {/* Notifications */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowNotifications(!showNotifications)}
                className="h-10 w-10 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 relative"
              >
                <Bell className="h-5 w-5" />
                {/* Hide notification badge for new users - in production, fetch real notification count */}
                {false && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    0
                  </span>
                )}
              </Button>
              <NotificationsDropdown
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
              />
            </div>

            {/* User Avatar */}
            <div className="relative">
              <Button
                variant="ghost"
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="h-10 w-10 rounded-lg p-0"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={session?.user?.image || ''} />
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-sm font-semibold">
                    {session?.user?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
              <UserDropdown
                isOpen={showUserDropdown}
                onClose={() => setShowUserDropdown(false)}
                session={session}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Search Modal */}
      <SearchModal
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
      />
    </>
  )
}
