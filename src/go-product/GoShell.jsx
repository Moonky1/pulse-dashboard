import { Link } from 'react-router-dom'

import { useAuth } from '../auth/AuthProvider.jsx'
import { Button } from '../components/ui/Button.jsx'
import { PulseOrb } from '../components/ui/PulseOrb.jsx'
import './goProduct.css'

export function GoShell({ children }) {
  const { signOut } = useAuth()
  return <div className="go-shell">
    <header className="go-topbar">
      <Link className="go-brand" to="/workspace"><PulseOrb size="sm" active /><span>Pulse GO</span></Link>
      <nav aria-label="GO navigation"><Link to="/workspace">Workspace</Link><Link to="/go">GO</Link><Link to="/studio">Studio</Link></nav>
      <Button variant="ghost" onClick={() => void signOut()}>Sign out</Button>
    </header>
    <main className="go-main">{children}</main>
  </div>
}

export function GoAccessState({ access }) {
  const heading = access.state === 'loading' ? 'Opening Pulse GO…'
    : access.state === 'denied' ? 'Pulse GO is not available for this account.'
      : 'We couldn’t open Pulse GO.'
  return <GoShell><section className="go-state" role="status"><h1>{heading}</h1>{access.error?.message && <p>{access.error.message}</p>}<Link to="/workspace">Back to Workspace</Link></section></GoShell>
}
