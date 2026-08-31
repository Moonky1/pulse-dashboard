import { useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '../../components/ui/Button.jsx'
import { PENDING_APPROVAL_ACTION, pendingApprovalChoices, pendingApprovalOptionKey, resolvePendingApprovalSelection } from '../pendingActions.js'

function scopeLabel(scopeType) {
  return scopeType[0].toUpperCase() + scopeType.slice(1)
}

function authorizationLabel(option) {
  if (!option) return 'Select one server-provided authorization option'
  const target = option.scopeType === 'campaign'
    ? ` · ${option.campaignName ?? option.campaignCode ?? 'Unknown campaign'}`
    : ''
  return `${option.roleName} · ${scopeLabel(option.scopeType)}${target}`
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
        <div className="admin-dialog__target"><strong>{user.fullName}</strong><span>{user.email} · Current state: pending approval</span></div>
        <div className="admin-role-form">
          <div className="admin-dialog__target"><strong>Employment placement</strong><span>Department and optional team describe where this person works.</span></div>
          <label className="admin-role-field"><span>Employment department</span><select ref={departmentRef} value={departmentId} disabled={submitting} onChange={(event) => { setDepartmentId(event.target.value); setTeamId(''); setOptionKey('') }}><option value="">Select department</option>{choices.departments.map((option) => <option key={option.departmentId} value={option.departmentId}>{option.departmentName}</option>)}</select></label>
          <label className="admin-role-field"><span>Employment team</span><select value={teamId} disabled={submitting || !departmentId} onChange={(event) => { setTeamId(event.target.value); setOptionKey('') }}><option value="">No team</option>{choices.teams.map((option) => <option key={option.teamId} value={option.teamId}>{option.teamName}</option>)}</select></label>
          <div className="admin-dialog__target"><strong>Authorization scope</strong><span>Role scope controls access independently from employment placement.</span></div>
          <label className="admin-role-field"><span>Initial role and authorization scope</span><select value={optionKey} disabled={submitting || !departmentId} onChange={(event) => setOptionKey(event.target.value)}><option value="">Select role and scope</option>{choices.roleOptions.map((option) => <option key={pendingApprovalOptionKey(option)} value={pendingApprovalOptionKey(option)}>{authorizationLabel(option)}</option>)}</select></label>
          <div className="admin-dialog__target"><strong>Exact approval</strong><span>{selection ? `Employment: ${selection.departmentName}${selection.teamName ? ` · ${selection.teamName}` : ' · No team'} — Authorization: ${authorizationLabel(selection)}` : 'Select one server-provided combination'}</span></div>
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
