import { useSpectralMaterial } from './useSpectralMaterial.js'
import './spectral.css'

export function PulseOrbInteractive({
  size = 'hero',
  variant = 'pulse',
  colorway = 'soft',
  tuning,
  interactive = false,
  previewMotion = false,
  label = 'Pulse',
  className = '',
}) {
  const simplified = size === 'small'
  const { canvasRef, hostRef, fallback } = useSpectralMaterial({
    shape: 'orb',
    variant,
    colorway,
    tuning,
    sizeMode: size,
    disabled: simplified,
    pressable: interactive,
    previewMotion,
  })

  return (
    <span
      ref={hostRef}
      className={`pulse-orb-interactive pulse-orb-interactive--${size} pulse-orb-interactive--${variant} ${simplified || fallback ? 'is-fallback' : ''} ${interactive ? 'is-interactive' : ''} ${className}`.trim()}
      role="img"
      aria-label={label}
      tabIndex={interactive ? 0 : undefined}
    >
      {!simplified && (
        <canvas
          ref={canvasRef}
          className="pulse-orb-interactive__material"
          aria-hidden="true"
          tabIndex={-1}
        />
      )}
      <span className="pulse-orb-interactive__rim" aria-hidden="true" />
      <span className="pulse-orb-interactive__core" aria-hidden="true" />
      <span className="pulse-orb-interactive__glint" aria-hidden="true" />
    </span>
  )
}
