import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../design/tokens.css'
import './fx.css'
import { FxLabPage } from './FxLabPage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <FxLabPage />
  </StrictMode>,
)
