import { Hammer } from 'lucide-react'
import { Card, EmptyState, PageHeader } from '@/components/ui'

interface ModulePlaceholderPageProps {
    title: string
    description: string
}

/** Stand-in for modules that are built in later stages. */
export function ModulePlaceholderPage({ title, description }: ModulePlaceholderPageProps) {
    return (
        <>
            <PageHeader title={title} description={description} />
            <Card>
                <EmptyState icon={Hammer} title={`${title} is coming soon`} description="This screen is built in a later stage of the plan." />
            </Card>
        </>
    )
}