import { Button } from '../../components/ui/Button.jsx'
import { AdminStatePanel } from './AdminStatePanel.jsx'
import { auditActionLabel, auditSummary, formatAuditTime } from '../auditViewModel.js'

function AuditEvent({ event }) {
  const organization = event.scope?.campaignName || event.scope?.teamName || event.scope?.departmentName
  const category = ({ account: 'Account', roles: 'Access', organization: 'Organization', system: 'System' })[event.category] ?? 'Activity'
  return (
    <article className="admin-audit-event">
      <div className="admin-audit-event__marker" aria-hidden="true" />
      <div className="admin-audit-event__body">
        <div className="admin-audit-event__heading"><div><span>{category}</span><h3>{auditActionLabel(event.action)}</h3></div><time dateTime={event.occurredAt}>{formatAuditTime(event.occurredAt)}</time></div>
        <p>{auditSummary(event)}</p>
        <div className="admin-audit-event__facts">
          {event.actor?.employeeId && <span>Actor {event.actor.employeeId}</span>}
          {event.target?.employeeId && <span>Target {event.target.employeeId}</span>}
          {event.role?.name && <span>Role {event.role.name}</span>}
          {organization && <span>Access area {organization}</span>}
        </div>
        {event.reason && <p className="admin-audit-event__reason"><strong>Note:</strong> {event.reason}</p>}
      </div>
    </article>
  )
}

export function AuditTimeline({ events, loading, loadingMore, error, hasMore, onRetry, onLoadMore, compact = false }) {
  if (loading && !events.length) return <AdminStatePanel kind="loading" title="Loading activity" body="Getting the latest changes…" />
  if (error && !events.length) return <AdminStatePanel kind="error" title="Activity unavailable" body={error.message} onRetry={onRetry} />
  if (!events.length) return <AdminStatePanel kind="empty" title="No activity" body="No activity matches this view." />
  return (
    <div className={compact ? 'admin-audit-timeline admin-audit-timeline--compact' : 'admin-audit-timeline'}>
      {events.map((event) => <AuditEvent key={event.id} event={event} />)}
      {error && <p className="admin-operation-error" role="alert">{error.message}</p>}
      {hasMore && <div className="admin-audit-load-more"><Button type="button" variant="secondary" loading={loadingMore} onClick={onLoadMore}>Load older events</Button></div>}
    </div>
  )
}
