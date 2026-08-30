import { useState } from 'react'

import { Button } from '../../components/ui/Button.jsx'
import { AuditTimeline } from '../components/AuditTimeline.jsx'
import { useAuditEvents } from '../hooks/useAuditEvents.js'
import { AUDIT_CATEGORIES } from '../auditViewModel.js'

export function AdminAuditPage() {
  const [filters, setFilters] = useState({ category: '', from: '', to: '' })
  const audit = useAuditEvents({ filters })
  const changeFilter = (key) => (event) => setFilters((current) => ({ ...current, [key]: event.target.value }))
  return (
    <main className="admin-content">
      <div className="admin-page-heading"><div><p>Governance</p><h1>Audit</h1><span>Review a bounded, server-authorized history of sensitive Pulse operations.</span></div><Button type="button" variant="secondary" loading={audit.loading} onClick={audit.refresh}>Refresh</Button></div>
      <section className="admin-filter-bar admin-filter-bar--audit" aria-label="Audit filters">
        <label className="admin-filter"><span>Category</span><select value={filters.category} onChange={changeFilter('category')}>{AUDIT_CATEGORIES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        <label className="admin-filter"><span>From</span><input type="date" value={filters.from} onChange={changeFilter('from')} /></label>
        <label className="admin-filter"><span>To</span><input type="date" value={filters.to} onChange={changeFilter('to')} /></label>
      </section>
      <div className="admin-list-meta" aria-live="polite"><strong>{audit.events.length}</strong> authorized events <span>Protected history</span></div>
      <AuditTimeline {...audit} onRetry={audit.refresh} onLoadMore={audit.loadMore} />
    </main>
  )
}
