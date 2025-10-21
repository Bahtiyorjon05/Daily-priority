'use client'

import { useEffect, useRef } from 'react'

export default function SkipToContent() {
  const skipLinkRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (skipLinkRef.current) {
          skipLinkRef.current.classList.remove('sr-only')
          skipLinkRef.current.classList.add('fixed', 'top-4', 'left-4', 'z-50', 'bg-white', 'dark:bg-gray-800', 'px-4', 'py-2', 'rounded', 'shadow-lg', 'border', 'border-gray-200', 'dark:border-gray-700')
        }
      }
    }

    const handleBlur = () => {
      if (skipLinkRef.current) {
        skipLinkRef.current.classList.add('sr-only')
        skipLinkRef.current.classList.remove('fixed', 'top-4', 'left-4', 'z-50', 'bg-white', 'dark:bg-gray-800', 'px-4', 'py-2', 'rounded', 'shadow-lg', 'border', 'border-gray-200', 'dark:border-gray-700')
      }
    }

    window.addEventListener('keydown', handleTabKey)
    window.addEventListener('blur', handleBlur)
    
    return () => {
      window.removeEventListener('keydown', handleTabKey)
      window.removeEventListener('blur', handleBlur)
    }
  }, [])

  const skipToMainContent = () => {
    const mainContent = document.querySelector('main')
    if (mainContent) {
      mainContent.setAttribute('tabindex', '-1')
      mainContent.focus()
      mainContent.removeAttribute('tabindex')
    }
  }

  return (
    <a
      ref={skipLinkRef}
      href="#main-content"
      onClick={(e) => {
        e.preventDefault()
        skipToMainContent()
      }}
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:dark:bg-gray-800 focus:px-4 focus:py-2 focus:rounded focus:shadow-lg focus:border focus:border-gray-200 focus:dark:border-gray-700"
    >
      Skip to main content
    </a>
  )
}