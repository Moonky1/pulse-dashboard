import { useMemo, useRef, useState } from 'react'

import { Button } from '../../components/ui/Button.jsx'
import { canManageDepartments, canManageTeams, canViewDepartments, canViewTeams } from '../access.js'
import { useAdminPermissions } from '../AdminAccessContext.js'
import { createManagedDepartment, createManagedTeam, setManagedDepartmentActive, setManagedTeamActive, updateManagedDepartment, updateManagedTeam } from '../api/adminApi.js'
import { AdminStatePanel } from '../components/AdminStatePanel.jsx'
import { OrganizationActionDialog } from '../components/OrganizationActionDialog.jsx'
import { useOrganizationCatalog } from '../hooks/useOrganizationCatalog.js'
import { filterOrganizationItems, organizationMutationMessage } from '../organizationActions.js'
import { runOrganizationMutation } from '../organizationMutation.js'
import { supabase } from '../../utils/supabase.js'

function Status({ active }) {
  return <span className={`admin-organization-status admin-organization-status--${active ? 'active' : 'inactive'}`}>{active ? 'Active' : 'Inactive'}</span>
}

function Dependencies({ entity, type }) {
  return (
    <div className="admin-organization-dependencies">
      {type === 'department' && <span><strong>{entity.activeTeamCount}</strong> active teams</span>}
      <span><strong>{entity.activeUserCount}</strong> active users</span>
      <span><strong>{entity.pendingUserCount}</strong> pending users</span>
      <span><strong>{entity.activeRoleAssignmentCount}</strong> active scoped roles</span>
    </div>
  )
}

function OrganizationCard({ entity, type, canManage, onAction }) {
  return (
    <article className="admin-organization-card">
      <div className="admin-organization-card__heading">
        <div><span>{entity.code}</span><h3>{entity.name}</h3>{type === 'team' && <small>{entity.departmentName}</small>}</div>
        <Status active={entity.isActive} />
      </div>
      <p>{entity.description || `No ${type} description has been added.`}</p>
      <Dependencies entity={entity} type={type} />
      {canManage && <div className="admin-organization-card__actions">
        <Button type="button" size="sm" variant="ghost" onClick={() => onAction({ type: 'update', entityType: type, entity })}>Edit</Button>
        <Button type="button" size="sm" variant={entity.isActive ? 'danger' : 'secondary'} onClick={() => onAction({ type: entity.isActive ? 'deactivate' : 'reactivate', entityType: type, entity })}>{entity.isActive ? 'Deactivate' : 'Reactivate'}</Button>
      </div>}
    </article>
  )
}

function OrganizationSection({ title, description, items, type, canManage, query, departmentId, onAction }) {
  const filtered = useMemo(() => filterOrganizationItems(items, query, departmentId), [departmentId, items, query])
  return (
    <section className="admin-organization-section" aria-labelledby={`${type}-heading`}>
      <div className="admin-organization-section__heading">
        <div><h2 id={`${type}-heading`}>{title}</h2><p>{description}</p></div>
        {canManage && <Button type="button" onClick={() => onAction({ type: 'create', entityType: type })}>Create {type}</Button>}
      </div>
      <div className="admin-list-meta" aria-live="polite"><strong>{filtered.length}</strong> of {items.length} {title.toLowerCase()} <span>Protected catalog</span></div>
      {!items.length ? <AdminStatePanel kind="empty" title={`No ${title.toLowerCase()}`} body={`The protected ${type} catalog returned no records.`} />
        : !filtered.length ? <AdminStatePanel kind="empty" title={`No matching ${title.toLowerCase()}`} body="Adjust the organization filters to broaden these results." />
          : <div className="admin-organization-grid">{filtered.map((entity) => <OrganizationCard key={entity.id} entity={entity} type={type} canManage={canManage} onAction={onAction} />)}</div>}
    </section>
  )
}

export function AdminOrganizationPage() {
  const { permissionKeys } = useAdminPermissions()
  const departmentRead = canViewDepartments(permissionKeys)
  const teamRead = canViewTeams(permissionKeys)
  const departmentManage = canManageDepartments(permissionKeys)
  const teamManage = canManageTeams(permissionKeys)
  const { departments, teams, loading, error, refresh } = useOrganizationCatalog({ departments: departmentRead, teams: teamRead })
  const [query, setQuery] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [action, setAction] = useState(null)
  const [mutationError, setMutationError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const guard = useRef(false)

  const openAction = (nextAction) => {
    setMutationError(null)
    setNotice(null)
    setAction(nextAction)
  }
  const cancelAction = () => {
    if (submitting) return
    setAction(null)
    setMutationError(null)
  }
  const confirmAction = async ({ action: confirmedAction, values, active, validationError }) => {
    if (validationError) {
      setMutationError({ code: 'invalid_request', message: validationError })
      return
    }
    setSubmitting(true)
    setMutationError(null)
    const operation = () => {
      if (confirmedAction.entityType === 'department') {
        if (confirmedAction.type === 'create') return createManagedDepartment(supabase, values)
        if (confirmedAction.type === 'update') return updateManagedDepartment(supabase, confirmedAction.entity, values)
        return setManagedDepartmentActive(supabase, confirmedAction.entity, active)
      }
      if (confirmedAction.type === 'create') return createManagedTeam(supabase, values.departmentId, values)
      if (confirmedAction.type === 'update') return updateManagedTeam(supabase, confirmedAction.entity, values)
      return setManagedTeamActive(supabase, confirmedAction.entity, active)
    }
    const result = await runOrganizationMutation({ guard, operation, onSuccess: refresh })
    setSubmitting(false)
    if (result.error) {
      setMutationError(result.error)
      return
    }
    setAction(null)
    setNotice(result.warning?.message || organizationMutationMessage(confirmedAction.type, confirmedAction.entityType, result.data))
  }

  if (loading && !departments.length && !teams.length) return <main className="admin-content"><AdminStatePanel kind="loading" title="Loading organization" body="Reading the protected department and team catalogs…" /></main>
  if (error && !departments.length && !teams.length) return <main className="admin-content"><AdminStatePanel kind="error" title="Organization unavailable" body={error.message} onRetry={refresh} /></main>

  return (
    <main className="admin-content">
      <div className="admin-page-heading">
        <div><p>Organization</p><h1>Departments & teams</h1><span>Manage the canonical Pulse organization without deleting identity or access history.</span></div>
        <Button type="button" variant="secondary" loading={loading} onClick={refresh}>Refresh</Button>
      </div>
      <section className="admin-filter-bar admin-filter-bar--organization" aria-label="Organization filters">
        <label className="admin-search"><span>Search organization</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, code, description, or department" /></label>
        {teamRead && departmentRead && <label className="admin-filter"><span>Team department</span><select value={departmentId} onChange={(event) => setDepartmentId(event.target.value)}><option value="">All departments</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></label>}
      </section>
      {notice && <p className="admin-operation-notice" role="status">{notice}</p>}
      {departmentRead && <OrganizationSection title="Departments" description="Top-level organization units. Deactivation requires every active dependency to be resolved first." items={departments} type="department" canManage={departmentManage} query={query} departmentId="" onAction={openAction} />}
      {teamRead && <OrganizationSection title="Teams" description="Department-owned operating groups. Teams cannot be moved between departments in this checkpoint." items={teams} type="team" canManage={teamManage} query={query} departmentId={departmentId} onAction={openAction} />}
      {action && <OrganizationActionDialog action={action} departments={departments} submitting={submitting} error={mutationError} onCancel={cancelAction} onConfirm={confirmAction} />}
    </main>
  )
}
