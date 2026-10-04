import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import '../design/globals.css'
import '../components/ui/ui.css'
import './styles/auth.css'
import { AuthApp } from './AuthApp.jsx'
import { AuthProvider } from './AuthProvider.jsx'
import { AgentSessionProvider } from '../go-product/AgentSession.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode><AuthProvider><AgentSessionProvider><AuthApp /></AgentSessionProvider></AuthProvider></StrictMode>
)
