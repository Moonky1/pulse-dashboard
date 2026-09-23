import { NavLink, Outlet } from 'react-router-dom'

import { Button } from '../../components/ui/Button.jsx'
import { PulseOrb } from '../../components/ui/PulseOrb.jsx'
import { StaffAvatar } from '../../components/StaffAvatar.jsx'
import { useAuth } from '../../auth/AuthProvider.jsx'
import { canInviteStaff, canViewAudit, canViewCampaigns, canViewDepartments, canViewPositions, canViewTeams, hasAdminUsersAccess } from '../access.js'
import { useAdminPermissions } from '../AdminAccessContext.js'

export function AdminShell() {
  const { profile, signOut } = useAuth()
  const { permissionKeys } = useAdminPermissions()
  const usersAccess = hasAdminUsersAccess(permissionKeys)
  const organizationAccess = canViewDepartments(permissionKeys) || canViewTeams(permissionKeys)
  const auditAccess = canViewAudit(permissionKeys)
  const campaignsAccess = canViewCampaigns(permissionKeys)
  const positionsAccess = canViewPositions(permissionKeys)
  const invitationsAccess = canInviteStaff(permissionKeys)
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <NavLink className="admin-brand" to="/workspace"><PulseOrb size="sm" active /><span>Pulse</span></NavLink>
        <div className="admin-context"><span>Administration</span><strong>People &amp; access</strong></div>
        <nav aria-label="Administration">
          <NavLink to="/workspace">Workspace</NavLink>
          {usersAccess && <NavLink to="/admin/users">People</NavLink>}
          {usersAccess && <NavLink to="/admin/staff-tree">Staff Tree</NavLink>}
          {usersAccess && <NavLink to="/admin/pending">Approvals</NavLink>}
          {invitationsAccess && <NavLink to="/admin/invitations">Invitations</NavLink>}
          {organizationAccess && <NavLink to="/admin/organization">Organization</NavLink>}
          {campaignsAccess && <NavLink to="/admin/campaigns">Campaigns</NavLink>}
          {positionsAccess && <NavLink to="/admin/positions">Positions</NavLink>}
          {auditAccess && <NavLink to="/admin/audit">Activity</NavLink>}
        </nav>
        <div className="admin-identity">
          <span>Signed in as</span>
          <div><StaffAvatar name={profile?.display_name || profile?.full_name} customAvatarPath={profile?.custom_avatar_path} googleAvatarUrl={profile?.google_avatar_url} avatarUpdatedAt={profile?.avatar_updated_at} size="sm" /><span><strong>{profile?.display_name || profile?.full_name}</strong><small>{profile?.employee_id}</small></span></div>
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <div><span className="admin-topbar__eyebrow">Pulse</span><strong>Administration</strong></div>
          <Button type="button" variant="ghost" onClick={signOut}>Sign out</Button>
        </header>
        <Outlet />
      </div>
    </div>
  )
}
