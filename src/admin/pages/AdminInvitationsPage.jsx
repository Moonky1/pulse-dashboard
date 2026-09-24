import { useMemo, useState } from 'react'

import { Button } from '../../components/ui/Button.jsx'
import { supabase } from '../../utils/supabase.js'
import { reinviteStaffInvitation, resendStaffInvitation, revokeStaffInvitation, sendStaffInvitation } from '../api/adminApi.js'
import { AdminStatePanel } from '../components/AdminStatePanel.jsx'
import { StaffInvitationDialog } from '../components/StaffInvitationDialog.jsx'
import { invitationStatusLabel } from '../invitationActions.js'
import { useStaffInvitations } from '../hooks/useStaffInvitations.js'

const FILTERS = [['', 'All statuses'], ['sent', 'Sent'], ['accepted', 'Accepted'], ['failed', 'Delivery failed'], ['expired', 'Expired'], ['revoked', 'Revoked']]

function scopeText(invitation) {
  const target = invitation.scope.campaign?.name ?? invitation.scope.department?.name ?? invitation.scope.team?.name ?? 'All Pulse'
  return `${invitation.role.name} · ${target}`
}

export function AdminInvitationsPage() {
  const [status, setStatus] = useState('')
  const [query, setQuery] = useState('')
  const [dialog, setDialog] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [mutationError, setMutationError] = useState(null)
  const [notice, setNotice] = useState(null)
  const invitationState = useStaffInvitations(status || null)
  const filtered = useMemo(() => invitationState.invitations.filter((item) => `${item.fullName} ${item.email}`.toLowerCase().includes(query.trim().toLowerCase())), [invitationState.invitations, query])

  const mutate = async (operation, success) => {
    setSubmitting(true); setMutationError(null); setNotice(null)
    const result = await operation()
    setSubmitting(false)
    if (result.error) { setMutationError(result.error); return }
    setDialog(null); setNotice(success); await invitationState.refresh()
  }
  const send = (proposal) => mutate(() => sendStaffInvitation(supabase, proposal), 'Invitation prepared. Delivery is pending.')
  const reinvite = (proposal) => mutate(() => reinviteStaffInvitation(supabase, dialog, proposal), 'A new invitation was created. The prior record remains unchanged.')
  const resend = (invitation) => mutate(() => resendStaffInvitation(supabase, invitation), 'Invitation renewed for 72 hours. Delivery is pending.')
  const revoke = (invitation) => {
    if (window.confirm(`Revoke the invitation for ${invitation.fullName}?`)) void mutate(() => revokeStaffInvitation(supabase, invitation), 'Invitation revoked.')
  }

  if (invitationState.loading && !invitationState.invitations.length) return <main className="admin-content"><AdminStatePanel kind="loading" title="Loading invitations" body="Getting the latest invitations…" /></main>
  if (invitationState.error && !invitationState.invitations.length) return <main className="admin-content"><AdminStatePanel kind="error" title="Invitations unavailable" body={invitationState.error.message} onRetry={invitationState.refresh} /></main>

  return (
    <main className="admin-content">
      <div className="admin-page-heading"><div><p>People</p><h1>Invitations</h1><span>Invite staff with their work details and starting Pulse access</span></div><div className="admin-heading-actions"><Button type="button" variant="secondary" loading={invitationState.loading} onClick={invitationState.refresh}>Refresh</Button><Button type="button" onClick={() => { setMutationError(null); setDialog({ mode: 'new' }) }}>Invite Staff</Button></div></div>
      <section className="admin-filter-bar admin-filter-bar--invitations" aria-label="Invitation filters">
        <label className="admin-search"><span>Search invitations</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name or email" /></label>
        <label className="admin-filter"><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}>{FILTERS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      </section>
      {notice && <p className="admin-operation-notice" role="status">{notice}</p>}
      {mutationError && <p className="admin-operation-error" role="alert">{mutationError.message}</p>}
      <div className="admin-list-meta"><strong>{filtered.length}</strong> invitations</div>
      {!filtered.length ? <AdminStatePanel kind="empty" title="No invitations" body="No invitations match this view." /> : <section className="admin-invitations" aria-label="Staff invitations">{filtered.map((item) => <article className="admin-invitation-card" key={item.id}><div><span className={`admin-invitation-status admin-invitation-status--${item.status}`}>{invitationStatusLabel(item.status)}</span><h2>{item.fullName}</h2><p>{item.email}</p></div><dl><div><dt>Work details</dt><dd>{item.department.name}{item.campaign ? ` · ${item.campaign.name}` : ''}{item.operatingUnit ? ` · ${item.operatingUnit.name}` : ''}{item.team ? ` · ${item.team.name}` : ''}{item.position ? ` · ${item.position.name}` : ''}</dd></div><div><dt>Pulse access</dt><dd>{scopeText(item)}</dd></div><div><dt>Expires</dt><dd>{new Date(item.expiresAt).toLocaleString()}</dd></div><div><dt>Created by</dt><dd>{item.createdByName}</dd></div></dl><div className="admin-invitation-card__actions">{item.canResend && <Button type="button" variant="secondary" disabled={submitting} onClick={() => void resend(item)}>Resend</Button>}{item.canReinvite && <Button type="button" variant="secondary" disabled={submitting} onClick={() => { setMutationError(null); setDialog(item) }}>Re-invite</Button>}{item.canRevoke && <Button type="button" variant="destructive" disabled={submitting} onClick={() => revoke(item)}>Revoke</Button>}</div></article>)}</section>}
      {dialog && <StaffInvitationDialog options={invitationState.options} initialValues={dialog.id ? { email: dialog.email, fullName: dialog.fullName, previousInvitationId: dialog.id } : null} submitting={submitting} error={mutationError} onCancel={() => { if (!submitting) setDialog(null) }} onConfirm={dialog.id ? reinvite : send} />}
    </main>
  )
}
