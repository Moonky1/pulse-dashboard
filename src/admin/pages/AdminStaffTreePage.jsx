import { useMemo } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '../../components/ui/Button.jsx'
import { AdminStatePanel } from '../components/AdminStatePanel.jsx'
import { LifecycleBadge } from '../components/LifecycleBadge.jsx'
import { StaffAvatar } from '../components/StaffAvatar.jsx'
import { buildStaffTree } from '../peopleViewModel.js'
import { useManagedUsers } from '../hooks/useManagedUsers.js'

function Person({ person }) {
  const destination = person.status === 'pending_approval' ? `/admin/pending/${person.id}` : `/admin/users/${person.id}`
  return (
    <Link className="admin-tree-person" to={destination} aria-label={`Open ${person.fullName}'s staff profile`}>
      <StaffAvatar name={person.fullName} size="sm" />
      <span><strong>{person.fullName}</strong><small>{person.positionName || 'Position not assigned'}</small></span>
      <LifecycleBadge status={person.status} />
    </Link>
  )
}

export function AdminStaffTreePage() {
  const { users, directory, loading, error, refresh } = useManagedUsers({ includeDetails: true })
  const tree = useMemo(() => buildStaffTree(users, directory), [directory, users])
  if (loading && !users.length) return <main className="admin-content"><AdminStatePanel kind="loading" title="Loading Staff Tree" body="Organizing the company directory…" /></main>
  if (error && !users.length) return <main className="admin-content"><AdminStatePanel kind="error" title="Staff Tree unavailable" body={error.message} onRetry={refresh} /></main>

  return (
    <main className="admin-content">
      <Link className="admin-back-link" to="/admin/users">← Back to people</Link>
      <div className="admin-page-heading">
        <div><p>Company directory</p><h1>Staff Tree</h1><span>A simple view of departments, teams and the people in them.</span></div>
        <Button type="button" variant="secondary" loading={loading} onClick={refresh}>Refresh</Button>
      </div>
      {!users.length ? <AdminStatePanel kind="empty" title="No people yet" body="Staff will appear here as the company directory grows." /> : (
        <section className="admin-staff-tree" aria-label="Staff Tree">
          {tree.map((department) => (
            <article className="admin-tree-department" key={department.id}>
              <header><span>Department</span><h2>{department.name}</h2><small>{department.peopleCount} {department.peopleCount === 1 ? 'person' : 'people'}</small></header>
              <div className="admin-tree-teams">
                {department.teams.length ? department.teams.map((team) => (
                  <section className="admin-tree-team" key={team.id}>
                    <div className="admin-tree-team__heading"><span>Team</span><h3>{team.name}</h3></div>
                    {team.people.length ? <div className="admin-tree-people">{team.people.map((person) => <Person key={person.id} person={person} />)}</div> : <p className="admin-tree-empty">No people assigned yet.</p>}
                  </section>
                )) : <p className="admin-tree-empty">No teams in this department yet.</p>}
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  )
}
