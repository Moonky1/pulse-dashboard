import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { useAdminAccess } from '../../admin/hooks/useAdminAccess.js'
import { useStudioAccess } from '../../studio/hooks/useStudioAccess.js'
import { canHost, canPractice } from '../../go-product/goAccess.js'
import { GO_ART } from '../../go-product/goVisualAssets.js'
import { useGoAccess } from '../../go-product/useGoAccess.js'
import { useAuth } from '../AuthProvider.jsx'
import { ProductTopbar } from '../components/ProductNavigation.jsx'
import './productSurface.css'

export function WorkspacePage() {
  const { profile } = useAuth()
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
    <div className="product-surface product-workspace">
      <ProductTopbar />
      <main className="product-content">
        <div className="product-page-heading"><p className="product-kicker">Workspace</p><h1>Welcome back, {profile?.display_name || profile?.full_name}</h1><span>Choose where to go</span></div>
        {invitationAccepted && <p className="auth-workspace-notice auth-workspace-notice--success" role="status">Invitation accepted. Welcome to Pulse.</p>}
        {adminAccessNotice && <p className="auth-workspace-notice" role="status">{adminAccessNotice === 'denied' ? 'Your account does not have access to Administration.' : 'Pulse could not verify Administration access. Try again later.'}</p>}
        <div className="product-workspace__apps">
          <Link className="auth-workspace-destination auth-workspace-destination--dashboard" to="/dashboard"><span className="product-workspace__dashboard-mark" aria-hidden="true"><i /></span><span><strong>Dashboard</strong><small>Your Pulse overview</small></span><b aria-hidden="true">↗</b></Link>
          {goAccess.state === 'allowed' && (canPractice(goAccess.capabilities) || canHost(goAccess.capabilities)) && <Link className="auth-workspace-destination auth-workspace-destination--go" to="/go"><img src={GO_ART.classic} alt="" /><span><strong>Pulse GO</strong><small>Practice and live games</small></span><b aria-hidden="true">→</b></Link>}
          {studioAccess.state === 'allowed' && <Link className="auth-workspace-destination auth-workspace-destination--studio" to="/studio"><img src={GO_ART.goal2} alt="" /><span><strong>Studio</strong><small>Training content</small></span><b aria-hidden="true">→</b></Link>}
          {adminAccess.state === 'allowed' && <Link className="auth-workspace-destination auth-workspace-destination--admin" to="/admin/users"><img src={GO_ART.valid} alt="" /><span><strong>Administration</strong><small>People, access, and organization</small></span><b aria-hidden="true">→</b></Link>}
        </div>
      </main>
    </div>
  )
}
