import { Button } from '../../components/ui/Button.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'

export function AdminStatePanel({ kind, title, body, onRetry }) {
  return (
    <Card level={2} className="admin-state" role={kind === 'error' ? 'alert' : 'status'}>
      {kind === 'loading' && <Spinner size="md" label={title} />}
      <h2>{title}</h2>
      <p>{body}</p>
      {onRetry && <Button type="button" variant="secondary" onClick={onRetry}>Try again</Button>}
    </Card>
  )
}
