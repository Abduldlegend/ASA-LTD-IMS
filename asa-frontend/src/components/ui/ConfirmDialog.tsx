import type { ReactNode } from 'react'
import { Button } from './Button'
import { Modal } from './Modal'

interface ConfirmDialogProps {
    open: boolean
    title: string
    /** Say what will happen and, for risky actions, what cannot be undone. */
    children: ReactNode
    confirmLabel: string
    /** `danger` for anything that removes or blocks something. */
    tone?: 'primary' | 'danger'
    loading?: boolean
    onConfirm: () => void
    onCancel: () => void
}

/** "Are you sure?" for actions that change records. For risky ones the focus starts on Cancel. */
export function ConfirmDialog({ open, title, children, confirmLabel, tone = 'primary', loading, onConfirm, onCancel }: ConfirmDialogProps) {
    return (
        <Modal
            open={open}
            onClose={loading ? () => { } : onCancel}
            title={title}
            size="sm"
            closeOnBackdrop={!loading}
            footer={
                <>
                    <Button variant="outline" onClick={onCancel} disabled={loading} data-autofocus={tone === 'danger' ? '' : undefined}>
                        Cancel
                    </Button>
                    <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} loading={loading} data-autofocus={tone === 'danger' ? undefined : ''}>
                        {confirmLabel}
                    </Button>
                </>
            }
        >
            <div className="text-sm text-ink-700">{children}</div>
        </Modal>
    )
}