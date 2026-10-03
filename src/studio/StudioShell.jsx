import { Link } from 'react-router-dom'
import { ProductHeader } from '../components/ProductHeader.jsx'

export function StudioShell({ children, confirmLeave = () => true }) {
  return <div className="studio-shell pulse-product-surface"><ProductHeader confirmLeave={confirmLeave} /><main className="studio-main">{children}</main></div>
}

export function StudioAccessState({ access }) {
  return <StudioShell><section className="studio-empty" role="status"><h1>{access.state === 'loading' ? 'Opening Studio…' : access.state === 'denied' ? 'Studio is not available for this account' : 'We couldn’t open Studio'}</h1><p>{access.error?.message}</p><Link to="/workspace">Back to Workspace</Link></section></StudioShell>
}
