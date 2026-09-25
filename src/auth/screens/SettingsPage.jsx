import { useState } from 'react'
import { Link } from 'react-router-dom'

import { supabase } from '../../utils/supabase.js'
import { StaffAvatar } from '../../components/StaffAvatar.jsx'
import { ProductTopbar } from '../components/ProductNavigation.jsx'
import { useAuth } from '../AuthProvider.jsx'
import { getAuthRedirect } from '../authRedirects.js'
import { canRecoverPassword, connectedGoogleAccount } from '../accountViewModel.js'
import { requestPasswordRecovery } from '../pulseAuthService.js'
import './productSurface.css'

export function SettingsPage() {
  const { authUser, profile } = useAuth()
  const google = connectedGoogleAccount(authUser)
  const [sending, setSending] = useState(false)
  const [recoveryNotice, setRecoveryNotice] = useState('')
  const sendRecovery = async () => {
    if (!canRecoverPassword(authUser) || sending) return
    setSending(true)
    const { error } = await requestPasswordRecovery(supabase, { email: authUser.email, redirectTo: getAuthRedirect('recovery') })
    setRecoveryNotice(error ? 'We could not send the reset email. Try again later.' : 'If this email is eligible, password reset instructions are on their way.')
    setSending(false)
  }
  return <div className="product-surface"><ProductTopbar /><main className="product-content product-settings">
    <div className="product-page-heading"><p className="product-kicker">Your account</p><h1>Settings</h1><span>How you sign in and hear from Pulse</span></div>
    <div className="product-settings__grid">
      <section className="product-panel product-settings__account"><div className="product-settings__identity"><StaffAvatar name={profile?.display_name || profile?.full_name} customAvatarPath={profile?.custom_avatar_path} googleAvatarUrl={profile?.google_avatar_url} avatarUpdatedAt={profile?.avatar_updated_at} size="lg" eager /><div><p className="product-kicker">Account</p><h2>{profile?.display_name || profile?.full_name}</h2><span>{profile?.email}</span></div></div><Link className="product-text-link" to="/profile">View your Staff profile <span aria-hidden="true">↗</span></Link></section>
      <section className="product-panel"><p className="product-kicker">Connected accounts</p><h2>Sign-in methods</h2><div className="product-settings__method"><span className="product-settings__google" aria-hidden="true">G</span><div><strong>Google</strong><small>{google.connected ? (google.email ? `Connected as ${google.email}` : 'Connected') : 'Not connected'}</small></div><span className={google.connected ? 'product-status product-status--connected' : 'product-status'}>{google.connected ? 'Connected' : 'Not connected'}</span></div><p className="product-settings__footnote">Google connection is shown for reference. Account linking and disconnecting are not available here.</p></section>
      <section className="product-panel"><p className="product-kicker">Email & security</p><h2>Account access</h2><div className="product-settings__line"><span>Email</span><strong>{profile?.email}</strong></div><div className="product-settings__line"><span>Verification</span><strong>{authUser?.email_confirmed_at ? 'Verified' : 'Not verified'}</strong></div>{canRecoverPassword(authUser) ? <div className="product-settings__security"><p>Need to change your password? We’ll send a secure reset link to your email.</p><button type="button" onClick={() => void sendRecovery()} disabled={sending}>{sending ? 'Sending…' : 'Send password reset email'}</button>{recoveryNotice && <span role="status">{recoveryNotice}</span>}</div> : <p className="product-settings__footnote">Your Google account manages its own password.</p>}</section>
      <section className="product-panel"><p className="product-kicker">Preferences</p><h2>Notifications</h2><p className="product-settings__footnote">Invitations and essential account emails continue as usual. Training, GO and operations notification preferences are not available yet.</p></section>
    </div>
  </main></div>
}
