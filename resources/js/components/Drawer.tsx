import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react'
import { X } from 'lucide-react'
import { Fragment, ReactNode } from 'react'
import clsx from 'clsx'

export interface DrawerProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl'
  placement?: 'left' | 'right'
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
  footer?: ReactNode
  className?: string
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
}

export default function Drawer({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  placement = 'right',
  showCloseButton = true,
  closeOnOverlayClick = true,
  footer,
  className,
}: DrawerProps) {
  const isRight = placement === 'right'

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-50"
        onClose={closeOnOverlayClick ? onClose : () => {}}
      >
        {/* Backdrop */}
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
        </TransitionChild>

        {/* Panel container */}
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div
              className={clsx(
                "pointer-events-none fixed inset-y-0 flex max-w-full",
                isRight ? "right-0 pl-10" : "left-0 pr-10"
              )}
            >
              <TransitionChild
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom={isRight ? "translate-x-full" : "-translate-x-full"}
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo={isRight ? "translate-x-full" : "-translate-x-full"}
              >
                <DialogPanel
                  className={clsx(
                    "pointer-events-auto w-screen",
                    sizeClasses[size],
                    className
                  )}
                >
                  <div className="flex h-full flex-col bg-card shadow-xl">
                    {/* Header */}
                    {(title || showCloseButton) && (
                      <div className="flex items-center justify-between px-6 py-4 border-b border-default-200">
                        {title && (
                          <DialogTitle className="text-lg font-semibold text-default-800">
                            {title}
                          </DialogTitle>
                        )}
                        {showCloseButton && (
                          <button
                            type="button"
                            className="inline-flex items-center justify-center size-8 rounded-lg text-default-500 hover:bg-default-100 hover:text-default-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
                            onClick={onClose}
                            aria-label="Close drawer"
                          >
                            <X className="size-5" />
                          </button>
                        )}
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-6 py-4">
                      {children}
                    </div>

                    {/* Footer */}
                    {footer && (
                      <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-default-200">
                        {footer}
                      </div>
                    )}
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

