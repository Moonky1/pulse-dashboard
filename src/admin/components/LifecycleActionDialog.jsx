import { useEffect, useRef, useState } from 'react'

import { Button } from '../../components/ui/Button.jsx'
import { lifecycleMeta } from '../adminViewModel.js'
import { isSuperAdminTarget } from '../lifecycleActions.js'

export function LifecycleActionDialog({ action, user, submitting, error, onCancel, onConfirm }) {
  const dialogRef = useRef(null)
  const noteRef = useRef(null)
  const [reason, setReason] = useState('')
  const privileged = isSuperAdminTarget(user)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (action && !dialog.open) {
      dialog.showModal()
      noteRef.current?.focus()
    } else if (!action && dialog.open) {
      dialog.close()
    }
  }, [action])

  if (!action || !user) return null
  const lifecycle = lifecycleMeta(user.status)
  const cancel = () => { if (!submitting) onCancel() }
  const submit = (event) => {
    event.preventDefault()
    if (!submitting) onConfirm(reason)
  }

  return (
    <dialog
      ref={dialogRef}
      className="admin-dialog"
      aria-labelledby="lifecycle-dialog-title"
      aria-describedby="lifecycle-dialog-description"
      onCancel={(event) => { event.preventDefault(); cancel() }}
      onClick={(event) => { if (event.target === event.currentTarget) cancel() }}
    >
      <form className="admin-dialog__surface" method="dialog" onSubmit={submit} onClick={(event) => event.stopPropagation()}>
        <div className="admin-dialog__eyebrow">Confirm lifecycle action</div>
        <h2 id="lifecycle-dialog-title">{action.label}</h2>
        <div className="admin-dialog__target">
          <strong>{user.fullName}</strong>
          <span>{user.employeeId || 'Employee ID pending'} · Current state: {lifecycle.label}</span>
        </div>
        <p id="lifecycle-dialog-description">{action.consequence}</p>
        {privileged && <div className="admin-dialog__warning" role="note"><strong>Privileged account</strong><span>This user has global Super Admin access. Pulse will enforce the authoritative server protections before any change.</span></div>}
        <label className="admin-dialog__reason">
          <span>Audit note <small>Optional</small></span>
          <textarea ref={noteRef} value={reason} maxLength={500} disabled={submitting} onChange={(event) => setReason(event.target.value)} placeholder="Add a concise reason for the audit record" />
          <small>{reason.length}/500</small>
        </label>
        {error && <p className="admin-dialog__error" role="alert">{error.message}</p>}
        <div className="admin-dialog__actions">
          <Button type="button" variant="secondary" disabled={submitting} onClick={cancel}>Cancel</Button>
          <Button type="submit" variant={action.tone} loading={submitting}>Confirm {action.shortLabel.toLowerCase()}</Button>
        </div>
      </form>
    </dialog>
  )
}
