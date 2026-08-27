import { useRef, useState } from 'react'

import { Button } from '../../components/ui/Button.jsx'
import { supabase } from '../../utils/supabase.js'
import { assignManagedUserRole, removeManagedUserRole } from '../api/adminApi.js'
import { roleCatalogMessage, roleMutationSuccessMessage } from '../roleActions.js'
import { runRoleMutation } from '../roleMutation.js'
import { RoleActionDialog } from './RoleActionDialog.jsx'

export function RoleAdministration({ user, directory, roleOptions, roleOptionsError, loading, allowed, onChanged }) {
  const guard = useRef(false)
  const [selected, setSelected] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)

  if (!allowed) return null
  const catalogMessage = roleCatalogMessage({ loading, error: roleOptionsError, options: roleOptions })
  const assignmentAvailable = !catalogMessage
  const openAssignment = () => { setError(null); setNotice(null); setSelected({ type: 'assign' }) }
  const openRemoval = (assignment) => { setError(null); setNotice(null); setSelected({ type: 'remove', assignment }) }
  const cancel = () => { setError(null); setSelected(null) }
  const confirm = async ({ type, request, role, assignment }) => {
    setSubmitting(true)
    setError(null)
    const result = await runRoleMutation({
      guard,
      operation: () => type === 'assign'
        ? assignManagedUserRole(supabase, { targetUserId: user.id, ...request })
        : removeManagedUserRole(supabase, user.id, assignment.userRoleId),
      onSuccess: onChanged,
    })
    setSubmitting(false)
    if (result.error) {
      setError(result.error)
      return
    }
    const roleName = type === 'assign' ? role.name : assignment.name
    setNotice(result.warning?.message ?? roleMutationSuccessMessage(type, result.data, roleName))
    setSelected(null)
  }

  return (
    <section className="admin-role-actions" aria-labelledby="role-actions-title">
      <div className="admin-role-actions__heading"><div><p className="admin-section-label">Authorized operations</p><h2 id="role-actions-title">Role administration</h2><span>Every confirmed assignment or removal is authorized and audited by the database.</span></div><Button type="button" disabled={!assignmentAvailable} onClick={openAssignment}>Assign role</Button></div>
      {catalogMessage && <p className={roleOptionsError ? 'admin-dialog__error' : 'admin-role-actions__catalog-state'} role={roleOptionsError ? 'alert' : 'status'}>{catalogMessage}</p>}
      <ul className="admin-role-actions__assignments">
        {user.roles.map((assignment) => <li key={assignment.userRoleId}><div><strong>{assignment.name}</strong><span>{assignment.scopeType === 'global' ? 'Global · All Pulse' : assignment.scopeType === 'department' ? `Department · ${directory.departments.find((department) => department.id === assignment.departmentId)?.name ?? 'Unknown department'}` : `Team · ${directory.teams.find((team) => team.id === assignment.teamId)?.name ?? 'Unknown team'}`}</span></div><Button type="button" variant="secondary" size="sm" onClick={() => openRemoval(assignment)}>Remove</Button></li>)}
      </ul>
      {notice && <p className="admin-lifecycle-actions__notice" role="status">{notice}</p>}
      {selected && <RoleActionDialog action={selected} user={user} directory={directory} roleOptions={roleOptions} submitting={submitting} error={error} onCancel={cancel} onConfirm={confirm} />}
    </section>
  )
}
