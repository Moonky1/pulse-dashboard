import { NavLink, Outlet } from 'react-router-dom'

import { Button } from '../../components/ui/Button.jsx'
import { PulseOrb } from '../../components/ui/PulseOrb.jsx'
import { useAuth } from '../../auth/AuthProvider.jsx'

export function AdminShell() {
  const { profile, signOut } = useAuth()
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <NavLink className="admin-brand" to="/workspace"><PulseOrb size="sm" active /><span>Pulse</span></NavLink>
        <div className="admin-context"><span>Administration</span><strong>User governance</strong></div>
        <nav aria-label="Administration">
          <NavLink to="/workspace">Workspace</NavLink>
          <NavLink to="/admin/users">Users</NavLink>
        </nav>
        <div className="admin-identity">
          <span>Signed in as</span>
          <strong>{profile?.display_name || profile?.full_name}</strong>
          <small>{profile?.employee_id}</small>
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <div><span className="admin-topbar__eyebrow">Pulse control plane</span><strong>Read-only administration</strong></div>
          <Button type="button" variant="ghost" onClick={signOut}>Sign out</Button>
        </header>
        <Outlet />
      </div>
    </div>
  )
}
