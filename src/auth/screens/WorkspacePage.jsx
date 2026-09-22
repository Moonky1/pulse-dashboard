import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { useAdminAccess } from '../../admin/hooks/useAdminAccess.js'
import { canCreateStudioContent } from '../../studio/studioAccess.js'
import { useStudioAccess } from '../../studio/hooks/useStudioAccess.js'
import { canHost, canPractice } from '../../go-product/goAccess.js'
import { GO_ART } from '../../go-product/goVisualAssets.js'
import { useGoAccess } from '../../go-product/useGoAccess.js'
import { Badge } from '../../components/ui/Badge.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { useAuth } from '../AuthProvider.jsx'
import { Brand } from '../components/AuthShell.jsx'

export function WorkspacePage() {
  const { profile, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [adminAccessNotice] = useState(() => location.state?.adminAccess ?? null)
  const [invitationAccepted] = useState(() => Boolean(location.state?.invitationAccepted))
  const adminAccess = useAdminAccess()
  const goAccess = useGoAccess()
  const studioAccess = useStudioAccess()
  useEffect(() => {
    if (location.state?.adminAccess || location.state?.invitationAccepted) navigate(location.pathname, { replace: true, state: null })
  }, [location.pathname, location.state?.adminAccess, location.state?.invitationAccepted, navigate])
  return (
    <main className="auth-workspace">
      <header><Brand compact /><Button type="button" variant="ghost" onClick={signOut}>Sign out</Button></header>
      <section className="auth-workspace-card">
        <div className="auth-workspace-intro">
          <Badge tone="success" dot>Ready</Badge>
          <p className="auth-eyebrow">Workspace</p>
          <h1>Welcome back, {profile?.display_name || profile?.full_name}.</h1>
          <p>Choose an app.</p>
        </div>
        {invitationAccepted && <p className="auth-workspace-notice auth-workspace-notice--success" role="status">Invitation accepted. Welcome to Pulse.</p>}
        {adminAccessNotice && <p className="auth-workspace-notice" role="status">{adminAccessNotice === 'denied' ? 'Your account does not have access to Administration.' : 'Pulse could not verify Administration access. Try again later.'}</p>}
        <div className="auth-workspace-actions">
          {goAccess.state === 'allowed' && (canPractice(goAccess.capabilities) || canHost(goAccess.capabilities)) && <Link className="auth-workspace-destination auth-workspace-destination--go" to="/go"><img src={GO_ART.classic} alt="" /><span><strong>Pulse GO</strong><small>Practice and live games</small></span><b aria-hidden="true">→</b></Link>}
          {studioAccess.state === 'allowed' && <Link className="auth-workspace-destination auth-workspace-destination--studio" to="/studio"><img src={GO_ART.goal2} alt="" /><span><strong>Studio</strong><small>{canCreateStudioContent(studioAccess.permissionKeys) ? 'Create and manage training' : 'Browse training content'}</small></span><b aria-hidden="true">→</b></Link>}
          {adminAccess.state === 'allowed' && <Link className="auth-workspace-destination auth-workspace-destination--admin" to="/admin/users"><img src={GO_ART.valid} alt="" /><span><strong>Administration</strong><small>People, access, and organization</small></span><b aria-hidden="true">→</b></Link>}
        </div>
      </section>
    </main>
  )
}
