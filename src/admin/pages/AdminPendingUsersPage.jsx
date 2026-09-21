import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '../../components/ui/Button.jsx'
import { AdminStatePanel } from '../components/AdminStatePanel.jsx'
import { LifecycleBadge } from '../components/LifecycleBadge.jsx'
import { filterManagedUsers } from '../adminViewModel.js'
import { useManagedUsers } from '../hooks/useManagedUsers.js'

export function AdminPendingUsersPage() {
  const { users, loading, error, refresh } = useManagedUsers({ status: 'pending_approval', includeDirectory: false })
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => filterManagedUsers(users, { query, status: 'pending_approval' }), [query, users])

  if (loading && !users.length) return <main className="admin-content"><AdminStatePanel kind="loading" title="Loading approvals" body="Getting the latest registrations…" /></main>
  if (error && !users.length) return <main className="admin-content"><AdminStatePanel kind="error" title="Approvals unavailable" body={error.message} onRetry={refresh} /></main>

  return (
    <main className="admin-content">
      <div className="admin-page-heading">
        <div><p>People</p><h1>Awaiting approval</h1><span>Review verified registrations and decide who can enter Pulse.</span></div>
        <Button type="button" variant="secondary" loading={loading} onClick={refresh}>Refresh</Button>
      </div>
      <section className="admin-filter-bar admin-filter-bar--pending" aria-label="Pending user filters">
        <label className="admin-search"><span>Search</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name or email" /></label>
      </section>
      <div className="admin-list-meta" aria-live="polite"><strong>{filtered.length}</strong> of {users.length} awaiting approval</div>
      {!users.length ? <AdminStatePanel kind="empty" title="No approvals waiting" body="New verified registrations will appear here." />
        : !filtered.length ? <AdminStatePanel kind="empty" title="No matching registrations" body="Adjust the search to broaden these results." />
          : <section className="admin-users" aria-label="Awaiting approval">
            <div className="admin-table admin-table--pending" role="table">
              <div className="admin-table__head" role="row"><span>Person</span><span>Email verified</span><span>Status</span><span aria-label="Action" /></div>
              {filtered.map((user) => (
                <article className="admin-user-row" role="row" key={user.id}>
                  <div className="admin-user-identity"><strong>{user.fullName}</strong><span>{user.employeeId || 'Employee ID assigned on approval'}</span><small>{user.email}</small></div>
                  <div className="admin-cell-text"><span className="admin-mobile-label">Email verified</span><strong>{user.authEmailConfirmed ? 'Yes' : 'Not yet'}</strong><small>{user.email}</small></div>
                  <div><span className="admin-mobile-label">Status</span><LifecycleBadge status={user.status} /></div>
                  <Link className="admin-detail-link" to={`/admin/pending/${user.id}`} aria-label={`Review ${user.fullName}`}>Review</Link>
                </article>
              ))}
            </div>
          </section>}
    </main>
  )
}
