import { Button } from '../../components/ui/Button.jsx'
import { AuditTimeline } from './AuditTimeline.jsx'
import { useAuditEvents } from '../hooks/useAuditEvents.js'

export function UserAuditHistory({ userId }) {
  const history = useAuditEvents({ userId, limit: 10 })
  return (
    <section className="admin-history-section" aria-labelledby="user-history-heading">
      <div className="admin-history-section__heading"><div><p className="admin-section-label">Protected read</p><h2 id="user-history-heading">User history</h2><span>Authorized account, access, and lifecycle events for this user.</span></div><Button type="button" size="sm" variant="secondary" loading={history.loading} onClick={history.refresh}>Refresh</Button></div>
      <AuditTimeline {...history} onRetry={history.refresh} onLoadMore={history.loadMore} compact />
    </section>
  )
}
