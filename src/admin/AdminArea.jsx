import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { AdminAccessGate } from './components/AdminAccessGate.jsx'
import { AdminShell } from './components/AdminShell.jsx'
import { AdminStatePanel } from './components/AdminStatePanel.jsx'
import { useAdminPermissions } from './AdminAccessContext.js'
import { canViewAudit, canViewDepartments, canViewTeams, hasAdminUsersAccess } from './access.js'
import './styles/admin.css'

const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage.jsx').then((module) => ({ default: module.AdminUsersPage })))
const AdminUserDetailPage = lazy(() => import('./pages/AdminUserDetailPage.jsx').then((module) => ({ default: module.AdminUserDetailPage })))
const AdminPendingUsersPage = lazy(() => import('./pages/AdminPendingUsersPage.jsx').then((module) => ({ default: module.AdminPendingUsersPage })))
const AdminOrganizationPage = lazy(() => import('./pages/AdminOrganizationPage.jsx').then((module) => ({ default: module.AdminOrganizationPage })))
const AdminAuditPage = lazy(() => import('./pages/AdminAuditPage.jsx').then((module) => ({ default: module.AdminAuditPage })))

function AdminLanding() {
  const { permissionKeys } = useAdminPermissions()
  const destination = hasAdminUsersAccess(permissionKeys) ? 'users' : canViewAudit(permissionKeys) ? 'audit' : 'organization'
  return <Navigate to={destination} replace />
}

function UsersRoute({ children }) {
  const { permissionKeys } = useAdminPermissions()
  return hasAdminUsersAccess(permissionKeys) ? children : <AdminLanding />
}

function OrganizationRoute({ children }) {
  const { permissionKeys } = useAdminPermissions()
  return canViewDepartments(permissionKeys) || canViewTeams(permissionKeys) ? children : <AdminLanding />
}

function AuditRoute({ children }) {
  const { permissionKeys } = useAdminPermissions()
  return canViewAudit(permissionKeys) ? children : <AdminLanding />
}

export function AdminArea() {
  return (
    <AdminAccessGate>
      <Suspense fallback={<AdminStatePanel kind="loading" title="Loading Administration" body="Preparing the secure management view…" />}>
        <Routes>
          <Route element={<AdminShell />}>
            <Route index element={<AdminLanding />} />
            <Route path="users" element={<UsersRoute><AdminUsersPage /></UsersRoute>} />
            <Route path="pending" element={<UsersRoute><AdminPendingUsersPage /></UsersRoute>} />
            <Route path="pending/:userId" element={<UsersRoute><AdminUserDetailPage pendingOnly /></UsersRoute>} />
            <Route path="users/:userId" element={<UsersRoute><AdminUserDetailPage /></UsersRoute>} />
            <Route path="organization" element={<OrganizationRoute><AdminOrganizationPage /></OrganizationRoute>} />
            <Route path="audit" element={<AuditRoute><AdminAuditPage /></AuditRoute>} />
            <Route path="*" element={<AdminLanding />} />
          </Route>
        </Routes>
      </Suspense>
    </AdminAccessGate>
  )
}
