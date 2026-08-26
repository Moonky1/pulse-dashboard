import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '../../components/ui/Button.jsx'
import { AdminStatePanel } from '../components/AdminStatePanel.jsx'
import { LifecycleBadge } from '../components/LifecycleBadge.jsx'
import { RoleScopeList } from '../components/RoleScopeList.jsx'
import { directoryMaps, filterManagedUsers, roleOptions } from '../adminViewModel.js'
import { useManagedUsers } from '../hooks/useManagedUsers.js'

const STATUS_OPTIONS = [
  ['', 'All lifecycle states'],
  ['pending_approval', 'Pending approval'],
  ['active', 'Active'],
  ['blocked', 'Blocked'],
  ['inactive', 'Inactive'],
]

function Filter({ label, value, onChange, children }) {
  return <label className="admin-filter"><span>{label}</span><select value={value} onChange={onChange}>{children}</select></label>
}

export function AdminUsersPage() {
  const { users, directory, loading, error, refresh } = useManagedUsers()
  const [filters, setFilters] = useState({ query: '', status: '', departmentId: '', teamId: '', roleKey: '' })
  const maps = useMemo(() => directoryMaps(directory), [directory])
  const roles = useMemo(() => roleOptions(users), [users])
  const filtered = useMemo(() => filterManagedUsers(users, filters), [users, filters])
  const update = (key) => (event) => {
    const value = event.target.value
    setFilters((current) => ({ ...current, [key]: value }))
  }

  if (loading && !users.length) return <main className="admin-content"><AdminStatePanel kind="loading" title="Loading users" body="Reading the authorized Pulse workforce directory…" /></main>
  if (error && !users.length) return <main className="admin-content"><AdminStatePanel kind="error" title="Users unavailable" body={error.message} onRetry={refresh} /></main>

  return (
    <main className="admin-content">
      <div className="admin-page-heading">
        <div><p>Identity & access</p><h1>Users</h1><span>Inspect lifecycle, organization, and role scope from the canonical Pulse directory.</span></div>
        <Button type="button" variant="secondary" loading={loading} onClick={refresh}>Refresh</Button>
      </div>

      <section className="admin-filter-bar" aria-label="User filters">
        <label className="admin-search"><span>Search users</span><input value={filters.query} onChange={update('query')} placeholder="Name, employee ID, or email" /></label>
        <Filter label="Status" value={filters.status} onChange={update('status')}>{STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Filter>
        <Filter label="Department" value={filters.departmentId} onChange={update('departmentId')}><option value="">All departments</option>{directory.departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Filter>
        <Filter label="Team" value={filters.teamId} onChange={update('teamId')}><option value="">All teams</option>{directory.teams.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Filter>
        <Filter label="Role" value={filters.roleKey} onChange={update('roleKey')}><option value="">All roles</option>{roles.map(([key, name]) => <option key={key} value={key}>{name}</option>)}</Filter>
      </section>

      <div className="admin-list-meta" aria-live="polite"><strong>{filtered.length}</strong> of {users.length} users <span>Read-only</span></div>
      {!users.length ? <AdminStatePanel kind="empty" title="No Pulse users" body="The authorized directory returned no user records." />
        : !filtered.length ? <AdminStatePanel kind="empty" title="No matching users" body="Adjust the search or filters to broaden these results." />
          : <section className="admin-users" aria-label="Managed users">
            <div className="admin-table" role="table">
              <div className="admin-table__head" role="row"><span>Identity</span><span>Lifecycle</span><span>Organization</span><span>Access</span><span aria-label="Details" /></div>
              {filtered.map((user) => (
                <article className="admin-user-row" role="row" key={user.id}>
                  <div className="admin-user-identity"><strong>{user.fullName}</strong><span>{user.employeeId || 'Employee ID pending'}</span><small>{user.email}</small></div>
                  <div><span className="admin-mobile-label">Lifecycle</span><LifecycleBadge status={user.status} /></div>
                  <div className="admin-cell-text"><span className="admin-mobile-label">Organization</span><strong>{maps.departments.get(user.departmentId) || 'Unassigned'}</strong><small>{maps.teams.get(user.teamId) || 'No team'}</small></div>
                  <div><span className="admin-mobile-label">Access</span><RoleScopeList roles={user.roles} directory={directory} compact /></div>
                  <Link className="admin-detail-link" to={`/admin/users/${user.id}`} aria-label={`View ${user.fullName}`}>View</Link>
                </article>
              ))}
            </div>
          </section>}
    </main>
  )
}
