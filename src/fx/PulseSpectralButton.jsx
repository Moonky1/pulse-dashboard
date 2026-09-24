import { useSpectralMaterial } from './useSpectralMaterial.js'

export function PulseSpectralButton({
  children,
  variant = 'pulse',
  tuning,
  className = '',
  disabled = false,
  type = 'button',
  ...buttonProps
}) {
  const { canvasRef, hostRef, fallback } = useSpectralMaterial({
    shape: 'pill',
    variant,
    tuning,
    sizeMode: 'medium',
    disabled,
  })

  return (
    <button
      {...buttonProps}
      ref={hostRef}
      type={type}
      disabled={disabled}
      className={`pulse-spectral-button pulse-spectral-button--${variant} ${fallback ? 'is-fallback' : ''} ${className}`.trim()}
    >
      {!disabled && (
        <canvas
          ref={canvasRef}
          className="pulse-spectral-button__material"
          aria-hidden="true"
          tabIndex={-1}
        />
      )}
      <span className="pulse-spectral-button__label">{children}</span>
    </button>
  )
}
