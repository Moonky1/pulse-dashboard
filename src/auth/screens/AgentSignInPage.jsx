import { AGENT_SIGN_IN_PATH } from '../authRoutes.js'
import { AuthShell } from '../components/AuthShell.jsx'

export function AgentSignInPage() {
  return (
    <AuthShell title="Agent sign in" brandPath={AGENT_SIGN_IN_PATH}>
      <div className="auth-agent-shell">
        <div className="auth-agent-icon" aria-hidden="true">↗</div>
        <h2>Agent access is being prepared</h2>
      </div>
    </AuthShell>
  )
}
