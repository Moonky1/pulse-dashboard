import { useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '../../components/ui/Button.jsx'
import { PENDING_APPROVAL_ACTION, pendingApprovalChoices, pendingApprovalOptionKey, resolvePendingApprovalSelection } from '../pendingActions.js'

function accessAreaLabel(option) {
  if (!option) return 'Access area unavailable'
  if (option.scopeType === 'global') return 'All Pulse'
  if (option.scopeType === 'department') return option.departmentName ?? 'Unknown department'
  if (option.scopeType === 'campaign') return option.campaignName ?? option.campaignCode ?? 'Unknown campaign'
  if (option.scopeType === 'team') return option.teamName ?? 'Unknown team'
  return 'Access area unavailable'
}

function authorizationLabel(option) {
  if (!option) return 'Select Pulse access'
  return `${option.roleName} · ${accessAreaLabel(option)}`
}

export function PendingApprovalDialog({ user, options, submitting, error, onCancel, onConfirm }) {
  const dialogRef = useRef(null)
  const departmentRef = useRef(null)
  const [departmentId, setDepartmentId] = useState('')
  const [teamId, setTeamId] = useState('')
  const [optionKey, setOptionKey] = useState('')
  const choices = useMemo(() => pendingApprovalChoices(options, departmentId, teamId), [departmentId, options, teamId])
  const selection = resolvePendingApprovalSelection(options, { departmentId, teamId, optionKey })

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog?.open) dialog?.showModal()
    departmentRef.current?.focus()
    const cancel = (event) => { event.preventDefault(); if (!submitting) onCancel() }
    dialog?.addEventListener('cancel', cancel)
    return () => dialog?.removeEventListener('cancel', cancel)
  }, [onCancel, submitting])

  const submit = (event) => {
    event.preventDefault()
    if (selection && !submitting) void onConfirm(selection)
  }

  return (
    <dialog ref={dialogRef} className="admin-dialog" aria-labelledby="pending-approval-title" aria-describedby="pending-approval-description">
      <form method="dialog" className="admin-dialog__surface" onSubmit={submit}>
        <span className="admin-dialog__eyebrow">Confirm approval</span>
        <h2 id="pending-approval-title">{PENDING_APPROVAL_ACTION.label}</h2>
        <div className="admin-dialog__target"><strong>{user.fullName}</strong><span>{user.email} · Awaiting approval</span></div>
        <div className="admin-role-form">
          <div className="admin-dialog__target"><strong>Work details</strong><span>Choose where this person works.</span></div>
          <label className="admin-role-field"><span>Department</span><select ref={departmentRef} value={departmentId} disabled={submitting} onChange={(event) => { setDepartmentId(event.target.value); setTeamId(''); setOptionKey('') }}><option value="">Select department</option>{choices.departments.map((option) => <option key={option.departmentId} value={option.departmentId}>{option.departmentName}</option>)}</select></label>
          <label className="admin-role-field"><span>Team</span><select value={teamId} disabled={submitting || !departmentId} onChange={(event) => { setTeamId(event.target.value); setOptionKey('') }}><option value="">No team</option>{choices.teams.map((option) => <option key={option.teamId} value={option.teamId}>{option.teamName}</option>)}</select></label>
          <div className="admin-dialog__target"><strong>Pulse access</strong><span>Choose the person’s starting role and access area.</span></div>
          <label className="admin-role-field"><span>Role and access area</span><select value={optionKey} disabled={submitting || !departmentId} onChange={(event) => setOptionKey(event.target.value)}><option value="">Select Pulse access</option>{choices.roleOptions.map((option) => <option key={pendingApprovalOptionKey(option)} value={pendingApprovalOptionKey(option)}>{authorizationLabel(option)}</option>)}</select></label>
          <div className="admin-dialog__target"><strong>Approval summary</strong><span>{selection ? `Work details: ${selection.departmentName}${selection.teamName ? ` · ${selection.teamName}` : ' · No team'} — Pulse access: ${authorizationLabel(selection)}` : 'Choose work details and Pulse access'}</span></div>
        </div>
        <p id="pending-approval-description">{PENDING_APPROVAL_ACTION.consequence}</p>
        {error && <p className="admin-dialog__error" role="alert">{error.message}</p>}
        <div className="admin-dialog__actions">
          <Button type="button" variant="secondary" disabled={submitting} onClick={onCancel}>Cancel</Button>
          <Button type="submit" loading={submitting} disabled={!selection}>Confirm approval</Button>
        </div>
      </form>
    </dialog>
  )
}
