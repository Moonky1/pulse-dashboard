import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'

import { AUTH_STATES, routeForAuthState } from './authState.js'
import { AGENT_SIGN_IN_PATH, AUTH_ENTRY_PATH, STAFF_FORGOT_PASSWORD_PATH, STAFF_REGISTER_PATH } from './authRoutes.js'
import { useAuth } from './AuthProvider.jsx'
const AccountStatePage = lazy(() => import('./screens/AccountStatePage.jsx').then((module) => ({ default: module.AccountStatePage })))
const AdminArea = lazy(() => import('../admin/AdminArea.jsx').then((module) => ({ default: module.AdminArea })))
const AgentSignInPage = lazy(() => import('./screens/AgentSignInPage.jsx').then((module) => ({ default: module.AgentSignInPage })))
const AuthCallbackPage = lazy(() => import('./screens/AuthCallbackPage.jsx').then((module) => ({ default: module.AuthCallbackPage })))
const ForgotPasswordPage = lazy(() => import('./screens/ForgotPasswordPage.jsx').then((module) => ({ default: module.ForgotPasswordPage })))
const PendingApprovalPage = lazy(() => import('./screens/PendingApprovalPage.jsx').then((module) => ({ default: module.PendingApprovalPage })))
const RegisterPage = lazy(() => import('./screens/RegisterPage.jsx').then((module) => ({ default: module.RegisterPage })))
const ResetPasswordPage = lazy(() => import('./screens/ResetPasswordPage.jsx').then((module) => ({ default: module.ResetPasswordPage })))
const SignInPage = lazy(() => import('./screens/SignInPage.jsx').then((module) => ({ default: module.SignInPage })))
const VerifyEmailPage = lazy(() => import('./screens/VerifyEmailPage.jsx').then((module) => ({ default: module.VerifyEmailPage })))
const WorkspacePage = lazy(() => import('./screens/WorkspacePage.jsx').then((module) => ({ default: module.WorkspacePage })))

function RouteGate({ allow, children }) {
  const { authState } = useAuth()
  const location = useLocation()
  if (authState === AUTH_STATES.LOADING) return <AccountStatePage kind="loading" />
  if (allow.includes(authState)) return children
  return <Navigate to={routeForAuthState(authState) || AUTH_ENTRY_PATH} replace state={{ from: location.pathname }} />
}

function PublicOnly({ children }) {
  return <RouteGate allow={[AUTH_STATES.ANONYMOUS]}>{children}</RouteGate>
}

export function AuthApp() {
  return (
    <BrowserRouter>
      <Suspense fallback={<AccountStatePage kind="loading" />}><Routes>
        <Route path="/" element={<Navigate to={AUTH_ENTRY_PATH} replace />} />
        <Route path={AUTH_ENTRY_PATH} element={<PublicOnly><SignInPage /></PublicOnly>} />
        <Route path={STAFF_REGISTER_PATH} element={<PublicOnly><RegisterPage /></PublicOnly>} />
        <Route path={STAFF_FORGOT_PASSWORD_PATH} element={<PublicOnly><ForgotPasswordPage /></PublicOnly>} />
        <Route path={AGENT_SIGN_IN_PATH} element={<PublicOnly><AgentSignInPage /></PublicOnly>} />
        <Route path="/staff/signin" element={<Navigate to={AUTH_ENTRY_PATH} replace />} />
        <Route path="/staff/register" element={<Navigate to={STAFF_REGISTER_PATH} replace />} />
        <Route path="/staff/forgot-password" element={<Navigate to={STAFF_FORGOT_PASSWORD_PATH} replace />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/auth/verify" element={<VerifyEmailPage />} />
        <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
        <Route path="/pending-approval" element={<RouteGate allow={[AUTH_STATES.PENDING]}><PendingApprovalPage /></RouteGate>} />
        <Route path="/workspace" element={<RouteGate allow={[AUTH_STATES.ACTIVE]}><WorkspacePage /></RouteGate>} />
        <Route path="/admin/*" element={<RouteGate allow={[AUTH_STATES.ACTIVE]}><AdminArea /></RouteGate>} />
        <Route path="/account-blocked" element={<RouteGate allow={[AUTH_STATES.BLOCKED]}><AccountStatePage kind="blocked" /></RouteGate>} />
        <Route path="/account-inactive" element={<RouteGate allow={[AUTH_STATES.INACTIVE]}><AccountStatePage kind="inactive" /></RouteGate>} />
        <Route path="/account-error" element={<RouteGate allow={[AUTH_STATES.ERROR, AUTH_STATES.MISSING_PROFILE]}><AccountStatePage kind="error" /></RouteGate>} />
        <Route path="*" element={<Navigate to={AUTH_ENTRY_PATH} replace />} />
      </Routes></Suspense>
    </BrowserRouter>
  )
}
