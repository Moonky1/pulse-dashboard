import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { AdminAccessGate } from './components/AdminAccessGate.jsx'
import { AdminShell } from './components/AdminShell.jsx'
import { AdminStatePanel } from './components/AdminStatePanel.jsx'
import './styles/admin.css'

const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage.jsx').then((module) => ({ default: module.AdminUsersPage })))
const AdminUserDetailPage = lazy(() => import('./pages/AdminUserDetailPage.jsx').then((module) => ({ default: module.AdminUserDetailPage })))

export function AdminArea() {
  return (
    <AdminAccessGate>
      <Suspense fallback={<AdminStatePanel kind="loading" title="Loading Administration" body="Preparing the secure management view…" />}>
        <Routes>
          <Route element={<AdminShell />}>
            <Route index element={<Navigate to="users" replace />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="users/:userId" element={<AdminUserDetailPage />} />
            <Route path="*" element={<Navigate to="users" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </AdminAccessGate>
  )
}
