import { Card, Skeleton } from '@/components/ui'

export function DashboardSkeleton() {
    return (
        <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
            <div className="grid gap-4 sm:grid-cols-3">
                {[0, 1, 2].map((i) => (
                    <Card key={i} className="space-y-3 p-5">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-8 w-40" />
                        <Skeleton className="h-3 w-16" />
                    </Card>
                ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[0, 1, 2, 3].map((i) => (
                    <Card key={i} className="space-y-3 p-5">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-7 w-32" />
                    </Card>
                ))}
            </div>
            <Skeleton className="h-80 w-full" />
        </div>
    )
}