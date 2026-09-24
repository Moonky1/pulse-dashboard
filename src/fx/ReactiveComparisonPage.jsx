import { useState } from 'react'
import { Link } from 'react-router-dom'

import { PulseOrb } from '../components/ui/PulseOrb.jsx'
import { PulseOrbInteractive } from '../components/ui/PulseOrbInteractive.jsx'
import { PulseSpectralButton } from '../components/ui/PulseSpectralButton.jsx'
import './reactiveComparison.css'

export function ReactiveComparisonPage() {
  const [activated, setActivated] = useState(false)
  const [previewMotion, setPreviewMotion] = useState(false)

  return <main className="fx-2b-review">
    <header><Link to="/">Pulse</Link><span>FX-2B · Preview comparison</span></header>
    <section className="fx-2b-intro">
      <p>Product material review</p>
      <h1>Reactive Liquid Pulse</h1>
      <span>Move the pointer toward and across the new Orb and button. This page is not part of normal navigation.</span>
      <label className="fx-2b-motion-toggle"><input type="checkbox" checked={previewMotion} onChange={(event) => setPreviewMotion(event.target.checked)} /> Preview motion on this review page (ignores this device’s reduced-motion setting here only)</label>
    </section>
    <div className="fx-2b-grid">
      <section className="fx-2b-card">
        <p>Current Production style</p>
        <div className="fx-2b-orb"><PulseOrb size="xl" active /></div>
        <button className="fx-2b-current-button" type="button" onClick={() => setActivated(true)}>Open Dashboard</button>
      </section>
      <section className="fx-2b-card fx-2b-card--new">
        <p>New reactive liquid style</p>
        <div className="fx-2b-orb"><PulseOrbInteractive size="hero" previewMotion={previewMotion} /></div>
        <PulseSpectralButton previewMotion={previewMotion} onClick={() => setActivated(true)}>Open Dashboard</PulseSpectralButton>
      </section>
    </div>
    <p className="fx-2b-feedback" role="status">{activated ? 'Preview action activated.' : 'Both actions are clickable; neither changes product data.'}</p>
  </main>
}
