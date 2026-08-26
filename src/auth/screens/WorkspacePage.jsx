import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { useAdminAccess } from '../../admin/hooks/useAdminAccess.js'
import { Badge } from '../../components/ui/Badge.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { useAuth } from '../AuthProvider.jsx'
import { Brand } from '../components/AuthShell.jsx'

export function WorkspacePage() {
  const { profile, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [adminAccessNotice] = useState(() => location.state?.adminAccess ?? null)
  const adminAccess = useAdminAccess()
  useEffect(() => {
    if (location.state?.adminAccess) navigate(location.pathname, { replace: true, state: null })
  }, [location.pathname, location.state?.adminAccess, navigate])
  return (
    <main className="auth-workspace">
      <header><Brand compact /><Button type="button" variant="ghost" onClick={signOut}>Sign out</Button></header>
      <Card level={2} className="auth-workspace-card">
        <Badge tone="success" dot>Active</Badge>
        <p className="auth-eyebrow">Authenticated foundation</p>
        <h1>Pulse Workspace — Foundation Ready</h1>
        <p>Welcome, {profile?.display_name || profile?.full_name}. Your Supabase session and canonical Pulse profile are active.</p>
        <p className="auth-safe-detail">The production workspace will be built in a future checkpoint.</p>
        {adminAccessNotice && <p className="auth-workspace-notice" role="status">{adminAccessNotice === 'denied' ? 'Your account does not have access to Administration.' : 'Pulse could not verify Administration access. Try again later.'}</p>}
        <div className="auth-workspace-actions">
          {adminAccess.state === 'allowed' && <Link className="auth-admin-link" to="/admin/users">Open Administration</Link>}
        </div>
      </Card>
    </main>
  )
}
