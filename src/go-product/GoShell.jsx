import { Link } from 'react-router-dom'

import { ProductHeader } from '../components/ProductHeader.jsx'
import './goProduct.css'

export function GoShell({ children }) {
  return <div className="go-shell pulse-product-surface">
    <ProductHeader />
    <main className="go-main">{children}</main>
  </div>
}

export function GoAccessState({ access }) {
  const heading = access.state === 'loading' ? 'Opening Pulse GO…'
    : access.state === 'denied' ? 'Pulse GO is not available for this account.'
      : 'We couldn’t open Pulse GO.'
  return <GoShell><section className="go-state" role="status"><h1>{heading}</h1>{access.error?.message && <p>{access.error.message}</p>}<Link to="/workspace">Back to Workspace</Link></section></GoShell>
}
