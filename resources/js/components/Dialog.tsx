import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { X } from 'lucide-react'
import { ReactNode } from 'react'
import clsx from 'clsx'

export interface DialogProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
  footer?: ReactNode
  className?: string
  panelClassName?: string
  titleClassName?: string
  contentClassName?: string
}

export interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  confirmVariant?: 'primary' | 'danger' | 'success' | 'warning'
  isLoading?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-full mx-4',
}

const buttonVariants = {
  primary: 'btn bg-primary text-white hover:bg-primary/90',
  danger: 'btn bg-danger text-white hover:bg-danger/90',
  success: 'btn bg-success text-white hover:bg-success/90',
  warning: 'btn bg-warning text-white hover:bg-warning/90',
}

export default function DialogComponent({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  footer,
  className,
  panelClassName,
  titleClassName,
  contentClassName,
}: DialogProps) {
  return (
    <Dialog 
      open={isOpen} 
      as="div" 
      className={clsx("relative z-50 focus:outline-none", className)} 
      onClose={closeOnOverlayClick ? onClose : () => {}}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />

      {/* Full-screen container to center the panel */}
      <div className="fixed inset-0 z-50 w-screen overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <DialogPanel
            transition
            className={clsx(
              "w-full rounded-lg bg-card shadow-xl duration-300 ease-out",
              "data-closed:transform-[scale(95%)] data-closed:opacity-0",
              sizeClasses[size],
              panelClassName
            )}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-default-200">
                {title && (
                  <DialogTitle 
                    as="h3" 
                    className={clsx(
                      "text-lg font-semibold text-default-800",
                      titleClassName
                    )}
                  >
                    {title}
                  </DialogTitle>
                )}
                {showCloseButton && (
                  <button
                    type="button"
                    className="inline-flex items-center justify-center size-8 rounded-lg text-default-500 hover:bg-default-100 hover:text-default-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
                    onClick={onClose}
                    aria-label="Close dialog"
                  >
                    <X className="size-5" />
                  </button>
                )}
              </div>
            )}

            {/* Content */}
            <div 
              className={clsx(
                "px-6 py-4",
                contentClassName
              )}
            >
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-default-200">
                {footer}
              </div>
            )}
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  )
}

export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  isLoading = false,
  size = 'sm',
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    if (!isLoading) {
      onConfirm()
    }
  }

  const handleCancel = () => {
    if (!isLoading) {
      onOpenChange(false)
    }
  }

  return (
    <DialogComponent
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title={title}
      size={size}
      showCloseButton={false}
      closeOnOverlayClick={!isLoading}
      footer={
        <>
          <button
            type="button"
            className="btn bg-transparent border border-default-300 text-default-700 hover:bg-default-100"
            onClick={handleCancel}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={clsx(
              buttonVariants[confirmVariant],
              isLoading && 'opacity-75 cursor-not-allowed'
            )}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              confirmText
            )}
          </button>
        </>
      }
    >
      <p className="text-sm text-default-600">{description}</p>
    </DialogComponent>
  )
}
