import { useMemo, useRef, useState } from 'react'

import { Button } from '../../components/ui/Button.jsx'
import { buildBusinessAreaBranches } from '../businessCatalog.js'
import { canManageDepartments, canManageTeams, canViewDepartments, canViewTeams } from '../access.js'
import { useAdminPermissions } from '../AdminAccessContext.js'
import { createManagedDepartment, createManagedTeam, setManagedDepartmentActive, setManagedTeamActive, updateManagedDepartment, updateManagedTeam } from '../api/adminApi.js'
import { AdminStatePanel } from '../components/AdminStatePanel.jsx'
import { OrganizationActionDialog } from '../components/OrganizationActionDialog.jsx'
import { TeamBadge } from '../components/TeamBadge.jsx'
import { useBusinessCatalog } from '../hooks/useBusinessCatalog.js'
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
      <span><strong>{entity.pendingUserCount}</strong> awaiting approval</span>
      <span><strong>{entity.activeRoleAssignmentCount}</strong> access assignments</span>
    </div>
  )
}

function OrganizationCard({ entity, type, canManage, onAction }) {
  return (
    <article className="admin-organization-card">
      <div className="admin-organization-card__heading">
        <div><span>{type === 'team' ? 'Team' : 'Department'}</span><h3>{entity.name}</h3>{type === 'team' && <small>{entity.departmentName}</small>}</div>
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
      <div className="admin-list-meta" aria-live="polite"><strong>{filtered.length}</strong> of {items.length} {title.toLowerCase()}</div>
      {!items.length ? <AdminStatePanel kind="empty" title={`No ${title.toLowerCase()} yet`} body={`${title} will appear here once they are added.`} />
        : !filtered.length ? <AdminStatePanel kind="empty" title={`No matching ${title.toLowerCase()}`} body="Adjust the organization filters to broaden these results." />
          : <div className="admin-organization-grid">{filtered.map((entity) => <OrganizationCard key={entity.id} entity={entity} type={type} canManage={canManage} onAction={onAction} />)}</div>}
    </section>
  )
}

function BusinessAreaOverview({ catalog }) {
  const areas = useMemo(() => buildBusinessAreaBranches(catalog), [catalog])
  if (!areas.length) return null
  return (
    <section className="admin-organization-section" aria-labelledby="business-area-heading">
      <div className="admin-organization-section__heading">
        <div><h2 id="business-area-heading">Business areas</h2><p>Top-level company structure, separate from employment Departments.</p></div>
      </div>
      <div className="admin-catalog-areas">
        {areas.map((area) => (
          <article className="admin-catalog-area" key={area.id}>
            <header><div><span>Business area</span><h3>{area.name}</h3></div><Status active={area.isActive} /></header>
            <div className="admin-catalog-area__groups">
              {area.departments.map((department) => (
                <section key={department.id}>
                  <div><span>Department</span><strong>{department.name}</strong></div>
                  {department.teams.length > 0 && <div className="admin-catalog-pills">{department.teams.map((team) => <TeamBadge key={team.id} teamId={team.id} name={team.name} code={team.code} />)}</div>}
                </section>
              ))}
              {area.directTeams.length > 0 && (
                <section><div><span>Area functions</span><strong>Direct Teams</strong></div><div className="admin-catalog-pills">{area.directTeams.map((team) => <TeamBadge key={team.id} teamId={team.id} name={team.name} code={team.code} />)}</div></section>
              )}
              {area.campaigns.map((campaign) => (
                <section className="admin-catalog-area__campaign" key={campaign.id}>
                  <div><span>Campaign operations</span><strong>{campaign.name}</strong></div>
                  {campaign.units.map((unit) => <div className="admin-catalog-area__unit" key={unit.id}><small>{unit.name}</small><div className="admin-catalog-pills">{unit.teams.map((team) => <TeamBadge key={team.id} teamId={team.id} name={team.name} code={team.code} campaignCode={campaign.code} />)}</div></div>)}
                  {campaign.directTeams.length > 0 && <div className="admin-catalog-area__unit"><small>Direct Teams</small><div className="admin-catalog-pills">{campaign.directTeams.map((team) => <TeamBadge key={team.id} teamId={team.id} name={team.name} code={team.code} campaignCode={campaign.code} />)}</div></div>}
                </section>
              ))}
            </div>
          </article>
        ))}
      </div>
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
  const { catalog, loading: catalogLoading, error: catalogError, refresh: refreshCatalog } = useBusinessCatalog()
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

  if ((loading || catalogLoading) && !departments.length && !teams.length && !catalog.businessAreas.length) return <main className="admin-content"><AdminStatePanel kind="loading" title="Loading organization" body="Getting business areas, Departments and Teams…" /></main>
  if ((error || catalogError) && !departments.length && !teams.length && !catalog.businessAreas.length) return <main className="admin-content"><AdminStatePanel kind="error" title="Organization unavailable" body={(error || catalogError).message} onRetry={() => Promise.all([refresh(), refreshCatalog()])} /></main>

  return (
    <main className="admin-content">
      <div className="admin-page-heading">
        <div><p>Organization</p><h1>Departments & teams</h1><span>Keep your organization clear and up to date</span></div>
        <Button type="button" variant="secondary" loading={loading || catalogLoading} onClick={() => Promise.all([refresh(), refreshCatalog()])}>Refresh</Button>
      </div>
      <section className="admin-filter-bar admin-filter-bar--organization" aria-label="Organization filters">
        <label className="admin-search"><span>Search organization</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, description, or department" /></label>
        {teamRead && departmentRead && <label className="admin-filter"><span>Team department</span><select value={departmentId} onChange={(event) => setDepartmentId(event.target.value)}><option value="">All departments</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></label>}
      </section>
      {notice && <p className="admin-operation-notice" role="status">{notice}</p>}
      <BusinessAreaOverview catalog={catalog} />
      {departmentRead && <OrganizationSection title="Departments" description="Where people belong in the company." items={departments} type="department" canManage={departmentManage} query={query} departmentId="" onAction={openAction} />}
      {teamRead && <OrganizationSection title="Teams" description="Groups working together within the organization." items={teams} type="team" canManage={teamManage} query={query} departmentId={departmentId} onAction={openAction} />}
      {action && <OrganizationActionDialog action={action} departments={departments} submitting={submitting} error={mutationError} onCancel={cancelAction} onConfirm={confirmAction} />}
    </main>
  )
}
