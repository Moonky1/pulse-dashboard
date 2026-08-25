import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../globals.css'
import VisualFoundationPreview from './VisualFoundationPreview.jsx'

createRoot(document.getElementById('ui-preview-root')).render(
  <StrictMode>
    <VisualFoundationPreview />
  </StrictMode>,
)
