import { useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '../../components/ui/Button.jsx'
import { lifecycleMeta, roleScopeLabel } from '../adminViewModel.js'
import { assignableRoles, isSuperAdminRole, organizationForRoleOption, roleAssignmentRequest, roleOptionKey, roleOptionsForRole, roleOptionsWithCurrent, shouldCancelRoleDialogOnKey } from '../roleActions.js'

function Target({ user }) {
  return <div className="admin-dialog__target"><strong>{user.fullName}</strong><span>{user.employeeId || 'Employee ID pending'} · Account status: {lifecycleMeta(user.status).label}</span></div>
}

function ScopeField({ label, value }) {
  return <label className="admin-role-field"><span>{label}</span><div>{value}</div></label>
}

export function RoleActionDialog({ action, user, directory, roleOptions, submitting, error, onCancel, onConfirm }) {
  const dialogRef = useRef(null)
  const roleSelectRef = useRef(null)
  const [roleId, setRoleId] = useState(() => action?.type === 'change' ? action.assignment?.roleId ?? '' : '')
  const [selectedOptionKey, setSelectedOptionKey] = useState(() => action?.type === 'change' ? roleOptionKey({
    roleId: action.assignment?.roleId,
    scopeType: action.assignment?.scopeType,
    departmentId: action.assignment?.departmentId,
    campaignId: action.assignment?.campaignId,
    teamId: action.assignment?.teamId,
  }) : '')
  const availableOptions = useMemo(() => roleOptionsWithCurrent(roleOptions, action?.type === 'change' ? action.assignment : null, directory), [action, directory, roleOptions])
  const roles = useMemo(() => assignableRoles(availableOptions), [availableOptions])
  const selectedRole = useMemo(() => roles.find((role) => role.id === (roleId || roles[0]?.id)) ?? null, [roleId, roles])
  const optionsForRole = useMemo(() => roleOptionsForRole(availableOptions, selectedRole?.id), [availableOptions, selectedRole])
  const selectedOption = useMemo(() => optionsForRole.find((option) => roleOptionKey(option) === selectedOptionKey) ?? optionsForRole[0] ?? null, [optionsForRole, selectedOptionKey])
  const editsAssignment = action?.type === 'assign' || action?.type === 'change'
  const organization = editsAssignment ? organizationForRoleOption(selectedOption) : null
  const assignmentRequest = editsAssignment ? roleAssignmentRequest(selectedOption) : null
  const assignment = action?.assignment ?? null
  const privileged = editsAssignment
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
    if (editsAssignment && assignmentRequest) onConfirm({ type: action.type, request: assignmentRequest, role: selectedRole, assignment })
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
      onKeyDown={(event) => {
        if (shouldCancelRoleDialogOnKey(event.key, submitting)) {
          event.preventDefault()
          cancel()
        }
      }}
      onClick={(event) => { if (event.target === event.currentTarget) cancel() }}
    >
      <form className="admin-dialog__surface" method="dialog" onSubmit={submit} onClick={(event) => event.stopPropagation()}>
        <div className="admin-dialog__eyebrow">Manage access</div>
        <h2 id="role-dialog-title">{action.type === 'assign' ? 'Add Pulse access' : action.type === 'change' ? 'Change Pulse access' : 'Remove Pulse access'}</h2>
        <Target user={user} />
        {editsAssignment ? (
          <div className="admin-role-form">
            <label className="admin-role-field"><span>Role</span><select ref={roleSelectRef} value={selectedRole?.id ?? ''} disabled={submitting} onChange={(event) => { setRoleId(event.target.value); setSelectedOptionKey('') }}>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></label>
            <label className="admin-role-field"><span>Access area</span><select value={selectedOption ? roleOptionKey(selectedOption) : ''} disabled={submitting || !selectedRole} onChange={(event) => setSelectedOptionKey(event.target.value)}>{optionsForRole.map((option) => <option key={roleOptionKey(option)} value={roleOptionKey(option)}>{organizationForRoleOption(option).label}</option>)}</select></label>
            <ScopeField label="Selected access" value={organization?.label ?? 'Select an access area'} />
          </div>
        ) : (
          <div className="admin-role-form"><ScopeField label="Role" value={assignment?.name ?? 'Unknown role'} /><ScopeField label="Access area" value={removeScope} /></div>
        )}
        <p id="role-dialog-description">{action.type === 'assign' ? 'This person will receive the selected role for this access area.' : action.type === 'change' ? 'The current entry will be replaced atomically, so active Staff never lose all access.' : 'Only the selected Pulse access will be removed.'}</p>
        {privileged && <div className="admin-dialog__warning" role="note"><strong>Super Admin access</strong><span>This grants broad control across Pulse. Review the person and access area carefully.</span></div>}
        {editsAssignment && !assignmentRequest && <p className="admin-dialog__error" role="alert">This role is not available for the selected access area.</p>}
        {error && <p className="admin-dialog__error" role="alert">{error.message}</p>}
        <div className="admin-dialog__actions">
          <Button type="button" variant="secondary" disabled={submitting} onClick={cancel}>Cancel</Button>
          <Button type="submit" variant={action.type === 'remove' ? 'destructive' : 'primary'} loading={submitting} disabled={editsAssignment && !assignmentRequest}>{action.type === 'assign' ? 'Add access' : action.type === 'change' ? 'Save changes' : 'Remove access'}</Button>
        </div>
      </form>
    </dialog>
  )
}
