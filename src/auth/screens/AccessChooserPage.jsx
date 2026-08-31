import { useState } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '../../components/ui/Button.jsx'
import { AGENT_SIGN_IN_PATH, STAFF_SIGN_IN_PATH } from '../authRoutes.js'
import { AuthNotice } from '../components/AuthNotice.jsx'
import { AuthShell } from '../components/AuthShell.jsx'

export function AccessChooserPage() {
  const [googleNotice, setGoogleNotice] = useState('')

  return (
    <AuthShell eyebrow="Pulse access" title="Choose how to enter Pulse" description="Select the access path that matches the work you do.">
      <div className="auth-access-chooser">
        <section className="auth-access-section" aria-labelledby="staff-access-heading">
          <p className="auth-access-label">Staff</p>
          <h2 id="staff-access-heading">Internal company access</h2>
          <p>For QA, supervisors, training, HR, IT, payroll, and internal staff.</p>
          <div className="auth-access-actions">
            <Button type="button" size="lg" variant="secondary" onClick={() => setGoogleNotice('Google sign-in is reserved for staff and will be enabled after the supported OAuth flow is ready.')}>Continue with Google</Button>
            <Link className="auth-access-link auth-access-link--primary" to={STAFF_SIGN_IN_PATH}>Corporate Email</Link>
          </div>
          {googleNotice && <AuthNotice tone="info">{googleNotice}</AuthNotice>}
        </section>

        <div className="auth-access-divider" role="separator"><span>or</span></div>

        <section className="auth-access-section" aria-labelledby="agent-access-heading">
          <p className="auth-access-label">Agent</p>
          <h2 id="agent-access-heading">Operational access</h2>
          <p>For agent access and operational tools. This path is separate from corporate Staff access.</p>
          <Link className="auth-access-link auth-access-link--secondary" to={AGENT_SIGN_IN_PATH}>Agent Sign In</Link>
        </section>
      </div>
    </AuthShell>
  )
}
