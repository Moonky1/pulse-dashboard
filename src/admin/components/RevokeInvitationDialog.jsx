import { useEffect, useRef } from 'react'
import { Button } from '../../components/ui/Button.jsx'

export function RevokeInvitationDialog({ invitation, busy, error, onCancel, onConfirm }) {
  const dialog = useRef(null)
  useEffect(() => { dialog.current?.showModal() }, [])
  return <dialog ref={dialog} className="admin-dialog" aria-labelledby="revoke-invitation-title"
    onCancel={event => { event.preventDefault(); if (!busy) onCancel() }}>
    <form className="admin-dialog__surface" onSubmit={event => { event.preventDefault(); if (!busy) onConfirm() }}>
      <p className="admin-dialog__eyebrow">Invitation access</p>
      <h2 id="revoke-invitation-title">Revoke invitation for {invitation.fullName}?</h2>
      <p>This invitation will no longer grant access to Pulse. Its history remains protected. This does not remove a Staff account or send a new email.</p>
      {error && <p className="admin-dialog__error" role="alert">{error.message}</p>}
      <div className="admin-dialog__actions"><Button type="button" variant="secondary" disabled={busy} onClick={onCancel}>Keep invitation</Button><Button type="submit" variant="destructive" loading={busy}>Revoke invitation</Button></div>
    </form>
  </dialog>
}
