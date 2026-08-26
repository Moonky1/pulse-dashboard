import { Badge } from '../../components/ui/Badge.jsx'
import { lifecycleMeta } from '../adminViewModel.js'

export function LifecycleBadge({ status }) {
  const meta = lifecycleMeta(status)
  return <Badge tone={meta.tone} dot><span>{meta.label}</span></Badge>
}
