import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '../../components/ui/Button.jsx'
import { AdminStatePanel } from '../components/AdminStatePanel.jsx'
import { LifecycleBadge } from '../components/LifecycleBadge.jsx'
import { RoleBadge } from '../components/RoleBadge.jsx'
import { StaffAvatar } from '../components/StaffAvatar.jsx'
import { TeamBadge } from '../components/TeamBadge.jsx'
import { useBusinessCatalog } from '../hooks/useBusinessCatalog.js'
import { useManagedUsers } from '../hooks/useManagedUsers.js'
import { buildStaffTreeV2, filterStaffTreeV2, staffTreeBranchIds } from '../staffTreeViewModel.js'

function PersonCard({ person }) {
  const destination = person.status === 'pending_approval' ? `/admin/pending/${person.id}` : `/admin/users/${person.id}`
  return (
    <Link className="admin-tree-person" to={destination} aria-label={`Open ${person.fullName}'s staff profile`}>
      <StaffAvatar name={person.fullName} customAvatarPath={person.customAvatarPath} googleAvatarUrl={person.googleAvatarUrl} avatarUpdatedAt={person.avatarUpdatedAt} size="sm" />
      <span className="admin-tree-person__identity">
        <strong>{person.fullName}</strong>
        <small>{person.positionName || 'Position not assigned'}</small>
        {person.teamName && <TeamBadge name={person.teamName} code={person.primaryTeamCode} campaignCode={person.primaryCampaignCode} linked={false} />}
        {person.roles?.[0] && <RoleBadge role={person.roles[0]} />}
        {person.qaCoverage?.length ? (
          <span className="admin-tree-person__coverage" aria-label="Secondary quality coverage">
            {person.qaCoverage.map((coverage) => <i key={`${coverage.teamId}:${coverage.teamName}`}>QA · {coverage.teamName}</i>)}
          </span>
        ) : null}
      </span>
      <span className="admin-tree-person__status"><LifecycleBadge status={person.status} /></span>
    </Link>
  )
}

function PeopleGroup({ label, people }) {
  if (!people.length) return null
  return <section className="admin-tree-people-group"><h4>{label}</h4><div className="admin-tree-people" aria-label={`${label} people`}>{people.map((person) => <PersonCard key={person.id} person={person} />)}</div></section>
}

function ReportingNode({ node }) {
  return (
    <li className="admin-reporting-node">
      <PersonCard person={node.person} />
      {node.reports.length ? (
        <ul className="admin-reporting-children" aria-label={`Direct reports to ${node.person.fullName}`}>
          {node.reports.map((report) => <ReportingNode key={report.person.id} node={report} />)}
        </ul>
      ) : null}
    </li>
  )
}

function BranchToggle({ expanded, label, onClick }) {
  return (
    <button className="admin-tree-toggle" type="button" aria-expanded={expanded} onClick={onClick}>
      <span aria-hidden="true">{expanded ? '−' : '+'}</span>
      <span className="pulse-sr-only">{expanded ? 'Collapse' : 'Expand'} {label}</span>
    </button>
  )
}

