import { NavLink, Outlet } from 'react-router-dom'

import { ProductHeader } from '../../components/ProductHeader.jsx'
import { canInviteStaff, canManageAgents, canViewAudit, canViewCampaigns, canViewDepartments, canViewPositions, canViewTeams, hasAdminUsersAccess } from '../access.js'
import { useAdminPermissions } from '../AdminAccessContext.js'

export function AdminShell() {
  const { permissionKeys } = useAdminPermissions()
  const usersAccess = hasAdminUsersAccess(permissionKeys)
  const organizationAccess = canViewDepartments(permissionKeys) || canViewTeams(permissionKeys)
  const auditAccess = canViewAudit(permissionKeys)
  const campaignsAccess = canViewCampaigns(permissionKeys)
  const positionsAccess = canViewPositions(permissionKeys)
  const invitationsAccess = canInviteStaff(permissionKeys)
  const agentsAccess = canManageAgents(permissionKeys)
  return (
    <div className="pulse-product-surface admin-product-page">
      <ProductHeader />
      <div className="admin-shell">
        <aside className="admin-sidebar">
          <div className="admin-context"><span>Administration</span><strong>People &amp; access</strong></div>
          <nav aria-label="Administration">
            {usersAccess && <NavLink to="/admin/users">People</NavLink>}
            {usersAccess && <NavLink to="/admin/staff-tree">Staff Tree</NavLink>}
            {usersAccess && <NavLink to="/admin/pending">Approvals</NavLink>}
            {invitationsAccess && <NavLink to="/admin/invitations">Invitations</NavLink>}
            {agentsAccess && <NavLink to="/admin/agents">Agents</NavLink>}
            {organizationAccess && <NavLink to="/admin/organization">Organization</NavLink>}
            {campaignsAccess && <NavLink to="/admin/campaigns">Campaigns</NavLink>}
            {positionsAccess && <NavLink to="/admin/positions">Positions</NavLink>}
            {auditAccess && <NavLink to="/admin/audit">Activity</NavLink>}
          </nav>
        </aside>
        <div className="admin-main">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
