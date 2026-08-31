import { Link } from 'react-router-dom'

import { AUTH_ENTRY_PATH } from '../authRoutes.js'
import { AuthShell } from '../components/AuthShell.jsx'

export function AgentSignInPage() {
  return (
    <AuthShell eyebrow="Agent access" title="Agent sign in" description="Agent access is intentionally separate from Pulse Staff and corporate accounts.">
      <div className="auth-agent-shell">
        <div className="auth-agent-icon" aria-hidden="true">↗</div>
        <h2>Agent access is being prepared</h2>
        <p>Use the Staff path only for verified corporate accounts. Agent credentials and operational access will be introduced through a dedicated, supported authentication flow.</p>
        <Link className="auth-access-link auth-access-link--secondary" to={AUTH_ENTRY_PATH}>Back to access choices</Link>
      </div>
    </AuthShell>
  )
}
