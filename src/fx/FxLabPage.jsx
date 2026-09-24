import { useMemo, useState } from 'react'
import { PulseOrbInteractive } from '../components/ui/PulseOrbInteractive.jsx'
import { PulseSpectralButton } from '../components/ui/PulseSpectralButton.jsx'
import { SPECTRAL_VARIANTS } from '../components/ui/useSpectralMaterial.js'

const CONTROLS = [
  ['dispersion', 'Dispersion', 0, 0.03, 0.001],
  ['bend', 'Refraction', 0, 1.2, 0.02],
  ['highlight', 'Highlight', 0, 1.3, 0.02],
  ['fresnel', 'Edge Fresnel', 0, 1.2, 0.02],
  ['thickness', 'Thickness', 0, 1.2, 0.02],
  ['speed', 'Idle speed', 0, 0.8, 0.02],
  ['pointer', 'Pointer influence', 0, 1.3, 0.02],
  ['glow', 'Ambient glow', 0, 1.2, 0.02],
]

const VARIANTS = [
  { id: 'subtle', label: 'Subtle', detail: 'Quiet chrome depth for elevated general actions.', action: 'Open Dashboard' },
  { id: 'pulse', label: 'Pulse', detail: 'Signature balance: alive, physical and still restrained.', action: 'Create room' },
  { id: 'spectral', label: 'Spectral', detail: 'Highest-expression reference for rare moments.', action: 'Add new' },
]

function ContextCard({ eyebrow, title, body, action, variant, accent }) {
  return (
    <article className={`fx-context-card fx-context-card--${accent}`}>
      <span className="fx-context-card__eyebrow">{eyebrow}</span>
      <h3>{title}</h3>
      <p>{body}</p>
      <PulseSpectralButton variant={variant}>{action}</PulseSpectralButton>
    </article>
  )
}

export function FxLabPage() {
  const [activePreset, setActivePreset] = useState('pulse')
  const [tuning, setTuning] = useState(SPECTRAL_VARIANTS.pulse)
  const liveTuning = useMemo(() => ({ ...tuning }), [tuning])

  const loadPreset = (preset) => {
    setActivePreset(preset)
    setTuning(SPECTRAL_VARIANTS[preset])
  }

  const updateControl = (key, value) => {
    setActivePreset('custom')
    setTuning((current) => ({ ...current, [key]: Number(value) }))
  }

  return (
    <main className="fx-lab">
      <header className="fx-lab__topbar">
        <a className="fx-brand" href="#top" aria-label="Pulse FX Lab home">
          <PulseOrbInteractive size="small" label="Pulse" />
          <span>Pulse</span>
        </a>
        <div className="fx-lab__status"><i />Local material study · dev-only</div>
      </header>

      <section id="top" className="fx-lab__hero">
        <div className="fx-lab__hero-copy">
          <span className="fx-kicker">PULSE FX-1 · SPECTRAL INTERACTION LAB</span>
          <h1>Light that behaves like material.</h1>
          <p>
            A native WebGL study of restrained chromatic dispersion, warm reflection,
            white-hot focus and ice-blue refraction. Move near the objects—not only over them.
          </p>
          <div className="fx-lab__chips" aria-label="Implementation characteristics">
            <span>Native WebGL</span><span>DOM-first controls</span><span>CSS fallback safe</span>
          </div>
        </div>
        <div className="fx-lab__orb-stage">
          <div className="fx-lab__orb-halo" aria-hidden="true" />
          <PulseOrbInteractive
            size="hero"
            variant={activePreset === 'custom' ? 'pulse' : activePreset}
            tuning={liveTuning}
            interactive
            label="Interactive Pulse orb"
          />
          <p>Approach · focus · press</p>
        </div>
      </section>

      <section className="fx-lab__section" aria-labelledby="variants-title">
        <div className="fx-section-heading">
          <div><span className="fx-kicker">ONE MATERIAL · THREE INTENSITIES</span><h2 id="variants-title">Compare the optical voice</h2></div>
          <p>Normal text stays in the DOM. The shader is light, depth and response only.</p>
        </div>
        <div className="fx-variant-grid">
          {VARIANTS.map((item) => (
            <article className={`fx-variant-card fx-variant-card--${item.id}`} key={item.id}>
              <div className="fx-variant-card__number">0{VARIANTS.indexOf(item) + 1}</div>
              <div><h3>{item.label}</h3><p>{item.detail}</p></div>
              <PulseSpectralButton variant={item.id}>{item.action}</PulseSpectralButton>
            </article>
          ))}
        </div>
      </section>

      <section className="fx-lab__section fx-lab__workbench" aria-labelledby="workbench-title">
        <div className="fx-section-heading">
          <div><span className="fx-kicker">LIVE MATERIAL CONTROLS</span><h2 id="workbench-title">Tune without rebuilding</h2></div>
          <div className="fx-preset-group" aria-label="Material presets">
            {Object.keys(SPECTRAL_VARIANTS).map((preset) => (
              <button key={preset} type="button" className={activePreset === preset ? 'is-active' : ''} onClick={() => loadPreset(preset)}>{preset}</button>
            ))}
          </div>
        </div>
        <div className="fx-workbench-grid">
          <div className="fx-control-panel">
            {CONTROLS.map(([key, label, min, max, step]) => (
              <label className="fx-control" key={key}>
                <span>{label}<output>{tuning[key].toFixed(key === 'dispersion' ? 3 : 2)}</output></span>
                <input type="range" min={min} max={max} step={step} value={tuning[key]} onChange={(event) => updateControl(key, event.target.value)} />
              </label>
            ))}
          </div>
          <div className="fx-workbench-stage">
            <PulseOrbInteractive size="medium" variant="pulse" tuning={liveTuning} interactive label="Tuned Pulse orb" />
            <PulseSpectralButton variant="pulse" tuning={liveTuning}>Preview material</PulseSpectralButton>
          </div>
        </div>
      </section>

      <section className="fx-lab__section" aria-labelledby="contexts-title">
        <div className="fx-section-heading">
          <div><span className="fx-kicker">REAL PULSE CONTEXT</span><h2 id="contexts-title">Selective—not everywhere</h2></div>
          <p>Three controlled placements inside familiar product language.</p>
        </div>
        <div className="fx-context-grid">
          <ContextCard eyebrow="WORKSPACE" title="Your day, in focus." body="A premium entry action without turning every utility control into a spectacle." action="Open Dashboard" variant="subtle" accent="workspace" />
          <ContextCard eyebrow="PULSE GO" title="Ready to host?" body="The signature state gives a live session the right amount of ceremony." action="Create room" variant="pulse" accent="go" />
          <ContextCard eyebrow="ADMIN" title="Publish with intent." body="High expression is reserved for consequential, infrequent actions." action="Add new" variant="spectral" accent="admin" />
        </div>
      </section>

      <footer className="fx-lab__footer">
        <div className="fx-brand"><PulseOrbInteractive size="small" /><span>Pulse</span></div>
        <p>Material prototype only · no product routes or business logic changed.</p>
      </footer>
    </main>
  )
}
