import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'

import { Badge } from '../../components/ui/Badge.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { canApprovePendingUsers, canAssignRoles, canBlockPendingUsers, canManageUsers, canViewOperationalAssignments, canViewUserHistory } from '../access.js'
import { useAdminPermissions } from '../AdminAccessContext.js'
import { AdminStatePanel } from '../components/AdminStatePanel.jsx'
import { LifecycleActions } from '../components/LifecycleActions.jsx'
import { LifecycleBadge } from '../components/LifecycleBadge.jsx'
import { OperationalAssignments } from '../components/OperationalAssignments.jsx'
import { PendingApprovalActions } from '../components/PendingApprovalActions.jsx'
import { RoleAdministration } from '../components/RoleAdministration.jsx'
import { RoleScopeList } from '../components/RoleScopeList.jsx'
import { UserAuditHistory } from '../components/UserAuditHistory.jsx'
import { directoryMaps, lifecycleMeta } from '../adminViewModel.js'
import { useManagedUser, usePendingApprovalOptions } from '../hooks/useManagedUsers.js'
import { useOperationalAssignments } from '../hooks/useOperationalAssignments.js'

function Detail({ label, children }) {
  return <div className="admin-detail-field"><dt>{label}</dt><dd>{children || 'Not assigned'}</dd></div>
}

export function AdminUserDetailPage({ pendingOnly = false }) {
  const { userId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, directory, roleOptions, roleOptionsError, loading, error, refresh } = useManagedUser(userId, {
    includeDirectory: !pendingOnly,
    includeRoleOptions: !pendingOnly,
  })
  const pendingApprovalOptions = usePendingApprovalOptions(userId, { enabled: pendingOnly })
  const { permissionKeys } = useAdminPermissions()
  const assignmentsAccess = canViewOperationalAssignments(permissionKeys)
  const operationalAssignments = useOperationalAssignments(userId, { enabled: assignmentsAccess })
  if (loading && !user) return <main className="admin-content"><AdminStatePanel kind="loading" title="Loading user" body="Getting the latest user details…" /></main>
  if (error || !user) return <main className="admin-content"><AdminStatePanel kind="error" title={error?.code === 'not_found' ? 'User not found' : 'User unavailable'} body={error?.message || 'The user record is unavailable.'} onRetry={error?.code === 'unavailable' ? refresh : undefined} /></main>
  if (pendingOnly && user.status !== 'pending_approval') return <Navigate to={`/admin/users/${user.id}`} replace />

  const maps = directoryMaps(directory)
  const lifecycle = lifecycleMeta(user.status)
  const justApproved = Boolean(location.state?.justApproved && user.status === 'active')
  return (
    <main className="admin-content">
      <Link className="admin-back-link" to={pendingOnly ? '/admin/pending' : '/admin/users'}>← Back to {pendingOnly ? 'approvals' : 'people'}</Link>
      <div className="admin-page-heading admin-page-heading--detail">
        <div><p>Staff profile</p><h1>{user.fullName}</h1><span>{user.employeeId || 'Employee ID pending'} · Pulse profile</span></div>
        <LifecycleBadge status={user.status} />
      </div>
      {justApproved && <section className="admin-setup-notice" role="status"><div><strong>User approved</strong><span>Review their work details and Pulse access below.</span></div><a href="#pulse-access-management">Manage access</a></section>}
      <div className="admin-detail-grid">
        <Card level={2} className="admin-detail-card"><p className="admin-section-label">Profile</p><h2>Profile</h2><dl><Detail label="Full name">{user.fullName}</Detail><Detail label="Display name">{user.displayName}</Detail><Detail label="Employee ID">{user.employeeId}</Detail><Detail label="Email">{user.email}</Detail></dl></Card>
        <Card level={2} className="admin-detail-card"><p className="admin-section-label">Work details</p><h2>Work details</h2><dl><Detail label="Department">{maps.departments.get(user.departmentId)}</Detail><Detail label="Team">{maps.teams.get(user.teamId)}</Detail></dl></Card>
        <Card level={2} className="admin-detail-card admin-detail-card--wide"><p className="admin-section-label">Position</p><h2>Position</h2><dl><Detail label="Position">{user.positionName}</Detail></dl></Card>
        {assignmentsAccess && <OperationalAssignments assignments={operationalAssignments.assignments} loading={operationalAssignments.loading} error={operationalAssignments.error} onRetry={operationalAssignments.refresh} />}
        <Card level={2} className="admin-detail-card admin-detail-card--wide"><p className="admin-section-label">Pulse access</p><h2>Pulse access</h2><RoleScopeList roles={user.roles} directory={directory} /></Card>
        <Card level={2} className="admin-detail-card admin-detail-card--wide"><p className="admin-section-label">Account status</p><h2>Account status</h2><div className="admin-account-row"><LifecycleBadge status={user.status} /><Badge tone={user.authEmailConfirmed ? 'success' : 'warning'} dot>{user.authEmailConfirmed ? 'Email verified' : 'Email not verified'}</Badge></div><p>{lifecycle.description}</p></Card>
      </div>
      {canViewUserHistory(permissionKeys) && <UserAuditHistory userId={user.id} />}
      {user.status === 'pending_approval'
        ? <PendingApprovalActions user={user} canBlock={canBlockPendingUsers(permissionKeys)} canApprove={canApprovePendingUsers(permissionKeys)} approvalOptions={pendingApprovalOptions.options} approvalOptionsLoading={pendingApprovalOptions.loading} approvalOptionsError={pendingApprovalOptions.error} onReloadApprovalOptions={pendingApprovalOptions.refresh} onChanged={refresh} onApproved={() => navigate(`/admin/users/${user.id}`, { replace: true, state: { justApproved: true } })} />
        : <>
          <LifecycleActions user={user} allowed={canManageUsers(permissionKeys)} onChanged={refresh} />
          <RoleAdministration user={user} directory={directory} roleOptions={roleOptions} roleOptionsError={roleOptionsError} loading={loading} allowed={canAssignRoles(permissionKeys)} onChanged={refresh} />
        </>}
    </main>
  )
}
