import { Button } from '../../components/ui/Button.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'
import { useAuth } from '../AuthProvider.jsx'
import { Brand } from '../components/AuthShell.jsx'

const content = {
  blocked: { eyebrow: 'Access denied', title: 'This account is blocked.', body: 'Your Pulse access has been restricted. Contact an authorized company administrator if you believe this is an error.' },
  inactive: { eyebrow: 'Account inactive', title: 'This account is inactive.', body: 'Your company identity is valid, but Pulse access is not currently active. Contact your administrator for assistance.' },
  error: { eyebrow: 'Account setup', title: 'Pulse could not finish loading your profile.', body: 'Your Auth session is secure, but no usable Pulse profile is available. Retry once or contact an administrator.' },
}

export function AccountStatePage({ kind }) {
  const auth = useAuth()
  if (kind === 'loading') {
    return <main className="auth-loading-page"><Brand compact /><Spinner size="lg" label="Restoring your secure session" /><p>Restoring your secure session…</p></main>
  }
  const state = content[kind] ?? content.error
  return (
    <main className="auth-status-page">
      <header><Brand compact /></header>
      <Card level={2} className="auth-status-card auth-status-card--compact">
        <p className="auth-eyebrow">{state.eyebrow}</p>
        <h1>{state.title}</h1>
        <p>{state.body}</p>
        <div className="auth-status-actions">
          {kind === 'error' && <Button type="button" onClick={auth.refreshProfile}>Retry profile</Button>}
          <Button type="button" variant={kind === 'error' ? 'ghost' : 'primary'} onClick={auth.signOut}>Sign out</Button>
        </div>
      </Card>
    </main>
  )
}
