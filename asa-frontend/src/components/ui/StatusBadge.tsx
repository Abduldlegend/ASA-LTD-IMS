import { Badge } from './Badge'
import { STATUS_MAP, type StatusGroup } from './status'

interface StatusBadgeProps {
  group: StatusGroup
  status: string
}

export function StatusBadge({ group, status }: StatusBadgeProps) {
  const entry = STATUS_MAP[group][status]
  return <Badge tone={entry?.tone ?? 'neutral'}>{entry?.label ?? status}</Badge>
}
