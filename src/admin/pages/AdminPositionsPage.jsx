import { useMemo, useState } from 'react'

import { Button } from '../../components/ui/Button.jsx'
import { AdminStatePanel } from '../components/AdminStatePanel.jsx'
import { usePositionCatalog } from '../hooks/usePositionCatalog.js'

function PositionStatus({ active }) {
  return <span className={`admin-organization-status admin-organization-status--${active ? 'active' : 'inactive'}`}>{active ? 'Active' : 'Inactive'}</span>
}

function PositionCard({ position }) {
  return (
    <article className="admin-organization-card">
      <div className="admin-organization-card__heading">
        <div><span>{position.code}</span><h3>{position.name}</h3></div>
        <PositionStatus active={position.isActive} />
      </div>
      <p>{position.description || 'No Position description has been added.'}</p>
      <div className="admin-organization-dependencies">
        <span><strong>{position.currentUserCount}</strong> current users</span>
        <span><strong>{position.activeAssignmentCount}</strong> active assignments</span>
        <span><strong>{position.assignmentCount}</strong> total assignments</span>
      </div>
    </article>
  )
}

export function AdminPositionsPage() {
  const { positions, loading, error, refresh } = usePositionCatalog()
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return positions
    return positions.filter((position) => [position.name, position.code, position.description]
      .some((value) => String(value ?? '').toLowerCase().includes(normalized)))
  }, [positions, query])

  if (loading && !positions.length) return <main className="admin-content"><AdminStatePanel kind="loading" title="Loading Positions" body="Reading the protected Position catalog…" /></main>
  if (error && !positions.length) return <main className="admin-content"><AdminStatePanel kind="error" title="Positions unavailable" body={error.message} onRetry={refresh} /></main>

  return (
    <main className="admin-content">
      <div className="admin-page-heading">
        <div><p>Workforce foundation</p><h1>Positions</h1><span>Review canonical job functions. Positions describe work; they do not grant Pulse permissions.</span></div>
        <Button type="button" variant="secondary" onClick={refresh} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</Button>
      </div>
      <section className="admin-filter-bar admin-filter-bar--positions" aria-label="Position filters">
        <label className="admin-search"><span>Search Positions</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, code, or description" /></label>
      </section>
      <div className="admin-list-meta" aria-live="polite"><strong>{filtered.length}</strong> of {positions.length} Positions <span>Protected catalog · Read-only</span></div>
      {!positions.length
        ? <AdminStatePanel kind="empty" title="No Positions" body="No canonical Position records have been created." />
        : !filtered.length
          ? <AdminStatePanel kind="empty" title="No matching Positions" body="Adjust the Position search to broaden these results." />
          : <div className="admin-organization-grid">{filtered.map((position) => <PositionCard key={position.id} position={position} />)}</div>}
    </main>
  )
}
