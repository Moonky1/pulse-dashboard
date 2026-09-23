import { Badge } from '../../components/ui/Badge.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { TeamBadge } from './TeamBadge.jsx'

function formatDate(value) {
  if (!value) return 'Not set'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Unavailable' : date.toLocaleDateString()
}

export function OperationalAssignments({ assignments = [], loading = false, error = null, onRetry }) {
  return (
    <Card level={2} className="admin-detail-card admin-detail-card--wide">
      <p className="admin-section-label">Work assignments</p>
      <h2>Campaign assignments</h2>
      <p className="admin-concept-note">Campaign and team assignments show where this person works day to day.</p>
      {loading && !assignments.length && <p className="admin-muted">Loading campaign assignments…</p>}
      {error && !assignments.length && <div className="admin-inline-state"><span>{error.message}</span>{onRetry && <button type="button" onClick={onRetry}>Try again</button>}</div>}
      {!loading && !error && !assignments.length && <p className="admin-empty-inline">No campaigns assigned.</p>}
      {assignments.length > 0 && (
        <ul className="admin-assignment-list">
          {assignments.map((assignment) => (
            <li key={assignment.id}>
              <div className="admin-assignment-list__heading">
                <div><strong>{assignment.positionName}</strong></div>
                <div>{assignment.isPrimary && <Badge tone="info">Primary</Badge>}<Badge tone={assignment.isActive ? 'success' : 'neutral'} dot>{assignment.isActive ? 'Active' : 'Historical'}</Badge></div>
              </div>
              <dl>
                <div><dt>Campaign</dt><dd>{assignment.campaignName}</dd></div>
                <div><dt>Team</dt><dd>{assignment.teamName ? <TeamBadge teamId={assignment.teamId} name={assignment.teamName} code={assignment.teamCode} campaignCode={assignment.campaignCode} /> : 'Campaign-wide'}</dd></div>
                <div><dt>Started</dt><dd>{formatDate(assignment.startedAt)}</dd></div>
                <div><dt>Ended</dt><dd>{assignment.endedAt ? formatDate(assignment.endedAt) : 'Current'}</dd></div>
              </dl>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
