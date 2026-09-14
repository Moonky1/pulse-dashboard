import { Link } from 'react-router-dom'

import { PulseOrb } from '../../components/ui/PulseOrb.jsx'
import { PublicSiteShell } from '../components/PublicSiteShell.jsx'

export function PublicHomePage() {
  return (
    <PublicSiteShell>
      <main className="public-home">
        <section className="public-home-copy">
          <p className="public-site-eyebrow">Pulse</p>
          <h1>The internal workspace for training, operations, and team collaboration.</h1>
          <p>One secure place for Kampaign Kings staff to learn, work, and stay connected.</p>
          <div className="public-home-actions">
            <Link className="public-primary-action" to="/signin">Staff sign in</Link>
          </div>
          <p className="public-home-note">Authentication identifies you. Company approval controls access.</p>
        </section>
        <div className="public-home-orb" aria-hidden="true">
          <PulseOrb size="xl" active label="" />
        </div>
      </main>
    </PublicSiteShell>
  )
}
