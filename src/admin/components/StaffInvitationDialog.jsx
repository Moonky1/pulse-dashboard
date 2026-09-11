import { useEffect, useMemo, useRef, useState } from 'react'

import { isEmailFormatValid } from '../../auth/pulseAuthService.js'
import { Button } from '../../components/ui/Button.jsx'
import { invitationOptionKey, invitationRoleOptions, invitationScopeLabel, staffInvitationProposal } from '../invitationActions.js'

export function StaffInvitationDialog({ options, submitting, error, onCancel, onConfirm }) {
  const dialogRef = useRef(null)
  const emailRef = useRef(null)
  const [values, setValues] = useState({ email: '', fullName: '', departmentId: '', teamId: '', positionId: '', optionKey: '' })
  const teams = useMemo(() => options.teams.filter((item) => item.departmentId === values.departmentId), [options.teams, values.departmentId])
  const roleOptions = useMemo(() => invitationRoleOptions(options.roleOptions, values.departmentId, values.teamId), [options.roleOptions, values.departmentId, values.teamId])
  const proposal = staffInvitationProposal(values, options)
  const valid = proposal && isEmailFormatValid(values.email) && values.fullName.trim().length >= 2

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog?.open) dialog?.showModal()
    emailRef.current?.focus()
    const cancel = (event) => { event.preventDefault(); if (!submitting) onCancel() }
    dialog?.addEventListener('cancel', cancel)
    return () => dialog?.removeEventListener('cancel', cancel)
  }, [onCancel, submitting])

  const update = (key) => (event) => setValues((current) => ({ ...current, [key]: event.target.value }))
  const selected = roleOptions.find((option) => invitationOptionKey(option) === values.optionKey)
  return (
    <dialog ref={dialogRef} className="admin-dialog" aria-labelledby="staff-invitation-title" aria-describedby="staff-invitation-description">
      <form method="dialog" className="admin-dialog__surface" onSubmit={(event) => { event.preventDefault(); if (valid && !submitting) void onConfirm(proposal) }}>
        <span className="admin-dialog__eyebrow">Protected invitation</span>
        <h2 id="staff-invitation-title">Invite Staff</h2>
        <p id="staff-invitation-description">Create one expiring invitation. Acceptance enters the existing pending-approval queue; it does not grant access.</p>
        <div className="admin-organization-form">
          <label><span>Email</span><input ref={emailRef} type="email" autoComplete="email" value={values.email} disabled={submitting} onChange={update('email')} placeholder="name@company.com" /></label>
          <label><span>Full name</span><input value={values.fullName} maxLength={160} disabled={submitting} onChange={update('fullName')} /></label>
          <div className="admin-dialog__target"><strong>Proposed employment</strong><span>These values are reviewed again before approval.</span></div>
          <label><span>Department</span><select value={values.departmentId} disabled={submitting} onChange={(event) => setValues((current) => ({ ...current, departmentId: event.target.value, teamId: '', optionKey: '' }))}><option value="">Select department</option>{options.departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label><span>Team <small>Optional</small></span><select value={values.teamId} disabled={submitting || !values.departmentId} onChange={(event) => setValues((current) => ({ ...current, teamId: event.target.value, optionKey: '' }))}><option value="">No team</option>{teams.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label><span>Position <small>Optional proposal</small></span><select value={values.positionId} disabled={submitting} onChange={update('positionId')}><option value="">No position proposed</option>{options.positions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <div className="admin-dialog__target"><strong>Proposed authorization</strong><span>Choose one exact server-approved role and scope.</span></div>
          <label><span>Role and scope</span><select value={values.optionKey} disabled={submitting || !values.departmentId} onChange={update('optionKey')}><option value="">Select role and scope</option>{roleOptions.map((option) => <option key={invitationOptionKey(option)} value={invitationOptionKey(option)}>{option.roleName} · {invitationScopeLabel(option, options)}</option>)}</select></label>
        </div>
        {selected && <div className="admin-dialog__target"><strong>Invitation summary</strong><span>{values.fullName || 'Invitee'} · {selected.roleName} · {invitationScopeLabel(selected, options)}</span></div>}
        {error && <p className="admin-dialog__error" role="alert">{error.message}</p>}
        <div className="admin-dialog__actions"><Button type="button" variant="secondary" disabled={submitting} onClick={onCancel}>Cancel</Button><Button type="submit" loading={submitting} disabled={!valid}>Send invitation</Button></div>
      </form>
    </dialog>
  )
}
