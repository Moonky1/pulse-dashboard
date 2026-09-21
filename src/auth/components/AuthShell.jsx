import { Link } from 'react-router-dom'

import { PulseOrb } from '../../components/ui/PulseOrb.jsx'
import { AUTH_ENTRY_PATH } from '../authRoutes.js'

export function Brand({ compact = false, homePath = AUTH_ENTRY_PATH }) {
  return (
    <Link className={`auth-brand ${compact ? 'auth-brand--compact' : ''}`} to={homePath} aria-label="Pulse sign in">
      <PulseOrb size={compact ? 'sm' : 'md'} active />
      <span>Pulse</span>
    </Link>
  )
}

export function AuthShell({ eyebrow, title, description, children, footer, brandPath = AUTH_ENTRY_PATH }) {
  return (
    <main className="auth-page">
      <section className="auth-brand-panel" aria-label="Pulse">
        <Brand homePath={brandPath} />
        <div className="auth-brand-moment">
          <PulseOrb size="xl" active />
          <p className="auth-kicker">Kampaign Kings</p>
          <h2>Your place to<br />learn and work.</h2>
          <p>Everything you need, ready when you are.</p>
        </div>
      </section>
      <section className="auth-form-panel">
        <div className="auth-mobile-brand"><Brand compact homePath={brandPath} /></div>
        <div className="auth-form-wrap">
          <div className="auth-heading">
            {eyebrow && <p className="auth-eyebrow">{eyebrow}</p>}
            <h1>{title}</h1>
            {description && <p>{description}</p>}
          </div>
          {children}
          {footer && <div className="auth-footer">{footer}</div>}
        </div>
      </section>
    </main>
  )
}
