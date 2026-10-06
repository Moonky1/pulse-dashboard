import { useEffect, useState } from 'react'
import { supabase } from '../../utils/supabase.js'
import { loadAdminRoleCatalog } from '../api/admin2Api.js'

const areas = { users: 'People', staff_work: 'People', roles: 'Access', agents: 'Agents', training: 'Studio and GO', studio: 'Studio', go: 'GO', organization: 'Organization', departments: 'Organization', teams: 'Organization', positions: 'Organization', admin: 'Administration', audit: 'Activity' }
function permissionGroups(permissions) {
  const grouped = new Map()
  for (const permission of permissions) {
    const area = areas[permission.key.split('.')[0]] || 'Pulse'
    grouped.set(area, [...(grouped.get(area) || []), permission])
  }
  return [...grouped.entries()]
}

export function RolePermissions({ roles = [] }) {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState({ data: null, error: null })
  useEffect(() => {
    if (!open) return undefined
    let active = true
    void loadAdminRoleCatalog(supabase).then(result => { if (active) setState(result) })
    return () => { active = false }
  }, [open])
  const assigned = new Set(roles.map(role => role.roleId))
  return <details className="admin-permissions-disclosure" onToggle={event => setOpen(event.currentTarget.open)}>
    <summary>View permissions</summary>
    {open && !state.data && !state.error && <p role="status">Loading role permissions…</p>}
    {state.error && <p role="alert">{state.error.message}</p>}
    {open && state.data?.filter(role => assigned.has(role.id)).map(role => <section key={role.id}>
      <h3>{role.name}</h3><p>{role.description}</p>
      {permissionGroups(role.permissions).map(([area, permissions]) => <div key={area}><h4>{area}</h4><ul>{permissions.map(permission => <li key={permission.key}>{permission.description}</li>)}</ul></div>)}
    </section>)}
    {open && !roles.length && <p>No Pulse access assigned.</p>}
    {open && state.data && <details className="admin-role-catalog"><summary>Explore Pulse roles</summary>
      {state.data.map(role => <details key={role.id}><summary>{role.name}</summary><p>{role.description}</p>
        {permissionGroups(role.permissions).map(([area, permissions]) => <div key={area}><h4>{area}</h4><ul>{permissions.map(permission => <li key={permission.key}>{permission.description}</li>)}</ul></div>)}
      </details>)}
    </details>}
  </details>
}
