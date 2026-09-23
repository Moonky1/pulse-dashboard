import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '../../components/ui/Button.jsx'
import { AdminStatePanel } from '../components/AdminStatePanel.jsx'
import { LifecycleBadge } from '../components/LifecycleBadge.jsx'
import { RoleScopeList } from '../components/RoleScopeList.jsx'
import { StaffAvatar } from '../components/StaffAvatar.jsx'
import { TeamBadge } from '../components/TeamBadge.jsx'
import { directoryMaps, filterManagedUsers, roleOptions } from '../adminViewModel.js'
import { useManagedUsers } from '../hooks/useManagedUsers.js'

const STATUS_OPTIONS = [
  ['', 'All statuses'],
  ['pending_approval', 'Awaiting approval'],
  ['active', 'Active'],
  ['blocked', 'Blocked'],
  ['inactive', 'Inactive'],
]

function Filter({ label, value, onChange, children }) {
  return <label className="admin-filter"><span>{label}</span><select value={value} onChange={onChange}>{children}</select></label>
}

export function AdminUsersPage() {
  const { users, directory, loading, error, refresh } = useManagedUsers({ includeDetails: true })
  const [filters, setFilters] = useState({ query: '', status: '', departmentId: '', teamId: '', roleKey: '' })
  const maps = useMemo(() => directoryMaps(directory), [directory])
  const roles = useMemo(() => roleOptions(users), [users])
  const teams = useMemo(() => {
    const values = new Map(directory.teams.map((team) => [team.id, team]))
    users.forEach((user) => {
      if (user.primaryTeamId) values.set(user.primaryTeamId, { id: user.primaryTeamId, name: user.primaryTeamName, code: user.primaryTeamCode, campaignCode: user.primaryCampaignCode })
    })
    return [...values.values()].sort((left, right) => left.name.localeCompare(right.name))
  }, [directory.teams, users])
  const filtered = useMemo(() => filterManagedUsers(users, filters), [users, filters])
  const update = (key) => (event) => {
    const value = event.target.value
    setFilters((current) => ({ ...current, [key]: value }))
  }

  if (loading && !users.length) return <main className="admin-content"><AdminStatePanel kind="loading" title="Loading people" body="Getting the latest staff profiles…" /></main>
  if (error && !users.length) return <main className="admin-content"><AdminStatePanel kind="error" title="People unavailable" body={error.message} onRetry={refresh} /></main>

  return (
    <main className="admin-content">
      <div className="admin-page-heading">
        <div><p>Company directory</p><h1>People</h1><span>Find teammates and see where they work across Pulse</span></div>
        <div className="admin-heading-actions"><Link className="admin-secondary-link" to="/admin/staff-tree">Staff Tree</Link><Button type="button" variant="secondary" loading={loading} onClick={refresh}>Refresh</Button></div>
      </div>

      <section className="admin-filter-bar" aria-label="User filters">
        <label className="admin-search"><span>Search</span><input value={filters.query} onChange={update('query')} placeholder="Name, employee ID, or email" /></label>
        <Filter label="Status" value={filters.status} onChange={update('status')}>{STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Filter>
        <Filter label="Department" value={filters.departmentId} onChange={update('departmentId')}><option value="">All departments</option>{directory.departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Filter>
        <Filter label="Team" value={filters.teamId} onChange={update('teamId')}><option value="">All teams</option>{teams.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Filter>
        <Filter label="Role" value={filters.roleKey} onChange={update('roleKey')}><option value="">All roles</option>{roles.map(([key, name]) => <option key={key} value={key}>{name}</option>)}</Filter>
      </section>

      <div className="admin-list-meta" aria-live="polite"><strong>{filtered.length}</strong> of {users.length} people</div>
      {!users.length ? <AdminStatePanel kind="empty" title="No people yet" body="Staff profiles will appear here." />
        : !filtered.length ? <AdminStatePanel kind="empty" title="No matching people" body="Adjust the search or filters to broaden these results." />
          : <section className="admin-users" aria-label="People">
            <div className="admin-table admin-people-table" role="table">
              <div className="admin-table__head" role="row"><span>Person</span><span>Work details</span><span>Pulse access</span><span>Status</span><span aria-label="Open profile" /></div>
              {filtered.map((user) => (
                <Link className="admin-user-row" role="row" key={user.id} to={user.status === 'pending_approval' ? `/admin/pending/${user.id}` : `/admin/users/${user.id}`} aria-label={`Open ${user.fullName}'s staff profile`}>
                  <div className="admin-user-identity admin-user-identity--avatar"><StaffAvatar name={user.fullName} /><span><strong>{user.fullName}</strong><small>{user.employeeId || 'Employee ID pending'}</small></span></div>
                  <div className="admin-cell-text"><span className="admin-mobile-label">Work details</span><strong>{user.positionName || 'Position not assigned'}</strong><small>{user.primaryCampaignName || maps.departments.get(user.departmentId) || 'Department not assigned'}</small>{user.primaryTeamName && <TeamBadge teamId={user.primaryTeamId} name={user.primaryTeamName} code={user.primaryTeamCode} campaignCode={user.primaryCampaignCode} />}</div>
                  <div><span className="admin-mobile-label">Pulse access</span><RoleScopeList roles={user.roles} directory={directory} compact /></div>
                  <div><span className="admin-mobile-label">Status</span><LifecycleBadge status={user.status} /></div>
                  <span className="admin-row-arrow" aria-hidden="true">→</span>
                </Link>
              ))}
            </div>
          </section>}
    </main>
  )
}
