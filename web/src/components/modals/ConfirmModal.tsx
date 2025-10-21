/**
 * ConfirmModal Component
 * Confirmation dialog for destructive actions
 */

'use client'

import { memo } from 'react'
import { AlertTriangle, Info, Loader2 } from 'lucide-react'
import Modal from './Modal'
import { Button } from '@/components/ui/button'
import type { ConfirmModalProps } from '@/types/components'
import { cn } from '@/lib/utils'

const ConfirmModal = memo<ConfirmModalProps>(({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) => {
  const variantConfig = {
    danger: {
      icon: AlertTriangle,
      iconBg: 'bg-red-100 dark:bg-red-950/30',
      iconColor: 'text-red-600 dark:text-red-400',
      buttonVariant: 'destructive' as const,
    },
    warning: {
      icon: AlertTriangle,
      iconBg: 'bg-amber-100 dark:bg-amber-950/30',
      iconColor: 'text-amber-600 dark:text-amber-400',
      buttonVariant: 'default' as const,
    },
    info: {
      icon: Info,
      iconBg: 'bg-blue-100 dark:bg-blue-950/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
      buttonVariant: 'default' as const,
    },
  }

  const config = variantConfig[variant]
  const Icon = config.icon

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" showCloseButton={false}>
      <div className="space-y-6">
        {/* Icon */}
        <div className={cn('h-12 w-12 rounded-full flex items-center justify-center', config.iconBg)}>
          <Icon className={cn('h-6 w-6', config.iconColor)} />
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            {cancelText}
          </Button>
          <Button
            variant={config.buttonVariant}
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  )
})

ConfirmModal.displayName = 'ConfirmModal'

export default ConfirmModal
