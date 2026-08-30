import { Button } from '../../components/ui/Button.jsx'
import { AdminStatePanel } from './AdminStatePanel.jsx'
import { auditActionLabel, auditSummary, formatAuditTime } from '../auditViewModel.js'

function AuditEvent({ event }) {
  const organization = event.scope?.teamName || event.scope?.departmentName
  return (
    <article className="admin-audit-event">
      <div className="admin-audit-event__marker" aria-hidden="true" />
      <div className="admin-audit-event__body">
        <div className="admin-audit-event__heading"><div><span>{event.category}</span><h3>{auditActionLabel(event.action)}</h3></div><time dateTime={event.occurredAt}>{formatAuditTime(event.occurredAt)}</time></div>
        <p>{auditSummary(event)}</p>
        <div className="admin-audit-event__facts">
          {event.actor?.employeeId && <span>Actor {event.actor.employeeId}</span>}
          {event.target?.employeeId && <span>Target {event.target.employeeId}</span>}
          {event.role?.name && <span>Role {event.role.name}</span>}
          {event.scope?.type && <span>Scope {event.scope.type}</span>}
          {organization && <span>{organization}</span>}
          <span>Source {event.source}</span>
        </div>
        {event.reason && <p className="admin-audit-event__reason"><strong>Audit note:</strong> {event.reason}</p>}
      </div>
    </article>
  )
}

export function AuditTimeline({ events, loading, loadingMore, error, hasMore, onRetry, onLoadMore, compact = false }) {
  if (loading && !events.length) return <AdminStatePanel kind="loading" title="Loading audit history" body="Reading the protected audit contract…" />
  if (error && !events.length) return <AdminStatePanel kind="error" title="Audit history unavailable" body={error.message} onRetry={onRetry} />
  if (!events.length) return <AdminStatePanel kind="empty" title="No audit events" body="No authorized events match this view." />
  return (
    <div className={compact ? 'admin-audit-timeline admin-audit-timeline--compact' : 'admin-audit-timeline'}>
      {events.map((event) => <AuditEvent key={event.id} event={event} />)}
      {error && <p className="admin-operation-error" role="alert">{error.message}</p>}
      {hasMore && <div className="admin-audit-load-more"><Button type="button" variant="secondary" loading={loadingMore} onClick={onLoadMore}>Load older events</Button></div>}
    </div>
  )
}
