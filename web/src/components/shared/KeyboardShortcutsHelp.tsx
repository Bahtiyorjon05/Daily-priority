'use client'

import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Keyboard, X } from 'lucide-react'
import { SHORTCUTS_HELP, formatShortcut } from '@/hooks/useKeyboardShortcuts'

export function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false)

  // Listen for ? key to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && e.shiftKey) {
        e.preventDefault()
        setIsOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <>
      {/* Help button */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        title="Keyboard shortcuts (?)"
      >
        <Keyboard className="h-5 w-5" />
      </button>

      {/* Help modal */}
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-xl bg-white dark:bg-slate-900 shadow-2xl transition-all">
                  {/* Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <Keyboard className="h-6 w-6 text-blue-600" />
                      <Dialog.Title className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                        Keyboard Shortcuts
                      </Dialog.Title>
                    </div>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="px-6 py-4 space-y-6 max-h-[70vh] overflow-y-auto">
                    {SHORTCUTS_HELP.map((section) => (
                      <div key={section.category}>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
                          {section.category}
                        </h3>
                        <div className="space-y-2">
                          {section.shortcuts.map((shortcut, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                            >
                              <span className="text-sm text-slate-700 dark:text-slate-300">
                                {shortcut.description}
                              </span>
                              <kbd className="inline-flex items-center gap-1 px-3 py-1.5 font-mono text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm">
                                {formatShortcut(shortcut)}
                              </kbd>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
                      Press <kbd className="px-2 py-1 font-mono text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded">Shift</kbd> + <kbd className="px-2 py-1 font-mono text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded">?</kbd> anytime to view shortcuts
                    </p>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  )
}
