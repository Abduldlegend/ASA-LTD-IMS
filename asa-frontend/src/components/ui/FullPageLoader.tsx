import { Loader2 } from 'lucide-react'

export function FullPageLoader({ label = 'Loading' }: { label?: string }) {
    return (
        <div role="status" className="grid min-h-screen place-items-center bg-canvas">
            <div className="flex flex-col items-center gap-4">
                <span className="grid size-11 place-items-center rounded-md bg-ink-900 text-xl font-extrabold text-brand-400">A</span>
                <Loader2 className="size-5 animate-spin text-ink-500" aria-hidden />
                <span className="sr-only">{label}</span>
            </div>
        </div>
    )
}