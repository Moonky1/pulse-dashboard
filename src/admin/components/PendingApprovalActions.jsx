import { useRef, useState } from 'react'

import { Button } from '../../components/ui/Button.jsx'
import { supabase } from '../../utils/supabase.js'
import { blockPendingUser } from '../api/adminApi.js'
import { PENDING_APPROVAL_CATALOG_MESSAGE, PENDING_BLOCK_ACTION, pendingBlockSuccessMessage, pendingReviewState } from '../pendingActions.js'
import { runLifecycleMutation } from '../lifecycleMutation.js'
import { LifecycleActionDialog } from './LifecycleActionDialog.jsx'

export function PendingApprovalActions({ user, canBlock, canApprove, onChanged }) {
  const guard = useRef(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const state = pendingReviewState(user, { canBlock, canApprove })

  if (!state.pending || (!state.canBlock && !state.canApprove)) return null
  const cancel = () => { setError(null); setDialogOpen(false) }
  const confirmBlock = async (reason) => {
    setSubmitting(true)
    setError(null)
    const result = await runLifecycleMutation({
      guard,
      action: PENDING_BLOCK_ACTION.key,
      targetUserId: user.id,
      reason,
      operations: {
        [PENDING_BLOCK_ACTION.key]: (userId, auditReason) => blockPendingUser(supabase, userId, auditReason),
      },
      onSuccess: onChanged,
    })
    setSubmitting(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setNotice(result.warning?.message ?? pendingBlockSuccessMessage())
    setDialogOpen(false)
  }

  return (
    <section className="admin-pending-actions" aria-labelledby="pending-actions-title">
      <div className="admin-pending-actions__heading">
        <div>
          <p className="admin-section-label">Authorized operations</p>
          <h2 id="pending-actions-title">Pending approval review</h2>
          <span>Every confirmed decision is authorized and audited by the database.</span>
        </div>
        <div className="admin-pending-actions__buttons">
          {state.canApprove && <Button type="button" disabled>Approve user</Button>}
          {state.canBlock && <Button type="button" variant="destructive" onClick={() => { setError(null); setNotice(null); setDialogOpen(true) }}>Block pending user</Button>}
        </div>
      </div>
      {state.canApprove && !state.approvalAvailable && <p className="admin-role-actions__catalog-state" role="status">{PENDING_APPROVAL_CATALOG_MESSAGE}</p>}
      {notice && <p className="admin-lifecycle-actions__notice" role="status">{notice}</p>}
      {dialogOpen && <LifecycleActionDialog action={PENDING_BLOCK_ACTION} user={user} submitting={submitting} error={error} onCancel={cancel} onConfirm={confirmBlock} />}
    </section>
  )
}
