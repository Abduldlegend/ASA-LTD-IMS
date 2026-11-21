import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '@/components/ui'

interface Props {
    children: ReactNode
    /** When this value changes the boundary clears its error, for example on navigating to another page. */
    resetKey?: string
    /** Fill the whole screen (top level) or just the content area (inside the app shell). */
    fullScreen?: boolean
}

interface State {
    failed: boolean
    resetKey?: string
}

export class ErrorBoundary extends Component<Props, State> {
    state: State = { failed: false, resetKey: this.props.resetKey }

    static getDerivedStateFromError(): Partial<State> {
        return { failed: true }
    }

    // Moving to another page clears the error, so one broken screen does not block the rest.
    static getDerivedStateFromProps(props: Props, state: State): State | null {
        return props.resetKey !== state.resetKey ? { failed: false, resetKey: props.resetKey } : null
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('Screen crashed:', error, info.componentStack)
    }

    render() {
        if (!this.state.failed) return this.props.children
        return (
            <div role="alert" className={this.props.fullScreen ? 'grid min-h-screen place-items-center px-6' : 'py-20'}>
                <div className="mx-auto max-w-md text-center">
                    <h1 className="text-2xl">Something went wrong</h1>
                    <p className="mt-2 text-text-muted">
                        This screen stopped working. Your records are safe. Reload the page, and if it keeps happening, tell your administrator what you were doing.
                    </p>
                    <Button className="mt-6" onClick={() => window.location.reload()}>
                        Reload the page
                    </Button>
                </div>
            </div>
        )
    }
}