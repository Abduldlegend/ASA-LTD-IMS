import { X } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/cn'

interface ModalProps {
    open: boolean
    onClose: () => void
    title: string
    description?: string
    children: ReactNode
    /** Buttons along the bottom edge. */
    footer?: ReactNode
    size?: 'sm' | 'md' | 'lg'
    /** Whether clicking the dark area outside closes it. Turn off while a form has unsaved changes. */
    closeOnBackdrop?: boolean
}

const FOCUSABLE =
    'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

const widths = { sm: 'sm:max-w-sm', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl' }

/**
 * A dialog that traps the keyboard focus, closes on Escape, locks the page behind it from scrolling,
 * and gives focus back to what opened it. On a phone it slides up from the bottom edge.
 */
export function Modal({ open, onClose, title, description, children, footer, size = 'md', closeOnBackdrop = true }: ModalProps) {
    const titleId = useId()
    const descriptionId = useId()
    const dialogRef = useRef<HTMLDivElement>(null)
    // The latest onClose, so the effects below do not restart every time the parent re-renders.
    const onCloseRef = useRef(onClose)
    useEffect(() => {
        onCloseRef.current = onClose
    })

    useEffect(() => {
        if (!open) return
        const opener = document.activeElement as HTMLElement | null
        const dialog = dialogRef.current!
        const first = dialog.querySelector<HTMLElement>('[data-autofocus]') ?? dialog.querySelector<HTMLElement>('input,select,textarea')
            ; (first ?? dialog).focus()

        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.stopPropagation()
                onCloseRef.current()
                return
            }
            if (e.key !== 'Tab') return
            const items = [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)]
            if (items.length === 0) {
                e.preventDefault()
                return
            }
            const firstItem = items[0]
            const lastItem = items[items.length - 1]
            if (e.shiftKey && (document.activeElement === firstItem || document.activeElement === dialog)) {
                e.preventDefault()
                lastItem.focus()
            } else if (!e.shiftKey && document.activeElement === lastItem) {
                e.preventDefault()
                firstItem.focus()
            }
        }
        document.addEventListener('keydown', onKeyDown)

        return () => {
            document.removeEventListener('keydown', onKeyDown)
            document.body.style.overflow = previousOverflow
            opener?.focus?.()
        }
    }, [open])

    if (!open) return null

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/50 sm:items-center sm:p-4"
            onMouseDown={(e) => {
                if (closeOnBackdrop && e.target === e.currentTarget) onClose()
            }}
        >
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={description ? descriptionId : undefined}
                tabIndex={-1}
                className={cn(
                    'flex max-h-[92vh] w-full flex-col rounded-t-lg bg-surface shadow-pop outline-none sm:max-h-[88vh] sm:rounded-lg',
                    widths[size],
                )}
            >
                <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
                    <div>
                        <h2 id={titleId} className="text-lg">
                            {title}
                        </h2>
                        {description && (
                            <p id={descriptionId} className="mt-0.5 text-sm text-text-muted">
                                {description}
                            </p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="-mt-1 -mr-2 grid size-9 shrink-0 place-items-center rounded-md text-ink-500 hover:bg-ink-100 hover:text-ink-900"
                    >
                        <X className="size-5" aria-hidden />
                    </button>
                </div>
                <div className="overflow-y-auto px-5 py-5">{children}</div>
                {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-border px-5 py-3">{footer}</div>}
            </div>
        </div>,
        document.body,
    )
}