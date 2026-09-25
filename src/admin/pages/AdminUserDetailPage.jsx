import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'

import { Badge } from '../../components/ui/Badge.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { AvatarControls } from '../../components/AvatarControls.jsx'
import { useAuth } from '../../auth/AuthProvider.jsx'
import { canApprovePendingUsers, canAssignRoles, canBlockPendingUsers, canManageStaffWork, canManageUsers, canViewOperationalAssignments, canViewUserHistory } from '../access.js'
import { useAdminPermissions } from '../AdminAccessContext.js'
import { AdminStatePanel } from '../components/AdminStatePanel.jsx'
import { LifecycleActions } from '../components/LifecycleActions.jsx'
import { LifecycleBadge } from '../components/LifecycleBadge.jsx'
import { JoinedPulseAdministration } from '../components/JoinedPulseAdministration.jsx'
import { OperationalAssignments } from '../components/OperationalAssignments.jsx'
import { PendingApprovalActions } from '../components/PendingApprovalActions.jsx'
import { RoleAdministration } from '../components/RoleAdministration.jsx'
import { RoleScopeList } from '../components/RoleScopeList.jsx'
import { StaffAvatar } from '../components/StaffAvatar.jsx'
import { TeamBadge } from '../components/TeamBadge.jsx'
import { UserAuditHistory } from '../components/UserAuditHistory.jsx'
import { WorkDetailsAdministration } from '../components/WorkDetailsAdministration.jsx'
import { directoryMaps, formatPulseDate, lifecycleMeta } from '../adminViewModel.js'
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
  const { profile } = useAuth()
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
      <section className="admin-profile-hero">
        <div className="admin-profile-hero__avatar"><StaffAvatar name={user.displayName || user.fullName} customAvatarPath={user.customAvatarPath} googleAvatarUrl={user.googleAvatarUrl} avatarUpdatedAt={user.avatarUpdatedAt} size="lg" eager />{profile?.id === user.id && <AvatarControls compact onChanged={refresh} />}</div>
        <div className="admin-profile-hero__identity"><p>Staff profile</p><h1>{user.displayName || user.fullName}</h1>{user.displayName && user.displayName !== user.fullName && <span>{user.fullName}</span>}<strong>{user.positionName || 'Position not assigned'}</strong><span>{[user.primaryTeamName, user.primaryCampaignName].filter(Boolean).join(' · ') || 'Work placement not assigned'}</span><small>{user.employeeId || 'Employee ID pending'}</small></div>
        <dl className="admin-profile-hero__work"><Detail label="Department">{maps.departments.get(user.departmentId)}</Detail><Detail label="Joined Pulse">{formatPulseDate(user.pulseJoinedOn)}</Detail></dl>
        <LifecycleBadge status={user.status} />
      </section>
      {justApproved && <section className="admin-setup-notice" role="status"><div><strong>User approved</strong><span>Review their work details and Pulse access below.</span></div><a href="#pulse-access-management">Manage access</a></section>}
      {pendingOnly && <section className="admin-pending-readiness" aria-label="Approval readiness"><div><p>Approval readiness</p><h2>{user.authEmailConfirmed ? 'Identity verified' : 'Identity verification pending'}</h2><span>Review the person, then choose their work details and Pulse access in the approval step below.</span></div><dl><Detail label="Email">{user.email}</Detail><Detail label="Current access">Not assigned</Detail><Detail label="Work placement">Selected during approval</Detail></dl></section>}
      <div className="admin-detail-grid">
        <Card level={2} className="admin-detail-card"><p className="admin-section-label">Identity</p><h2>Contact and identity</h2><dl>{user.displayName && <Detail label="Display name">{user.displayName}</Detail>}<Detail label="Employee ID">{user.employeeId}</Detail><Detail label="Email">{user.email}</Detail><Detail label="Joined Pulse">{formatPulseDate(user.pulseJoinedOn)}</Detail></dl><JoinedPulseAdministration user={user} allowed={!pendingOnly && canManageUsers(permissionKeys)} onChanged={refresh} /></Card>
        <Card level={2} className="admin-detail-card admin-detail-card--wide"><p className="admin-section-label">Work details</p><h2>Placement and Position</h2><dl className="admin-work-detail-list"><Detail label="Position">{user.positionName}</Detail><Detail label="Department">{maps.departments.get(user.departmentId)}</Detail><Detail label="Campaign">{user.primaryCampaignName}</Detail><Detail label="Operating unit">{user.primaryOperatingUnitName}</Detail><Detail label="Team">{user.primaryTeamName ? <TeamBadge teamId={user.primaryTeamId} name={user.primaryTeamName} code={user.primaryTeamCode} campaignCode={user.primaryCampaignCode} /> : 'Not assigned'}</Detail></dl></Card>
        <Card level={2} className="admin-detail-card"><p className="admin-section-label">Account</p><h2>Account status</h2><div className="admin-account-row"><LifecycleBadge status={user.status} /><Badge tone={user.authEmailConfirmed ? 'success' : 'warning'} dot>{user.authEmailConfirmed ? 'Email verified' : 'Email not verified'}</Badge></div><p>{lifecycle.description}</p></Card>
        {assignmentsAccess && <OperationalAssignments assignments={operationalAssignments.assignments} loading={operationalAssignments.loading} error={operationalAssignments.error} onRetry={operationalAssignments.refresh} />}
        <Card level={2} className="admin-detail-card admin-detail-card--wide"><p className="admin-section-label">Pulse access</p><h2>Pulse access</h2><RoleScopeList roles={user.roles} directory={directory} /></Card>
      </div>
      {canViewUserHistory(permissionKeys) && <UserAuditHistory userId={user.id} />}
      {user.status === 'pending_approval'
        ? <PendingApprovalActions user={user} canBlock={canBlockPendingUsers(permissionKeys)} canApprove={canApprovePendingUsers(permissionKeys)} approvalOptions={pendingApprovalOptions.options} approvalOptionsLoading={pendingApprovalOptions.loading} approvalOptionsError={pendingApprovalOptions.error} onReloadApprovalOptions={pendingApprovalOptions.refresh} onChanged={refresh} onApproved={() => navigate(`/admin/users/${user.id}`, { replace: true, state: { justApproved: true } })} />
        : <>
          <WorkDetailsAdministration user={user} allowed={canManageStaffWork(permissionKeys)} onChanged={refresh} />
          <RoleAdministration user={user} directory={directory} roleOptions={roleOptions} roleOptionsError={roleOptionsError} loading={loading} allowed={canAssignRoles(permissionKeys)} onChanged={refresh} />
          <LifecycleActions user={user} allowed={canManageUsers(permissionKeys)} onChanged={refresh} />
        </>}
    </main>
  )
}
