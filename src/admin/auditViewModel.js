const ACTION_LABELS = Object.freeze({
  'account.pending_created': 'Registration created',
  'account.approved': 'Account approved',
  'account.blocked': 'Account blocked',
  'account.reactivated': 'Account reactivated',
  'account.inactivated': 'Account inactivated',
  'role.assigned': 'Role assigned',
  'role.removed': 'Role removed',
  'department.created': 'Department created',
  'department.updated': 'Department updated',
  'department.deactivated': 'Department deactivated',
  'department.reactivated': 'Department reactivated',
  'team.created': 'Team created',
  'team.updated': 'Team updated',
  'team.deactivated': 'Team deactivated',
  'team.reactivated': 'Team reactivated',
})

export const AUDIT_CATEGORIES = Object.freeze([
  { value: '', label: 'All categories' },
  { value: 'account', label: 'Accounts' },
  { value: 'roles', label: 'Roles' },
  { value: 'organization', label: 'Organization' },
  { value: 'system', label: 'System' },
])

export function auditActionLabel(action = '') {
  return ACTION_LABELS[action] || action.split(/[._]/).filter(Boolean).map((part) => part[0]?.toUpperCase() + part.slice(1)).join(' ') || 'Audit event'
}

export function auditSummary(event = {}) {
  const actor = event.actor?.name || 'Pulse system'
  const target = event.target?.name || 'a protected record'
  return `${actor} · ${auditActionLabel(event.action)} · ${target}`
}

export function formatAuditTime(value) {
  if (!value || Number.isNaN(Date.parse(value))) return 'Time unavailable'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}
