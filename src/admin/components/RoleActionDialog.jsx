import { useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '../../components/ui/Button.jsx'
import { roleScopeLabel } from '../adminViewModel.js'
import { assignableRoles, isSuperAdminRole, organizationForRoleOption, roleAssignmentRequest, roleOptionKey, roleOptionsForRole } from '../roleActions.js'

function Target({ user }) {
  return <div className="admin-dialog__target"><strong>{user.fullName}</strong><span>{user.employeeId || 'Employee ID pending'} · Current state: {user.status}</span></div>
}

function ScopeField({ label, value }) {
  return <label className="admin-role-field"><span>{label}</span><div>{value}</div></label>
}

export function RoleActionDialog({ action, user, directory, roleOptions, submitting, error, onCancel, onConfirm }) {
  const dialogRef = useRef(null)
  const roleSelectRef = useRef(null)
  const [roleId, setRoleId] = useState('')
  const [selectedOptionKey, setSelectedOptionKey] = useState('')
  const roles = useMemo(() => assignableRoles(roleOptions), [roleOptions])
  const selectedRole = useMemo(() => roles.find((role) => role.id === (roleId || roles[0]?.id)) ?? null, [roleId, roles])
  const optionsForRole = useMemo(() => roleOptionsForRole(roleOptions, selectedRole?.id), [roleOptions, selectedRole])
  const selectedOption = useMemo(() => optionsForRole.find((option) => roleOptionKey(option) === selectedOptionKey) ?? optionsForRole[0] ?? null, [optionsForRole, selectedOptionKey])
  const organization = action?.type === 'assign' ? organizationForRoleOption(selectedOption) : null
  const assignmentRequest = action?.type === 'assign' ? roleAssignmentRequest(selectedOption) : null
  const assignment = action?.assignment ?? null
  const privileged = action?.type === 'assign'
    ? isSuperAdminRole(selectedRole, selectedOption?.scopeType)
    : isSuperAdminRole(assignment, assignment?.scopeType)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (action && !dialog.open) {
      dialog.showModal()
      roleSelectRef.current?.focus()
    } else if (!action && dialog.open) {
      dialog.close()
    }
  }, [action])

  if (!action || !user) return null
  const cancel = () => { if (!submitting) onCancel() }
  const submit = (event) => {
    event.preventDefault()
    if (submitting) return
    if (action.type === 'assign' && assignmentRequest) onConfirm({ type: 'assign', request: assignmentRequest, role: selectedRole })
    if (action.type === 'remove' && assignment?.userRoleId) onConfirm({ type: 'remove', assignment })
  }
  const removeScope = assignment ? roleScopeLabel(assignment, directory) : ''

  return (
    <dialog
      ref={dialogRef}
      className="admin-dialog"
      aria-labelledby="role-dialog-title"
      aria-describedby="role-dialog-description"
      onCancel={(event) => { event.preventDefault(); cancel() }}
      onClick={(event) => { if (event.target === event.currentTarget) cancel() }}
    >
      <form className="admin-dialog__surface" method="dialog" onSubmit={submit} onClick={(event) => event.stopPropagation()}>
        <div className="admin-dialog__eyebrow">Confirm role action</div>
        <h2 id="role-dialog-title">{action.type === 'assign' ? 'Assign role' : 'Remove role'}</h2>
        <Target user={user} />
        {action.type === 'assign' ? (
          <div className="admin-role-form">
            <label className="admin-role-field"><span>Role</span><select ref={roleSelectRef} value={selectedRole?.id ?? ''} disabled={submitting} onChange={(event) => { setRoleId(event.target.value); setSelectedOptionKey('') }}>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></label>
            <label className="admin-role-field"><span>Scope</span><select value={selectedOption ? roleOptionKey(selectedOption) : ''} disabled={submitting || !selectedRole} onChange={(event) => setSelectedOptionKey(event.target.value)}>{optionsForRole.map((option) => <option key={roleOptionKey(option)} value={roleOptionKey(option)}>{option.scopeType[0].toUpperCase() + option.scopeType.slice(1)}</option>)}</select></label>
            <ScopeField label="Target organization" value={organization?.label ?? 'Select a supported scope'} />
          </div>
        ) : (
          <div className="admin-role-form"><ScopeField label="Role" value={assignment?.name ?? 'Unknown role'} /><ScopeField label="Exact scope" value={removeScope} /></div>
        )}
        <p id="role-dialog-description">{action.type === 'assign' ? 'Pulse will validate your authority, the grant rule, the active catalog, and the target organization before creating this assignment.' : 'Pulse will remove only this exact role assignment after validating your authority and the final-role protections.'}</p>
        {privileged && <div className="admin-dialog__warning" role="note"><strong>Privileged role</strong><span>This action involves a global Super Admin assignment. Pulse will enforce the authoritative server protections before any change.</span></div>}
        {action.type === 'assign' && !assignmentRequest && <p className="admin-dialog__error" role="alert">The selected role scope is not available for this user’s current organization.</p>}
        {error && <p className="admin-dialog__error" role="alert">{error.message}</p>}
        <div className="admin-dialog__actions">
          <Button type="button" variant="secondary" disabled={submitting} onClick={cancel}>Cancel</Button>
          <Button type="submit" variant={action.type === 'remove' ? 'destructive' : 'primary'} loading={submitting} disabled={action.type === 'assign' && !assignmentRequest}>Confirm {action.type === 'assign' ? 'assignment' : 'removal'}</Button>
        </div>
      </form>
    </dialog>
  )
}
