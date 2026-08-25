import './ui.css'

export function PulseOrb({ size = 'md', active = false, label = 'Pulse' }) {
  return (
    <span
      className={`pulse-orb pulse-orb--${size} ${active ? 'pulse-orb--active' : ''}`}
      role="img"
      aria-label={label}
    >
      <span className="pulse-orb__rim" aria-hidden="true" />
      <span className="pulse-orb__core" aria-hidden="true" />
      <span className="pulse-orb__glint" aria-hidden="true" />
    </span>
  )
}
