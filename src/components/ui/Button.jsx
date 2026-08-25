import './ui.css'

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  iconOnly = false,
  className = '',
  disabled,
  ...props
}) {
  return (
    <button
      className={`pulse-button pulse-button--${variant} pulse-button--${size} ${iconOnly ? 'pulse-button--icon' : ''} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <span className="pulse-button__spinner" aria-hidden="true" />}
      <span className={loading ? 'pulse-button__content pulse-button__content--loading' : 'pulse-button__content'}>
        {children}
      </span>
    </button>
  )
}
