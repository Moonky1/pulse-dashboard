import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'

import { AUTH_STATES, routeForAuthState } from './authState.js'
import { useAuth } from './AuthProvider.jsx'
const AccountStatePage = lazy(() => import('./screens/AccountStatePage.jsx').then((module) => ({ default: module.AccountStatePage })))
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
  return <Navigate to={routeForAuthState(authState) || '/signin'} replace state={{ from: location.pathname }} />
}

function PublicOnly({ children }) {
  return <RouteGate allow={[AUTH_STATES.ANONYMOUS]}>{children}</RouteGate>
}

export function AuthApp() {
  return (
    <BrowserRouter>
      <Suspense fallback={<AccountStatePage kind="loading" />}><Routes>
        <Route path="/" element={<Navigate to="/signin" replace />} />
        <Route path="/signin" element={<PublicOnly><SignInPage /></PublicOnly>} />
        <Route path="/register" element={<PublicOnly><RegisterPage /></PublicOnly>} />
        <Route path="/forgot-password" element={<PublicOnly><ForgotPasswordPage /></PublicOnly>} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/auth/verify" element={<VerifyEmailPage />} />
        <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
        <Route path="/pending-approval" element={<RouteGate allow={[AUTH_STATES.PENDING]}><PendingApprovalPage /></RouteGate>} />
        <Route path="/workspace" element={<RouteGate allow={[AUTH_STATES.ACTIVE]}><WorkspacePage /></RouteGate>} />
        <Route path="/account-blocked" element={<RouteGate allow={[AUTH_STATES.BLOCKED]}><AccountStatePage kind="blocked" /></RouteGate>} />
        <Route path="/account-inactive" element={<RouteGate allow={[AUTH_STATES.INACTIVE]}><AccountStatePage kind="inactive" /></RouteGate>} />
        <Route path="/account-error" element={<RouteGate allow={[AUTH_STATES.ERROR, AUTH_STATES.MISSING_PROFILE]}><AccountStatePage kind="error" /></RouteGate>} />
        <Route path="*" element={<Navigate to="/signin" replace />} />
      </Routes></Suspense>
    </BrowserRouter>
  )
}
