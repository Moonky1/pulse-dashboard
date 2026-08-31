import { roleScopeLabel } from '../adminViewModel.js'

export function RoleScopeList({ roles = [], directory, compact = false }) {
  if (!roles.length) return <span className="admin-muted">No role assigned</span>
  return (
    <ul className={`admin-role-list ${compact ? 'admin-role-list--compact' : ''}`}>
      {roles.map((role) => (
        <li key={role.userRoleId || `${role.roleId}-${role.scopeType}-${role.departmentId || role.campaignId || role.teamId || 'global'}`}>
          <strong>{role.name}</strong><span>{roleScopeLabel(role, directory)}</span>
        </li>
      ))}
    </ul>
  )
}
