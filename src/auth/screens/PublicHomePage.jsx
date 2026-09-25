import { Link, useSearchParams } from 'react-router-dom'

import { PulseOrbInteractive } from '../../components/ui/PulseOrbInteractive.jsx'
import { PublicSiteShell } from '../components/PublicSiteShell.jsx'

export function PublicHomePage() {
  const [searchParams] = useSearchParams()
  const colorway = searchParams.get('fx') === 'ice' ? 'ice' : 'soft'
  return (
    <PublicSiteShell>
      <main className="public-home">
        <section className="public-home-copy">
          <p className="public-site-eyebrow">Kampaign Kings</p>
          <h1>Welcome to Pulse</h1>
          <p>Learn, create, and stay connected</p>
          <div className="public-home-actions">
            <Link className="public-primary-action" to="/signin">Staff sign in</Link>
          </div>
        </section>
        <div className="public-home-orb" aria-hidden="true">
          <PulseOrbInteractive size="hero" colorway={colorway} label="" />
        </div>
      </main>
    </PublicSiteShell>
  )
}
