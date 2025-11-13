'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { navigationItems } from './navigation-items'

interface NavigationMenuProps {
  pathname: string
  isCollapsed: boolean
}

export default function NavigationMenu({ pathname, isCollapsed }: NavigationMenuProps) {
  return (
    <nav
      aria-label="Primary"
      className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-none"
      role="navigation"
    >
      {navigationItems.map((item, index) => {
        const Icon = item.icon
        const isActive = pathname === item.path || pathname.startsWith(item.path + '/')

        return (
          <motion.div
            key={item.path}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link
              href={item.path}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.label}
              className={`
                group relative flex h-14 w-full items-center gap-4 overflow-hidden rounded-2xl transition-all duration-300
                ${isActive
                  ? `${item.gradient} text-white shadow-xl ${item.shadowActive}`
                  : `${item.bgHover} ${item.text} hover:scale-[1.02] hover:shadow-md text-slate-600 dark:text-slate-400`
                }
                ${isCollapsed ? 'px-3' : 'px-5'}
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:focus-visible:ring-emerald-400
              `}
              role="link"
            >
              {isActive && (
                <motion.div
                  layoutId="activeBackground"
                  className={`absolute inset-0 rounded-2xl opacity-20 ${item.gradient}`}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}

              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className={`
                  p-3 rounded-xl transition-all duration-300 flex-shrink-0 relative
                  ${isActive
                    ? 'bg-white/20 shadow-lg'
                    : 'bg-white/50 dark:bg-slate-800/50 group-hover:bg-white dark:group-hover:bg-slate-700 shadow-sm'
                  }
                `}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-white' : ''}`} />
                {isActive && <div className="absolute inset-0 rounded-xl bg-white/10 blur-sm" />}
              </motion.div>

              {!isCollapsed && (
                <div className="flex-1 text-left min-w-0 relative z-10">
                  <p className="font-bold text-sm truncate mb-0.5">{item.label}</p>
                  <p
                    className={`text-xs truncate font-medium ${
                      isActive ? 'text-white/90' : 'text-slate-500 dark:text-slate-400 group-hover:text-current'
                    }`}
                  >
                    {item.description}
                  </p>
                </div>
              )}

              {!isCollapsed && (
                <motion.div
                  animate={{ x: isActive ? 4 : 0, opacity: isActive ? 1 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="relative z-10"
                >
                  <ChevronRight className="h-4 w-4 text-white/90 flex-shrink-0" />
                </motion.div>
              )}
            </Link>
          </motion.div>
        )
      })}
    </nav>
  )
}
