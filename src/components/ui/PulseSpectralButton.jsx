import { useSpectralMaterial } from './useSpectralMaterial.js'
import './spectral.css'

export function PulseSpectralButton({
  children,
  variant = 'pulse',
  tuning,
  className = '',
  disabled = false,
  loading = false,
  type = 'button',
  ...buttonProps
}) {
  const { canvasRef, hostRef, fallback } = useSpectralMaterial({
    shape: 'pill',
    variant,
    tuning,
    sizeMode: 'medium',
    disabled: disabled || loading,
  })

  return (
    <button
      {...buttonProps}
      ref={hostRef}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`pulse-spectral-button pulse-spectral-button--${variant} ${fallback ? 'is-fallback' : ''} ${loading ? 'is-loading' : ''} ${className}`.trim()}
    >
      {!disabled && !loading && (
        <canvas
          ref={canvasRef}
          className="pulse-spectral-button__material"
          aria-hidden="true"
          tabIndex={-1}
        />
      )}
      {loading && <span className="pulse-spectral-button__spinner" aria-hidden="true" />}
      <span className={`pulse-spectral-button__label ${loading ? 'pulse-spectral-button__label--loading' : ''}`}>{children}</span>
    </button>
  )
}
