import { useEffect, useRef, useState } from 'react'

import { Button } from '../../components/ui/Button.jsx'
import { supabase } from '../../utils/supabase.js'
import { setManagedUserPulseJoinedOn } from '../api/adminApi.js'

function localToday() {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

function JoinedPulseDialog({ user, submitting, error, onCancel, onSave }) {
  const dialogRef = useRef(null)
  const [value, setValue] = useState(user.pulseJoinedOn ?? '')
  const today = localToday()

  useEffect(() => {
    if (dialogRef.current && !dialogRef.current.open) dialogRef.current.showModal()
  }, [])

  const cancel = () => { if (!submitting) onCancel() }
  return (
    <dialog ref={dialogRef} className="admin-dialog admin-joined-pulse-dialog" aria-labelledby="joined-pulse-title" onCancel={(event) => { event.preventDefault(); cancel() }} onClick={(event) => { if (event.target === event.currentTarget) cancel() }}>
      <form className="admin-dialog__surface" method="dialog" onSubmit={(event) => { event.preventDefault(); if (value && !submitting) onSave(value) }} onClick={(event) => event.stopPropagation()}>
        <div className="admin-dialog__eyebrow">Staff profile</div>
        <h2 id="joined-pulse-title">Edit Joined Pulse</h2>
        <div className="admin-dialog__target"><strong>{user.fullName}</strong><span>The date this person officially became part of Pulse</span></div>
        <label className="admin-role-field"><span>Joined Pulse</span><input type="date" value={value} max={today} required disabled={submitting} onChange={(event) => setValue(event.target.value)} /></label>
        {error && <p className="admin-dialog__error" role="alert">{error.message}</p>}
        <div className="admin-dialog__actions"><Button type="button" variant="secondary" disabled={submitting} onClick={cancel}>Cancel</Button><Button type="submit" loading={submitting} disabled={!value}>Save</Button></div>
      </form>
    </dialog>
  )
}

export function JoinedPulseAdministration({ user, allowed, onChanged }) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)

  if (!allowed || user.status === 'pending_approval') return null

  const save = async (value) => {
    setSubmitting(true)
    setError(null)
    const result = await setManagedUserPulseJoinedOn(supabase, user.id, value)
    setSubmitting(false)
    if (result.error) {
      setError(result.error)
      return
    }
    await onChanged()
    setOpen(false)
    setNotice(result.data.changed ? 'Joined Pulse updated.' : 'Joined Pulse is already up to date.')
  }

  return (
    <div className="admin-joined-pulse-action">
      <Button type="button" size="sm" variant="secondary" onClick={() => { setError(null); setNotice(null); setOpen(true) }}>Edit Joined Pulse</Button>
      {notice && <span role="status">{notice}</span>}
      {open && <JoinedPulseDialog user={user} submitting={submitting} error={error} onCancel={() => { setError(null); setOpen(false) }} onSave={save} />}
    </div>
  )
}
