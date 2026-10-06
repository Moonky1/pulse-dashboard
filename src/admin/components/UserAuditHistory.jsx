import { useState } from 'react'
import { Button } from '../../components/ui/Button.jsx'
import { AuditTimeline } from './AuditTimeline.jsx'
import { useAuditEvents } from '../hooks/useAuditEvents.js'

export function UserAuditHistory({ userId }) {
  const [open, setOpen] = useState(false)
  const history = useAuditEvents({ userId, limit: 10, enabled: open })
  return (
    <details className="admin-history-section admin-activity-disclosure" onToggle={event => setOpen(event.currentTarget.open)}>
      <summary><span><strong>Activity log</strong><small>Account, access and profile changes</small></span><svg aria-hidden="true" viewBox="0 0 20 20"><path d="m5 7 5 5 5-5" /></svg></summary>
      {open && <div><Button type="button" size="sm" variant="secondary" loading={history.loading} onClick={history.refresh}>Refresh</Button><AuditTimeline {...history} onRetry={history.refresh} onLoadMore={history.loadMore} compact /></div>}
    </details>
  )
}
