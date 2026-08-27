import { Link, Navigate, useParams } from 'react-router-dom'

import { Badge } from '../../components/ui/Badge.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { canApprovePendingUsers, canAssignRoles, canBlockPendingUsers, canManageUsers } from '../access.js'
import { useAdminPermissions } from '../AdminAccessContext.js'
import { AdminStatePanel } from '../components/AdminStatePanel.jsx'
import { LifecycleActions } from '../components/LifecycleActions.jsx'
import { LifecycleBadge } from '../components/LifecycleBadge.jsx'
import { PendingApprovalActions } from '../components/PendingApprovalActions.jsx'
import { RoleAdministration } from '../components/RoleAdministration.jsx'
import { RoleScopeList } from '../components/RoleScopeList.jsx'
import { directoryMaps, lifecycleMeta } from '../adminViewModel.js'
import { useManagedUser } from '../hooks/useManagedUsers.js'

function Detail({ label, children }) {
  return <div className="admin-detail-field"><dt>{label}</dt><dd>{children || 'Not assigned'}</dd></div>
}

export function AdminUserDetailPage({ pendingOnly = false }) {
  const { userId } = useParams()
  const { user, directory, roleOptions, roleOptionsError, loading, error, refresh } = useManagedUser(userId, {
    includeDirectory: !pendingOnly,
    includeRoleOptions: !pendingOnly,
  })
  const { permissionKeys } = useAdminPermissions()
  if (loading && !user) return <main className="admin-content"><AdminStatePanel kind="loading" title="Loading user" body="Reading the canonical user record…" /></main>
  if (error || !user) return <main className="admin-content"><AdminStatePanel kind="error" title={error?.code === 'not_found' ? 'User not found' : 'User unavailable'} body={error?.message || 'The user record is unavailable.'} onRetry={error?.code === 'unavailable' ? refresh : undefined} /></main>
  if (pendingOnly && user.status !== 'pending_approval') return <Navigate to={`/admin/users/${user.id}`} replace />

  const maps = directoryMaps(directory)
  const lifecycle = lifecycleMeta(user.status)
  return (
    <main className="admin-content">
      <Link className="admin-back-link" to={pendingOnly ? '/admin/pending' : '/admin/users'}>← Back to {pendingOnly ? 'pending users' : 'users'}</Link>
      <div className="admin-page-heading admin-page-heading--detail">
        <div><p>User record</p><h1>{user.fullName}</h1><span>{user.employeeId || 'Employee ID pending'} · Canonical Pulse profile</span></div>
        <LifecycleBadge status={user.status} />
      </div>
      <div className="admin-detail-grid">
        <Card level={2} className="admin-detail-card"><p className="admin-section-label">Identity</p><h2>Company profile</h2><dl><Detail label="Full name">{user.fullName}</Detail><Detail label="Display name">{user.displayName}</Detail><Detail label="Employee ID">{user.employeeId}</Detail><Detail label="Corporate email">{user.email}</Detail></dl></Card>
        <Card level={2} className="admin-detail-card"><p className="admin-section-label">Organization</p><h2>Placement</h2><dl><Detail label="Department">{maps.departments.get(user.departmentId)}</Detail><Detail label="Team">{maps.teams.get(user.teamId)}</Detail></dl></Card>
        <Card level={2} className="admin-detail-card admin-detail-card--wide"><p className="admin-section-label">Access</p><h2>Roles and scope</h2><RoleScopeList roles={user.roles} directory={directory} /></Card>
        <Card level={2} className="admin-detail-card admin-detail-card--wide"><p className="admin-section-label">Account</p><h2>Authentication and lifecycle</h2><div className="admin-account-row"><LifecycleBadge status={user.status} /><Badge tone={user.authEmailConfirmed ? 'success' : 'warning'} dot>{user.authEmailConfirmed ? 'Auth email verified' : 'Auth email unverified'}</Badge></div><p>{lifecycle.description}</p><p className="admin-footnote">Creation, approval, status-change timestamps, and audit history are not exposed by the current protected read contract.</p></Card>
      </div>
      {user.status === 'pending_approval'
        ? <PendingApprovalActions user={user} canBlock={canBlockPendingUsers(permissionKeys)} canApprove={canApprovePendingUsers(permissionKeys)} onChanged={refresh} />
        : <>
          <LifecycleActions user={user} allowed={canManageUsers(permissionKeys)} onChanged={refresh} />
          <RoleAdministration user={user} directory={directory} roleOptions={roleOptions} roleOptionsError={roleOptionsError} loading={loading} allowed={canAssignRoles(permissionKeys)} onChanged={refresh} />
        </>}
    </main>
  )
}
