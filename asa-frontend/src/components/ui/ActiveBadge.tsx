import { Badge } from './Badge'

/** "Active" or "Inactive" for anything that can be switched off without being deleted. */
export function ActiveBadge({ active }: { active: boolean }) {
    return <Badge tone={active ? 'success' : 'neutral'}>{active ? 'Active' : 'Inactive'}</Badge>
}