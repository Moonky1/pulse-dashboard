import { useEffect, useRef, useState } from 'react'
import { Button } from '../../components/ui/Button.jsx'

export function RemoveInvitationDialog({ invitation, busy, error, onCancel, onConfirm }) {
  const dialog = useRef(null)
  const [confirmation, setConfirmation] = useState('')
  useEffect(() => { dialog.current?.showModal() }, [])
  return <dialog ref={dialog} className="admin-dialog" aria-labelledby="remove-invitation-title"
    onCancel={event => { event.preventDefault(); if (!busy) onCancel() }}>
    <form className="admin-dialog__surface" onSubmit={event => { event.preventDefault(); if (confirmation === 'REMOVE' && !busy) onConfirm(confirmation) }}>
      <p className="admin-dialog__eyebrow">Invitation cleanup</p>
      <h2 id="remove-invitation-title">Remove invitation for {invitation.fullName}?</h2>
      <p>Remove this obsolete invitation from the list. Required audit history and invitation chains remain protected. This never removes a Staff account.</p>
      <label className="admin-role-field"><span>Type REMOVE to confirm</span><input value={confirmation} autoComplete="off" disabled={busy} onChange={event => setConfirmation(event.target.value)} /></label>
      {error && <p className="admin-dialog__error" role="alert">{error.message}</p>}
      <div className="admin-dialog__actions"><Button type="button" variant="secondary" disabled={busy} onClick={onCancel}>Keep invitation</Button><Button type="submit" variant="destructive" loading={busy} disabled={confirmation !== 'REMOVE'}>Remove invitation</Button></div>
    </form>
  </dialog>
}
