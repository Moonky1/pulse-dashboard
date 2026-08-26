import { Navigate, useLocation } from 'react-router-dom'

import { AccountStatePage } from '../../auth/screens/AccountStatePage.jsx'
import { useAdminAccess } from '../hooks/useAdminAccess.js'

export function AdminAccessGate({ children }) {
  const access = useAdminAccess()
  const location = useLocation()
  if (access.state === 'loading') return <AccountStatePage kind="loading" />
  if (access.state === 'allowed') return children
  return (
    <Navigate
      to="/workspace"
      replace
      state={{ adminAccess: access.state === 'error' ? 'verification-failed' : 'denied', from: location.pathname }}
    />
  )
}
