import { roleTone } from '../visualIdentity.js'

export function RoleBadge({ role, children, className = '' }) {
  const tone = roleTone(role)
  return <span className={`admin-role-badge admin-role-badge--${tone} ${className}`.trim()}>{children ?? role?.name ?? 'Pulse access'}</span>
}
