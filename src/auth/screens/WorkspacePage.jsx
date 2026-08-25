import { Badge } from '../../components/ui/Badge.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { useAuth } from '../AuthProvider.jsx'
import { Brand } from '../components/AuthShell.jsx'

export function WorkspacePage() {
  const { profile, signOut } = useAuth()
  return (
    <main className="auth-workspace">
      <header><Brand compact /><Button type="button" variant="ghost" onClick={signOut}>Sign out</Button></header>
      <Card level={2} className="auth-workspace-card">
        <Badge tone="success" dot>Active</Badge>
        <p className="auth-eyebrow">Authenticated foundation</p>
        <h1>Pulse Workspace — Foundation Ready</h1>
        <p>Welcome, {profile?.display_name || profile?.full_name}. Your Supabase session and canonical Pulse profile are active.</p>
        <p className="auth-safe-detail">The production workspace will be built in a future checkpoint.</p>
      </Card>
    </main>
  )
}
