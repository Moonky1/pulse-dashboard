import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { useAdminAccess } from '../../admin/hooks/useAdminAccess.js'
import { AvatarControls } from '../../components/AvatarControls.jsx'
import { StaffAvatar } from '../../components/StaffAvatar.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { canHost, canPractice } from '../../go-product/goAccess.js'
import { GO_ART } from '../../go-product/goVisualAssets.js'
import { useGoAccess } from '../../go-product/useGoAccess.js'
import { canCreateStudioContent } from '../../studio/studioAccess.js'
import { useStudioAccess } from '../../studio/hooks/useStudioAccess.js'
import { useAuth } from '../AuthProvider.jsx'
import { Brand } from '../components/AuthShell.jsx'
import './WorkspacePage.css'

function DashboardIcon() {
  return <svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><rect x="9" y="10" width="46" height="44" rx="12" stroke="currentColor" strokeWidth="2" /><path d="M19 43V34m13 9V22m13 21V29" stroke="currentColor" strokeWidth="4" strokeLinecap="round" /><path d="M18 18h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
}

function AcademyIcon() {
  return <svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M32 49c-7-5-14-6-23-5V15c9-1 16 0 23 5 7-5 14-6 23-5v29c-9-1-16 0-23 5Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" /><path d="M32 20v29M16 25c3-.2 6 .3 9 1.5m14 0c3-1.2 6-1.7 9-1.5M16 33c3-.2 6 .3 9 1.5m14 0c3-1.2 6-1.7 9-1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
}

function WorkspaceApp({ className = '', to, eyebrow, title, description, image, icon }) {
  return <Link className={`pulse-launcher-app ${className}`} to={to}>
    <div className="pulse-launcher-app__top"><span className="pulse-launcher-app__icon">{image ? <img src={image} alt="" /> : icon}</span><span className="pulse-launcher-app__arrow" aria-hidden="true">↗</span></div>
    <div className="pulse-launcher-app__copy"><span className="pulse-launcher-app__eyebrow">{eyebrow}</span><h2>{title}</h2><p>{description}</p></div>
  </Link>
}

export function WorkspacePage() {
  const { profile, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [adminAccessNotice] = useState(() => location.state?.adminAccess ?? null)
  const [invitationAccepted] = useState(() => Boolean(location.state?.invitationAccepted))
  const adminAccess = useAdminAccess()
  const goAccess = useGoAccess()
  const studioAccess = useStudioAccess()
  const fullName = profile?.display_name || profile?.full_name || 'there'
  const firstName = fullName.trim().split(/\s+/)[0]
  const avatarProps = {
    name: fullName,
    customAvatarPath: profile?.custom_avatar_path,
    googleAvatarUrl: profile?.google_avatar_url,
    avatarUpdatedAt: profile?.avatar_updated_at,
  }

  useEffect(() => {
    if (location.state?.adminAccess || location.state?.invitationAccepted) navigate(location.pathname, { replace: true, state: null })
  }, [location.pathname, location.state?.adminAccess, location.state?.invitationAccepted, navigate])

  return <main className="pulse-launcher">
    <div className="pulse-launcher__inner">
      <header className="pulse-launcher__header">
        <Brand compact />
        <details className="pulse-launcher-account">
          <summary><StaffAvatar {...avatarProps} size="sm" /><span>{fullName}</span><span className="pulse-launcher-account__chevron" aria-hidden="true">⌄</span></summary>
          <div className="pulse-launcher-account__menu">
            <p className="pulse-launcher-account__label">Account</p>
            <div className="pulse-launcher-account__identity"><StaffAvatar {...avatarProps} size="md" /><strong>{fullName}</strong></div>
            <AvatarControls compact />
            <Button type="button" variant="ghost" onClick={signOut}>Sign out</Button>
          </div>
        </details>
      </header>

      <section className="pulse-launcher__welcome">
        <p className="pulse-launcher__eyebrow">KAMPAIGN KINGS <span aria-hidden="true">·</span> PULSE</p>
        <h1>Welcome back, {firstName}</h1>
        <p>Your work, learning and team experiences in one place.</p>
      </section>

      {invitationAccepted && <p className="auth-workspace-notice auth-workspace-notice--success" role="status">Invitation accepted. Welcome to Pulse.</p>}
      {adminAccessNotice && <p className="auth-workspace-notice" role="status">{adminAccessNotice === 'denied' ? 'Your account does not have access to Administration.' : 'Pulse could not verify Administration access. Try again later.'}</p>}

      <section className="pulse-launcher__apps" aria-label="Pulse products">
        {goAccess.state === 'allowed' && (canPractice(goAccess.capabilities) || canHost(goAccess.capabilities)) && <WorkspaceApp className="pulse-launcher-app--go" to="/go" eyebrow="INTERACTIVE LEARNING" title="Pulse GO" description="Practice your skills and bring the team together in live games." image={GO_ART.classic} />}
        <article className="pulse-launcher-app pulse-launcher-app--dashboard" aria-label="Dashboard, in development">
          <div className="pulse-launcher-app__top"><span className="pulse-launcher-app__icon"><DashboardIcon /></span><span className="pulse-launcher-app__soon">IN DEVELOPMENT</span></div>
          <div className="pulse-launcher-app__copy"><span className="pulse-launcher-app__eyebrow">A CLEARER VIEW</span><h2>Dashboard</h2><p>Operational performance, teams and insights.</p></div>
        </article>
        {studioAccess.state === 'allowed' && <WorkspaceApp className="pulse-launcher-app--studio" to="/studio" eyebrow="MAKE IT YOURS" title="Studio" description={canCreateStudioContent(studioAccess.permissionKeys) ? 'Create games and manage training content.' : 'Explore training content from your team.'} image={GO_ART.goal2} />}
        <WorkspaceApp className="pulse-launcher-app--academy" to="/academy" eyebrow="KNOWLEDGE LIBRARY" title="Academy" description="Guides, scripts and standards for better conversations." icon={<AcademyIcon />} />
        {adminAccess.state === 'allowed' && <WorkspaceApp className="pulse-launcher-app--admin" to="/admin/users" eyebrow="TEAM OPERATIONS" title="Administration" description="People, access and organization." image={GO_ART.valid} />}
      </section>
    </div>
  </main>
}
