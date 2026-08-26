import { useRef, useState } from 'react'

import { Button } from '../../components/ui/Button.jsx'
import { supabase } from '../../utils/supabase.js'
import { blockManagedUser, inactivateManagedUser, reactivateManagedUser } from '../api/adminApi.js'
import { lifecycleActionsForUser, lifecycleSuccessMessage } from '../lifecycleActions.js'
import { runLifecycleMutation } from '../lifecycleMutation.js'
import { LifecycleActionDialog } from './LifecycleActionDialog.jsx'

const OPERATIONS = {
  block: (userId, reason) => blockManagedUser(supabase, userId, reason),
  reactivate: (userId, reason) => reactivateManagedUser(supabase, userId, reason),
  inactivate: (userId, reason) => inactivateManagedUser(supabase, userId, reason),
}

export function LifecycleActions({ user, allowed, onChanged }) {
  const actions = lifecycleActionsForUser(user, allowed)
  const guard = useRef(false)
  const [selected, setSelected] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)

  if (!actions.length) return null
  const open = (action) => { setError(null); setNotice(null); setSelected(action) }
  const cancel = () => { setError(null); setSelected(null) }
  const confirm = async (reason) => {
    setSubmitting(true)
    setError(null)
    const result = await runLifecycleMutation({
      guard,
      action: selected.key,
      targetUserId: user.id,
      reason,
      operations: OPERATIONS,
      onSuccess: onChanged,
    })
    setSubmitting(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setNotice(result.warning?.message ?? lifecycleSuccessMessage(selected.key, result.data))
    setSelected(null)
  }

  return (
    <section className="admin-lifecycle-actions" aria-labelledby="lifecycle-actions-title">
      <div><p className="admin-section-label">Authorized operations</p><h2 id="lifecycle-actions-title">Lifecycle actions</h2><span>Every confirmed change is authorized and audited by the database.</span></div>
      <div className="admin-lifecycle-actions__buttons">{actions.map((action) => <Button key={action.key} type="button" variant={action.tone} onClick={() => open(action)}>{action.shortLabel}</Button>)}</div>
      {notice && <p className="admin-lifecycle-actions__notice" role="status">{notice}</p>}
      {selected && <LifecycleActionDialog key={selected.key} action={selected} user={user} submitting={submitting} error={error} onCancel={cancel} onConfirm={confirm} />}
    </section>
  )
}
