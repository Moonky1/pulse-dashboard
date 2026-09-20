import { Link } from 'react-router-dom'

import { PulseOrb } from '../../components/ui/PulseOrb.jsx'

export function PublicSiteShell({ children }) {
  return (
    <div className="public-site">
      <header className="public-site-header">
        <Link className="public-site-brand" to="/" aria-label="Pulse home">
          <PulseOrb size="sm" active />
          <span>Pulse</span>
        </Link>
        <nav className="public-site-nav" aria-label="Public pages">
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <Link className="public-site-signin" to="/signin">Staff sign in</Link>
        </nav>
      </header>
      {children}
      <footer className="public-site-footer">
        <span>Pulse · Kampaign Kings</span>
        <nav aria-label="Legal pages">
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
        </nav>
      </footer>
    </div>
  )
}
