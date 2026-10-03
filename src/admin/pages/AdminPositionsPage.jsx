import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '../../components/ui/Button.jsx'
import { StaffAvatar } from '../components/StaffAvatar.jsx'
import { AdminStatePanel } from '../components/AdminStatePanel.jsx'
import { LifecycleBadge } from '../components/LifecycleBadge.jsx'
import { canManageStaffWork, hasAdminUsersAccess } from '../access.js'
import { useAdminPermissions } from '../AdminAccessContext.js'
import { listManagedUsersWithDetails } from '../api/adminApi.js'
import { usePositionCatalog } from '../hooks/usePositionCatalog.js'
import { supabase } from '../../utils/supabase.js'

function PositionStatus({ active }) {
  return <span className={`admin-organization-status admin-organization-status--${active ? 'active' : 'inactive'}`}>{active ? 'Active' : 'Inactive'}</span>
}

function PositionMembers({ position, users, loading, error, onRetry, canEdit }) {
  const members = users.filter((user) => user.positionId === position.id)
  if (loading) return <p className="admin-position-members__message" role="status">Loading members…</p>
  if (error) return <div className="admin-position-members__message" role="alert">Members could not be loaded. <Button type="button" variant="ghost" onClick={onRetry}>Retry</Button></div>
  if (!members.length) return <p className="admin-position-members__message">No current members in this position.</p>
  return <div className="admin-position-members__list">{members.map((member) => <Link className="admin-position-member" key={member.id} to={member.status === 'pending_approval' ? `/admin/pending/${member.id}` : `/admin/users/${member.id}`}>
    <StaffAvatar name={member.fullName} customAvatarPath={member.customAvatarPath} googleAvatarUrl={member.googleAvatarUrl} avatarUpdatedAt={member.avatarUpdatedAt} size="sm" />
    <span><strong>{member.fullName}</strong><small>{member.employeeId || 'Staff member'}</small></span>
    <LifecycleBadge status={member.status} />
    <em>{member.status === 'pending_approval' ? 'Review' : canEdit ? 'View / edit' : 'View'} →</em>
  </Link>)}</div>
}

function PositionCard({ position, canViewMembers, canEdit, expanded, onToggle, memberState, onRetry }) {
  return (
    <article className="admin-organization-card">
      <div className="admin-organization-card__heading">
        <div><span>Position</span><h3>{position.name}</h3></div>
        <PositionStatus active={position.isActive} />
      </div>
      <p>{position.description || 'No Position description has been added.'}</p>
      <div className="admin-organization-dependencies">
        <span><strong>{position.currentUserCount}</strong> current users</span>
        <span><strong>{position.activeAssignmentCount}</strong> active assignments</span>
        <span><strong>{position.assignmentCount}</strong> total assignments</span>
      </div>
      {canViewMembers && <div className="admin-position-members">
        <button type="button" className="admin-position-members__toggle" aria-expanded={expanded} onClick={onToggle}>{expanded ? 'Hide members' : `View members (${position.currentUserCount})`} <span aria-hidden="true">{expanded ? '−' : '→'}</span></button>
        {expanded && <PositionMembers position={position} users={memberState.users} loading={memberState.loading} error={memberState.error} onRetry={onRetry} canEdit={canEdit} />}
      </div>}
    </article>
  )
}

export function AdminPositionsPage() {
  const { permissionKeys } = useAdminPermissions()
  const canViewMembers = hasAdminUsersAccess(permissionKeys)
  const canEdit = canManageStaffWork(permissionKeys)
  const { positions, loading, error, refresh } = usePositionCatalog()
  const [query, setQuery] = useState('')
  const [expandedPositionId, setExpandedPositionId] = useState(null)
  const [memberState, setMemberState] = useState({ users: [], loading: false, error: null, loaded: false })
  async function loadMembers() {
    if (!canViewMembers) return
    setMemberState((current) => ({ ...current, loading: true, error: null }))
    const result = await listManagedUsersWithDetails(supabase)
    setMemberState({ users: result.data, loading: false, error: result.error, loaded: !result.error })
  }
  function togglePosition(positionId) {
    setExpandedPositionId((current) => current === positionId ? null : positionId)
    if (!memberState.loaded && !memberState.loading) void loadMembers()
  }
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return positions
    return positions.filter((position) => [position.name, position.code, position.description]
      .some((value) => String(value ?? '').toLowerCase().includes(normalized)))
  }, [positions, query])

  if (loading && !positions.length) return <main className="admin-content"><AdminStatePanel kind="loading" title="Loading positions" body="Loading the position list…" /></main>
  if (error && !positions.length) return <main className="admin-content"><AdminStatePanel kind="error" title="Positions unavailable" body={error.message} onRetry={refresh} /></main>

  return (
    <main className="admin-content">
      <div className="admin-page-heading">
        <div><p>People</p><h1>Positions</h1><span>Review what people do at work</span></div>
        <Button type="button" variant="secondary" onClick={() => { void refresh(); if (memberState.loaded) void loadMembers() }} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</Button>
      </div>
      <section className="admin-filter-bar admin-filter-bar--positions" aria-label="Position filters">
        <label className="admin-search"><span>Search Positions</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name or description" /></label>
      </section>
      <div className="admin-list-meta" aria-live="polite"><strong>{filtered.length}</strong> of {positions.length} positions</div>
      {!positions.length
        ? <AdminStatePanel kind="empty" title="No positions" body="No positions have been created yet." />
        : !filtered.length
          ? <AdminStatePanel kind="empty" title="No matching Positions" body="Adjust the Position search to broaden these results." />
          : <div className="admin-organization-grid">{filtered.map((position) => <PositionCard key={position.id} position={position} canViewMembers={canViewMembers} canEdit={canEdit} expanded={expandedPositionId === position.id} onToggle={() => togglePosition(position.id)} memberState={memberState} onRetry={() => { void loadMembers() }} />)}</div>}
    </main>
  )
}
