import { NavLink, Outlet } from 'react-router-dom'

import { Button } from '../../components/ui/Button.jsx'
import { PulseOrb } from '../../components/ui/PulseOrb.jsx'
import { useAuth } from '../../auth/AuthProvider.jsx'
import { canManageDepartments, canManageTeams, canManageUsers, canViewAudit, canViewCampaigns, canViewDepartments, canViewPositions, canViewTeams, hasAdminUsersAccess } from '../access.js'
import { useAdminPermissions } from '../AdminAccessContext.js'

export function AdminShell() {
  const { profile, signOut } = useAuth()
  const { permissionKeys } = useAdminPermissions()
  const lifecycleAdmin = canManageUsers(permissionKeys)
  const usersAccess = hasAdminUsersAccess(permissionKeys)
  const organizationAccess = canViewDepartments(permissionKeys) || canViewTeams(permissionKeys)
  const organizationAdmin = canManageDepartments(permissionKeys) || canManageTeams(permissionKeys)
  const auditAccess = canViewAudit(permissionKeys)
  const campaignsAccess = canViewCampaigns(permissionKeys)
  const positionsAccess = canViewPositions(permissionKeys)
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <NavLink className="admin-brand" to="/workspace"><PulseOrb size="sm" active /><span>Pulse</span></NavLink>
        <div className="admin-context"><span>Administration</span><strong>User governance</strong></div>
        <nav aria-label="Administration">
          <NavLink to="/workspace">Workspace</NavLink>
          {usersAccess && <NavLink to="/admin/users">Users</NavLink>}
          {usersAccess && <NavLink to="/admin/pending">Pending approval</NavLink>}
          {organizationAccess && <NavLink to="/admin/organization">Organization</NavLink>}
          {campaignsAccess && <NavLink to="/admin/campaigns">Campaigns</NavLink>}
          {positionsAccess && <NavLink to="/admin/positions">Positions</NavLink>}
          {auditAccess && <NavLink to="/admin/audit">Audit</NavLink>}
        </nav>
        <div className="admin-identity">
          <span>Signed in as</span>
          <strong>{profile?.display_name || profile?.full_name}</strong>
          <small>{profile?.employee_id}</small>
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <div><span className="admin-topbar__eyebrow">Pulse control plane</span><strong>{lifecycleAdmin || organizationAdmin ? 'Audited administration' : 'Read-only administration'}</strong></div>
          <Button type="button" variant="ghost" onClick={signOut}>Sign out</Button>
        </header>
        <Outlet />
      </div>
    </div>
  )
}
