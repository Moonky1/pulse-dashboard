import { useEffect, useRef, useState } from 'react'
import { Button } from '../../components/ui/Button.jsx'
import { supabase } from '../../utils/supabase.js'
import { inspectStaffRemoval, removeStaffIdentity } from '../api/admin2Api.js'

function RemoveDialog({ user, onCancel, onRemoved }) {
  const ref = useRef(null)
  const requestKey = useRef(crypto.randomUUID())
  const [plan, setPlan] = useState(null)
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [pending, setPending] = useState(false)
  useEffect(() => {
    ref.current?.showModal()
    let active = true
    void inspectStaffRemoval(supabase, user.id).then(result => {
      if (active) { setPlan(result.data); setError(result.error) }
    })
    return () => { active = false }
  }, [user.id])
  async function submit(event) {
    event.preventDefault()
    if (busy || !plan || plan.history_required || confirmation !== 'REMOVE') return
    setBusy(true); setError(null)
    const result = await removeStaffIdentity(supabase, user.id, plan, confirmation, requestKey.current)
    setBusy(false)
    if (result.error) { setError(result.error); return }
    if (result.data.cleanupPending) { setPending(true); return }
    onRemoved(result.data)
  }
  return <dialog ref={ref} className="admin-dialog admin-dialog--wide" aria-labelledby="remove-person-title"
    onCancel={event => { event.preventDefault(); if (!busy) pending ? onRemoved({ cleanupPending: true }) : onCancel() }}>
    <form className="admin-dialog__surface" onSubmit={submit}>
      <p className="admin-dialog__eyebrow">Remove from Pulse</p>
      <h2 id="remove-person-title">Remove {user.displayName || user.fullName} from Pulse?</h2>
      <p>Permanently delete this account, its access and its own account history. This cannot be undone. After cleanup finishes, the same email can receive a new invitation.</p>
      {!plan && !error && <p role="status">Checking account dependencies…</p>}
      {plan && <div className="admin-dialog__warning" role="note">{plan.history_required
        ? 'This account has shared records. Permanent deletion is blocked until their impact is reviewed; no other person’s records will be deleted automatically.'
        : 'Its Pulse profile, account activity, Auth identity and own profile photo will be permanently deleted. Existing sessions will stop working.'}</div>}
      <label className="admin-role-field"><span>Type REMOVE to confirm</span><input autoComplete="off" value={confirmation} disabled={busy} onChange={event => setConfirmation(event.target.value)} /></label>
      {error && <p className="admin-dialog__error" role="alert">{error.message}</p>}
      {pending && <p className="admin-dialog__warning" role="status">This person is already hidden and Pulse access is revoked. Auth or photo cleanup is still pending. Retry to finish the same removal safely.</p>}
      <div className="admin-dialog__actions admin-dialog__actions--destructive">
        <Button type="button" variant="secondary" disabled={busy} onClick={() => pending ? onRemoved({ cleanupPending: true }) : onCancel()}>{pending ? 'Return to People' : 'Keep person'}</Button>
        <Button type="submit" variant="destructive" loading={busy} disabled={!plan || plan.history_required || confirmation !== 'REMOVE'}>{pending ? 'Retry cleanup' : 'Remove from Pulse'}</Button>
      </div>
    </form>
  </dialog>
}

export function RemoveStaffAction({ user, allowed, onRemoved }) {
  const [open, setOpen] = useState(false)
  if (!allowed) return null
  return <section className="admin-removal-action"><div><h2>Remove from Pulse</h2><p>For permanent removal, not a temporary block or inactive account.</p></div>
    <Button type="button" variant="destructive" onClick={() => setOpen(true)}>Remove from Pulse</Button>
    {open && <RemoveDialog user={user} onCancel={() => setOpen(false)} onRemoved={onRemoved} />}
  </section>
}
