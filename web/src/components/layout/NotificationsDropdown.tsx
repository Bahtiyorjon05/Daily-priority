'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Check, X, Target, Clock, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSession } from 'next-auth/react'

interface NotificationsDropdownProps {
  isOpen: boolean
  onClose: () => void
}

interface Notification {
  id: string
  type: string
  title: string
  message: string
  time: string
  read: boolean
}

export default function NotificationsDropdown({ isOpen, onClose }: NotificationsDropdownProps) {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch real notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!session?.user) return
      
      try {
        setLoading(true)
        // For now, show empty state for new users
        // In production, you'd call: const response = await fetch('/api/notifications')
        setNotifications([])
      } catch (error) {
        console.error('Failed to fetch notifications:', error)
        setNotifications([])
      } finally {
        setLoading(false)
      }
    }

    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen, session])
  const getIcon = (type: string) => {
    switch (type) {
      case 'task': return Target
      case 'prayer': return Clock
      default: return Bell
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Notifications</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-6 w-6"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"
                />
                <p className="text-slate-500">Loading notifications...</p>
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((notification) => {
                const IconComponent = getIcon(notification.type)
                return (
                  <motion.div
                    key={notification.id}
                    whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.02)' }}
                    className={`p-4 border-b border-slate-100 dark:border-slate-800 cursor-pointer transition-colors ${
                      !notification.read ? 'bg-emerald-50/30 dark:bg-emerald-950/20' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full ${
                        notification.type === 'task' ? 'bg-blue-100 dark:bg-blue-900/30' :
                        notification.type === 'prayer' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                        'bg-purple-100 dark:bg-purple-900/30'
                      }`}>
                        <IconComponent className={`h-4 w-4 ${
                          notification.type === 'task' ? 'text-blue-600 dark:text-blue-400' :
                          notification.type === 'prayer' ? 'text-emerald-600 dark:text-emerald-400' :
                          'text-purple-600 dark:text-purple-400'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${
                          !notification.read ? 'text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'
                        }`}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {notification.time}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-emerald-500 rounded-full mt-1"></div>
                      )}
                    </div>
                  </motion.div>
                )
              })
            ) : (
              <div className="p-12 text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center mx-auto mb-4">
                    <Bell className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">All caught up!</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">You have no new notifications</p>
                </motion.div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
            >
              <Check className="h-4 w-4 mr-2" />
              Mark all as read
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
