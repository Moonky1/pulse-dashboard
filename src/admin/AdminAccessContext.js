import { createContext, useContext } from 'react'

export const AdminAccessContext = createContext(null)

export function useAdminPermissions() {
  const context = useContext(AdminAccessContext)
  if (!context) throw new Error('useAdminPermissions must be used within AdminAccessGate')
  return context
}
