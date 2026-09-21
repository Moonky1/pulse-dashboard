import { useRef, useState } from 'react'

import { Button } from '../../components/ui/Button.jsx'
import { supabase } from '../../utils/supabase.js'
import { approvePendingUser, blockPendingUser } from '../api/adminApi.js'
import { PENDING_BLOCK_ACTION, pendingApprovalSuccessMessage, pendingBlockSuccessMessage, pendingReviewState } from '../pendingActions.js'
import { runPendingApprovalMutation } from '../pendingApprovalMutation.js'
import { runLifecycleMutation } from '../lifecycleMutation.js'
import { LifecycleActionDialog } from './LifecycleActionDialog.jsx'
import { PendingApprovalDialog } from './PendingApprovalDialog.jsx'

export function PendingApprovalActions({
  user,
  canBlock,
  canApprove,
  approvalOptions = [],
  approvalOptionsLoading = false,
  approvalOptionsError = null,
  onReloadApprovalOptions,
  onChanged,
  onApproved,
}) {
  const blockGuard = useRef(false)
  const approvalGuard = useRef(false)
  const [dialog, setDialog] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const state = pendingReviewState(user, { canBlock, canApprove, approvalOptionCount: approvalOptions.length })

  if (!state.pending || (!state.canBlock && !state.canApprove)) return null
  const openDialog = (type) => { setError(null); setNotice(null); setDialog(type) }
  const cancel = () => { setError(null); setDialog(null) }
  const confirmBlock = async (reason) => {
    setSubmitting(true)
    setError(null)
    const result = await runLifecycleMutation({
      guard: blockGuard,
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
    setDialog(null)
  }
  const confirmApproval = async (selection) => {
    setSubmitting(true)
    setError(null)
    const result = await runPendingApprovalMutation({
      guard: approvalGuard,
      operation: () => approvePendingUser(supabase, user.id, selection),
      onSuccess: onChanged,
    })
    setSubmitting(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setNotice(result.warning?.message ?? pendingApprovalSuccessMessage())
    setDialog(null)
    onApproved?.(result.data)
  }

  return (
    <section className="admin-pending-actions" aria-labelledby="pending-actions-title">
      <div className="admin-pending-actions__heading">
        <div>
          <p className="admin-section-label">Approval</p>
          <h2 id="pending-actions-title">Review registration</h2>
          <span>Approve this person or block the registration.</span>
        </div>
        <div className="admin-pending-actions__buttons">
          {state.canApprove && <Button type="button" disabled={!state.approvalAvailable || approvalOptionsLoading || Boolean(approvalOptionsError)} onClick={() => openDialog('approve')}>Approve</Button>}
          {state.canBlock && <Button type="button" variant="destructive" onClick={() => openDialog('block')}>Block</Button>}
        </div>
      </div>
      {state.canApprove && approvalOptionsLoading && <p className="admin-role-actions__catalog-state" role="status">Loading approval options…</p>}
      {state.canApprove && !approvalOptionsLoading && approvalOptionsError && <div className="admin-pending-actions__catalog-error" role="alert"><span>{approvalOptionsError.message}</span>{onReloadApprovalOptions && <Button type="button" variant="secondary" onClick={onReloadApprovalOptions}>Try again</Button>}</div>}
      {state.canApprove && !approvalOptionsLoading && !approvalOptionsError && !approvalOptions.length && <p className="admin-role-actions__catalog-state" role="status">No work details and Pulse access combination is currently available.</p>}
      {notice && <p className="admin-lifecycle-actions__notice" role="status">{notice}</p>}
      {dialog === 'block' && <LifecycleActionDialog action={PENDING_BLOCK_ACTION} user={user} submitting={submitting} error={error} onCancel={cancel} onConfirm={confirmBlock} />}
      {dialog === 'approve' && <PendingApprovalDialog user={user} options={approvalOptions} submitting={submitting} error={error} onCancel={cancel} onConfirm={confirmApproval} />}
    </section>
  )
}
