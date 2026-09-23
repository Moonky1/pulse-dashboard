import { useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '../../components/ui/Button.jsx'
import { supabase } from '../../utils/supabase.js'
import { updateManagedUserWorkDetails } from '../api/adminApi.js'
import { useBusinessCatalog } from '../hooks/useBusinessCatalog.js'

function active(items) {
  return items.filter((item) => item.isActive)
}

function WorkDetailsDialog({ user, catalog, submitting, error, onCancel, onSave }) {
  const dialogRef = useRef(null)
  const [departmentId, setDepartmentId] = useState(() => user.departmentId ?? '')
  const [campaignId, setCampaignId] = useState(() => user.primaryCampaignId ?? '')
  const [operatingUnitId, setOperatingUnitId] = useState(() => user.primaryOperatingUnitId ?? '')
  const [teamId, setTeamId] = useState(() => user.primaryTeamId ?? '')
  const [positionId, setPositionId] = useState(() => user.positionId ?? '')

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (!dialog.open) dialog.showModal()
  }, [])

  const departments = useMemo(() => active(catalog.departments), [catalog.departments])
  const campaigns = useMemo(() => active(catalog.campaigns), [catalog.campaigns])
  const positions = useMemo(() => active(catalog.positions), [catalog.positions])
  const units = useMemo(() => active(catalog.operatingUnits).filter((unit) => unit.campaignId === campaignId), [campaignId, catalog.operatingUnits])
  const teams = useMemo(() => active(catalog.teams).filter((team) => (
    team.campaignId === campaignId
      && (team.operatingUnitId ?? '') === operatingUnitId
  )), [campaignId, catalog.teams, operatingUnitId])
  const valid = Boolean(
    departmentId
      && (!campaignId || (positionId && (!operatingUnitId || teamId))),
  )

  const cancel = () => { if (!submitting) onCancel() }
  const submit = (event) => {
    event.preventDefault()
    if (!valid || submitting) return
    onSave({
      departmentId,
      campaignId: campaignId || null,
      operatingUnitId: campaignId && operatingUnitId ? operatingUnitId : null,
      teamId: campaignId && teamId ? teamId : null,
      positionId: positionId || null,
    })
  }

  return (
    <dialog ref={dialogRef} className="admin-dialog admin-dialog--wide admin-work-details-dialog" aria-labelledby="work-details-dialog-title" onCancel={(event) => { event.preventDefault(); cancel() }} onClick={(event) => { if (event.target === event.currentTarget) cancel() }}>
      <form className="admin-dialog__surface" method="dialog" onSubmit={submit} onClick={(event) => event.stopPropagation()}>
        <div className="admin-dialog__eyebrow">Staff profile</div>
        <h2 id="work-details-dialog-title">Edit work details</h2>
        <div className="admin-dialog__target"><strong>{user.fullName}</strong><span>Position and operational placement are separate from Pulse access</span></div>
        <div className="admin-role-form">
          <label className="admin-role-field"><span>Department</span><select value={departmentId} disabled={submitting} onChange={(event) => setDepartmentId(event.target.value)}>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></label>
          <label className="admin-role-field"><span>Campaign</span><select value={campaignId} disabled={submitting} onChange={(event) => { const value = event.target.value; const firstUnit = active(catalog.operatingUnits).find((unit) => unit.campaignId === value); setCampaignId(value); setOperatingUnitId(firstUnit?.id ?? ''); setTeamId('') }}><option value="">No operational placement</option>{campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}</select></label>
          <label className="admin-role-field"><span>Operating unit</span><select value={operatingUnitId} disabled={submitting || !campaignId} onChange={(event) => { setOperatingUnitId(event.target.value); setTeamId('') }}><option value="">Direct Campaign team</option>{units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select></label>
          <label className="admin-role-field"><span>Team</span><select value={teamId} disabled={submitting || !campaignId} onChange={(event) => setTeamId(event.target.value)}><option value="">Campaign only</option>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label>
          <label className="admin-role-field"><span>Position</span><select value={positionId} disabled={submitting} onChange={(event) => setPositionId(event.target.value)}><option value="">No Position assigned</option>{positions.map((position) => <option key={position.id} value={position.id}>{position.name}</option>)}</select></label>
        </div>
        {error && <p className="admin-dialog__error" role="alert">{error.message}</p>}
        <div className="admin-dialog__actions"><Button type="button" variant="secondary" disabled={submitting} onClick={cancel}>Cancel</Button><Button type="submit" loading={submitting} disabled={!valid}>Save work details</Button></div>
      </form>
    </dialog>
  )
}

export function WorkDetailsAdministration({ user, allowed, onChanged }) {
  const { catalog, loading, error: catalogError, refresh: refreshCatalog } = useBusinessCatalog()
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)

  if (!allowed || user.status !== 'active') return null
  const save = async (values) => {
    setSubmitting(true)
    setError(null)
    const result = await updateManagedUserWorkDetails(supabase, { targetUserId: user.id, ...values })
    setSubmitting(false)
    if (result.error) {
      setError(result.error)
      return
    }
    await onChanged()
    setOpen(false)
    setNotice(result.data.changed ? 'Work details updated.' : 'Work details are already up to date.')
  }

  return (
    <section className="admin-work-details-actions" aria-labelledby="work-details-actions-title">
      <div><p className="admin-section-label">Work details</p><h2 id="work-details-actions-title">Placement and Position</h2><span>Update the person’s job and operational placement without changing Pulse access</span></div>
      {catalogError ? <div className="admin-inline-error"><span>{catalogError.message}</span><Button type="button" size="sm" variant="secondary" onClick={refreshCatalog}>Retry</Button></div> : <Button type="button" variant="secondary" disabled={loading} onClick={() => { setError(null); setNotice(null); setOpen(true) }}>Edit work details</Button>}
      {notice && <p className="admin-lifecycle-actions__notice" role="status">{notice}</p>}
      {open && <WorkDetailsDialog user={user} catalog={catalog} submitting={submitting} error={error} onCancel={() => { setError(null); setOpen(false) }} onSave={save} />}
    </section>
  )
}
