import { Badge } from '../../components/ui/Badge.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { useAuth } from '../AuthProvider.jsx'
import { Brand } from '../components/AuthShell.jsx'

export function PendingApprovalPage() {
  const { profile, refreshProfile, signOut, loading } = useAuth()
  return (
    <main className="auth-status-page">
      <header><Brand compact /></header>
      <Card level={2} className="auth-status-card">
        <div className="auth-status-orbit" aria-hidden="true"><span /></div>
        <Badge tone="pending" dot>Awaiting approval</Badge>
        <h1>Your Pulse account is verified.</h1>
        <p>Your account is waiting for company approval. An authorized reviewer will assign your access and activate your account.</p>
        <dl className="auth-profile-summary">
          <div><dt>Name</dt><dd>{profile?.full_name}</dd></div>
          <div><dt>Email</dt><dd>{profile?.email}</dd></div>
          <div><dt>Status</dt><dd>Pending approval</dd></div>
        </dl>
        <div className="auth-status-actions">
          <Button type="button" loading={loading} onClick={refreshProfile}>Refresh status</Button>
          <Button type="button" variant="ghost" onClick={signOut}>Sign out</Button>
        </div>
      </Card>
      <p className="auth-status-footnote">No action is required unless a company reviewer contacts you.</p>
    </main>
  )
}
