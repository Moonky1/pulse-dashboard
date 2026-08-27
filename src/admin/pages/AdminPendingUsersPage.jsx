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

  if (loading && !users.length) return <main className="admin-content"><AdminStatePanel kind="loading" title="Loading pending users" body="Reading the protected pending-approval queue…" /></main>
  if (error && !users.length) return <main className="admin-content"><AdminStatePanel kind="error" title="Pending users unavailable" body={error.message} onRetry={refresh} /></main>

  return (
    <main className="admin-content">
      <div className="admin-page-heading">
        <div><p>Identity & access</p><h1>Pending approval</h1><span>Review verified registrations awaiting an authorized Pulse decision.</span></div>
        <Button type="button" variant="secondary" loading={loading} onClick={refresh}>Refresh</Button>
      </div>
      <section className="admin-filter-bar admin-filter-bar--pending" aria-label="Pending user filters">
        <label className="admin-search"><span>Search pending users</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name or verified Auth email" /></label>
      </section>
      <div className="admin-list-meta" aria-live="polite"><strong>{filtered.length}</strong> of {users.length} pending users <span>Protected read</span></div>
      {!users.length ? <AdminStatePanel kind="empty" title="No pending users" body="No verified registrations are awaiting approval." />
        : !filtered.length ? <AdminStatePanel kind="empty" title="No matching pending users" body="Adjust the search to broaden these results." />
          : <section className="admin-users" aria-label="Pending users">
            <div className="admin-table admin-table--pending" role="table">
              <div className="admin-table__head" role="row"><span>Identity</span><span>Auth</span><span>Lifecycle</span><span aria-label="Details" /></div>
              {filtered.map((user) => (
                <article className="admin-user-row" role="row" key={user.id}>
                  <div className="admin-user-identity"><strong>{user.fullName}</strong><span>{user.employeeId || 'Employee ID assigned on approval'}</span><small>{user.email}</small></div>
                  <div className="admin-cell-text"><span className="admin-mobile-label">Auth</span><strong>{user.authEmailConfirmed ? 'Verified email' : 'Verification unavailable'}</strong><small>Supabase Auth identity</small></div>
                  <div><span className="admin-mobile-label">Lifecycle</span><LifecycleBadge status={user.status} /></div>
                  <Link className="admin-detail-link" to={`/admin/pending/${user.id}`} aria-label={`Review ${user.fullName}`}>Review</Link>
                </article>
              ))}
            </div>
          </section>}
    </main>
  )
}
