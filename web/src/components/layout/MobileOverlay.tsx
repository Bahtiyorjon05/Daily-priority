'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface MobileOverlayProps {
  isVisible: boolean
  onClose: () => void
}

export default function MobileOverlay({ isVisible, onClose }: MobileOverlayProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}
    </AnimatePresence>
  )
}
