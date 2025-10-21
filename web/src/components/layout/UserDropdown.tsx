'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { User, Settings, LogOut, Shield } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { signOut } from 'next-auth/react'

interface UserDropdownProps {
  isOpen: boolean
  onClose: () => void
  session: any
}

const menuItems = [
  { icon: User, label: 'Profile Settings', action: () => {} },
  { icon: Settings, label: 'Preferences', action: () => {} },
  { icon: Shield, label: 'Privacy & Security', action: () => {} }
]

export default function UserDropdown({ isOpen, onClose, session }: UserDropdownProps) {
  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden"
        >
          {/* User Info Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 ring-2 ring-emerald-200 dark:ring-emerald-800">
                <AvatarImage src={session?.user?.image || ''} />
                <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-semibold">
                  {session?.user?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {session?.user?.name || 'User'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {session?.user?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            {menuItems.map((item, index) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Button
                    variant="ghost"
                    onClick={() => {
                      item.action()
                      onClose()
                    }}
                    className="w-full justify-start px-3 py-2.5 h-auto hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors">
                        <Icon className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                      </div>
                      <span className="font-medium text-sm">{item.label}</span>
                    </div>
                  </Button>
                </motion.div>
              )
            })}
          </div>

          {/* Sign Out */}
          <div className="p-2 border-t border-slate-200 dark:border-slate-700">
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="w-full justify-start px-3 py-2.5 h-auto hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 group-hover:bg-red-200 dark:group-hover:bg-red-800/50 transition-colors">
                  <LogOut className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                </div>
                <span className="font-medium text-sm">Sign Out</span>
              </div>
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
