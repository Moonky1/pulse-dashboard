export const ORGANIZATION_ENTITY_TYPES = Object.freeze(['department', 'team'])

export function organizationEntityLabel(entityType) {
  return entityType === 'team' ? 'team' : 'department'
}

export function normalizeOrganizationForm({ code = '', name = '', description = '' } = {}) {
  return {
    code: String(code).trim().toLowerCase(),
    name: String(name).trim(),
    description: String(description).trim(),
  }
}

export function validateOrganizationForm(values = {}) {
  const normalized = normalizeOrganizationForm(values)
  if (!/^[a-z][a-z0-9_]{1,31}$/.test(normalized.code)) {
    return { values: normalized, error: 'Use 2–32 lowercase letters, numbers, or underscores for the code.' }
  }
  if (normalized.name.length < 2 || normalized.name.length > 120) {
    return { values: normalized, error: 'Name must contain between 2 and 120 characters.' }
  }
  if (normalized.description.length > 500) {
    return { values: normalized, error: 'Description must be 500 characters or fewer.' }
  }
  return { values: normalized, error: null }
}

export function organizationMutationMessage(action, entityType, result = {}) {
  const label = organizationEntityLabel(entityType)
  if (result.changed === false || result.created === false) {
    return `No change was needed. The ${label} already matches the server record.`
  }
  const verbs = {
    create: 'created',
    update: 'updated',
    deactivate: 'deactivated',
    reactivate: 'reactivated',
  }
  return `${label[0].toUpperCase()}${label.slice(1)} ${verbs[action] ?? 'updated'}. The canonical catalog has been refreshed.`
}

export function organizationStatusConsequence(entityType, active) {
  if (active) {
    return entityType === 'team'
      ? 'The team can be used again only while its parent department remains active.'
      : 'The department can be used again for teams, users, and scoped access.'
  }
  if (entityType === 'team') {
    return `Pulse will reject deactivation if active users or active scoped roles still depend on this team. Historical links remain intact.`
  }
  return `Pulse will reject deactivation if active teams, active users, or active scoped roles still depend on this department. Historical links remain intact.`
}

export function filterOrganizationItems(items = [], query = '', departmentId = '') {
  const needle = String(query).trim().toLocaleLowerCase()
  return items.filter((item) => {
    const identity = [item.name, item.code, item.description, item.departmentName].filter(Boolean).join(' ').toLocaleLowerCase()
    return (!needle || identity.includes(needle)) && (!departmentId || item.departmentId === departmentId)
  })
}

export function shouldCancelOrganizationDialogOnKey(key, submitting = false) {
  return key === 'Escape' && !submitting
}