export function StaffTreeDirectory({ users, directory, relationships, catalog }) {
  const [query, setQuery] = useState('')
  const [departmentId, setDepartmentId] = useState('all')
  const [expansion, setExpansion] = useState(() => ({ mode: 'default', overrides: new Map() }))
  const tree = useMemo(() => buildStaffTreeV2(users, directory, relationships, catalog), [catalog, directory, relationships, users])
  const branchIds = useMemo(() => staffTreeBranchIds(tree), [tree])
  const filteredTree = useMemo(() => filterStaffTreeV2(tree, { query, departmentId }), [departmentId, query, tree])
  const searchActive = Boolean(query.trim())
  const defaultExpanded = useMemo(() => {
    if (tree.peopleCount <= 24) return new Set(branchIds)
    const firstDepartment = tree.departments[0]
    return new Set(firstDepartment
      ? [`department:${firstDepartment.id}`, firstDepartment.teams[0] && `team:${firstDepartment.teams[0].id}`].filter(Boolean)
      : [])
  }, [branchIds, tree.departments, tree.peopleCount])

  const branchIsExpanded = (id) => {
    if (expansion.overrides.has(id)) return expansion.overrides.get(id)
    if (expansion.mode === 'all') return true
    if (expansion.mode === 'none') return false
    return defaultExpanded.has(id)
  }
  const isExpanded = (id) => searchActive || branchIsExpanded(id)
  const toggle = (id) => setExpansion((current) => {
    const overrides = new Map(current.overrides)
    const currentValue = overrides.has(id)
      ? overrides.get(id)
      : current.mode === 'all' || (current.mode === 'default' && defaultExpanded.has(id))
    overrides.set(id, !currentValue)
    return { ...current, overrides }
  })

  return (
    <>
      {!users.length ? <AdminStatePanel kind="empty" title="No people yet" body="Staff will appear here as the company directory grows." /> : (
        <>
          <section className="admin-tree-toolbar" aria-label="Staff Tree controls">
            <label className="admin-search"><span>Find a person or team</span><input type="search" value={query} placeholder="Name, employee ID, position, team…" onChange={(event) => setQuery(event.target.value)} /></label>
            <label className="admin-filter"><span>Organization area</span><select value={departmentId} onChange={(event) => setDepartmentId(event.target.value)}><option value="all">All areas</option>{tree.departments.map((department) => <option value={department.id} key={department.id}>{department.name}</option>)}</select></label>
            <div className="admin-tree-toolbar__actions">
              <Button type="button" variant="secondary" size="sm" onClick={() => setExpansion({ mode: 'all', overrides: new Map() })}>Expand all</Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => setExpansion({ mode: 'none', overrides: new Map() })}>Collapse all</Button>
            </div>
          </section>

          <section className="admin-staff-tree" aria-label="Kampaign Kings Staff Tree">
            <header className="admin-tree-company">
              <span className="admin-tree-company__mark" aria-hidden="true">KK</span>
              <span><small>Company</small><strong>{tree.name}</strong><b>{filteredTree.peopleCount} {filteredTree.peopleCount === 1 ? 'person' : 'people'} in view</b></span>
            </header>

            {!filteredTree.departments.length ? <AdminStatePanel kind="empty" title="No matching people" body="Try another name, team or department." /> : (
              <div className="admin-tree-departments">
                {filteredTree.departments.map((department) => {
                  const departmentBranch = `department:${department.id}`
                  const departmentOpen = isExpanded(departmentBranch)
                  return (
                    <article className="admin-tree-department" key={department.id}>
                      <header>
                        <BranchToggle expanded={departmentOpen} label={department.name} onClick={() => toggle(departmentBranch)} />
                        <span><small>{department.kind === 'business_area' ? 'Business area' : 'Department'}</small><strong>{department.name}</strong><b>{department.peopleCount} {department.peopleCount === 1 ? 'person' : 'people'}</b></span>
                      </header>
                      {departmentOpen ? (
                        <div className="admin-tree-teams">
                          {department.teams.length ? department.teams.map((team) => {
                            const teamBranch = `team:${team.id}`
                            const teamOpen = isExpanded(teamBranch)
                            return (
                              <section className="admin-tree-team" key={team.id}>
                                <header className="admin-tree-team__heading">
                                  <BranchToggle expanded={teamOpen} label={team.name} onClick={() => toggle(teamBranch)} />
                                  <span><small>{team.campaignName ? [team.campaignName, team.operatingUnitName].filter(Boolean).join(' · ') : 'Team'}</small><TeamBadge teamId={String(team.id).includes('unassigned') ? null : team.id} name={team.name} code={team.code} campaignCode={team.campaignCode} />{team.campaignName ? <b>Team</b> : null}</span>
                                  <em>{team.people.length}</em>
                                </header>
                                {teamOpen ? team.people.length ? (
                                  team.hasReportingData ? (
                                    <ul className="admin-reporting-forest" aria-label={`${team.name} reporting structure`}>
                                      {team.roots.map((root) => <ReportingNode key={root.person.id} node={root} />)}
                                    </ul>
                                  ) : (
                                    <div className="admin-tree-grouped-people"><PeopleGroup label="Leadership" people={team.leadership ?? []} /><PeopleGroup label="Staff" people={team.staff ?? []} /></div>
                                  )
                                ) : <p className="admin-tree-empty">No people assigned yet.</p> : null}
                              </section>
                            )
                          }) : <p className="admin-tree-empty">No teams in this department yet.</p>}
                        </div>
                      ) : null}
                    </article>
                  )
                })}
              </div>
            )}
          </section>
          <p className="admin-tree-note">Reporting lines appear only when they are explicitly recorded. Quality coverage is shown as secondary context and does not change a person’s home team, reporting line or Pulse access.</p>
        </>
      )}
    </>
  )
}

export function AdminStaffTreePage() {
  const { users, directory, loading, error, refresh } = useManagedUsers({ includeDetails: true })
  const catalogState = useBusinessCatalog()
  const combinedLoading = loading || catalogState.loading
  const combinedError = error || catalogState.error
  if (combinedLoading && !users.length) return <main className="admin-content"><AdminStatePanel kind="loading" title="Loading Staff Tree" body="Organizing the company directory…" /></main>
  if (combinedError && !users.length) return <main className="admin-content"><AdminStatePanel kind="error" title="Staff Tree unavailable" body={combinedError.message} onRetry={() => Promise.all([refresh(), catalogState.refresh()])} /></main>

  return (
    <main className="admin-content admin-content--staff-tree">
      <Link className="admin-back-link" to="/admin/users">← Back to people</Link>
      <div className="admin-page-heading">
        <div><p>Company structure</p><h1>Staff Tree</h1><span>Explore the company by department and Team · Reporting lines appear only when explicitly recorded</span></div>
        <Button type="button" variant="secondary" loading={combinedLoading} onClick={() => Promise.all([refresh(), catalogState.refresh()])}>Refresh</Button>
      </div>
      <StaffTreeDirectory users={users} directory={directory} catalog={catalogState.catalog} />
    </main>
  )
}
