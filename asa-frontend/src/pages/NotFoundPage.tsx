import { Link } from 'react-router-dom'
import { Button } from '@/components/ui'

export function NotFoundPage() {
    return (
        <div className="mx-auto max-w-md py-24 text-center">
            <p className="text-sm font-medium text-text-muted">Error 404</p>
            <h1 className="mt-2 text-3xl">Page not found</h1>
            <p className="mt-2 text-text-muted">The page you are looking for does not exist or has moved.</p>
            <Link to="/dashboard" className="mt-6 inline-block">
                <Button>Go to dashboard</Button>
            </Link>
        </div>
    )
}