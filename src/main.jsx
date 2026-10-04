import {
  createRoot,
} from 'react-dom/client'

import './index.css'
import App from './App.jsx'
import { AuthProvider } from './auth/AuthProvider.jsx'
import { AgentSessionProvider } from './go-product/AgentSession.jsx'

createRoot(
  document.getElementById(
    'root'
  )
).render(
  <AuthProvider>
    <AgentSessionProvider><App /></AgentSessionProvider>
  </AuthProvider>
)
