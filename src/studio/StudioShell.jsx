import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button.jsx'
import { PulseOrb } from '../components/ui/PulseOrb.jsx'
import { useAuth } from '../auth/AuthProvider.jsx'

export function StudioShell({ children, confirmLeave = () => true }) {
  const { signOut } = useAuth()
  return <div className="studio-shell"><header className="studio-topbar">
    <Link className="studio-brand" to="/workspace"><PulseOrb size="sm" active /><span>Pulse</span></Link>
    <nav aria-label="Studio navigation"><Link to="/workspace">Workspace</Link><Link to="/studio">Studio</Link></nav>
    <Button variant="ghost" onClick={() => { if (confirmLeave()) void signOut() }}>Sign out</Button>
  </header><main className="studio-main">{children}</main></div>
}

export function StudioAccessState({ access }) {
  return <StudioShell><section className="studio-empty" role="status"><h1>{access.state === 'loading' ? 'Opening Studio…' : access.state === 'denied' ? 'Studio is not available for this account.' : 'We couldn’t open Studio.'}</h1><p>{access.error?.message}</p><Link to="/workspace">Back to Workspace</Link></section></StudioShell>
}
