import './ui.css'

export function Badge({ children, tone = 'neutral', dot = false, className = '' }) {
  return (
    <span className={`pulse-badge pulse-badge--${tone} ${className}`}>
      {dot && <span className="pulse-badge__dot" aria-hidden="true" />}
      {children}
    </span>
  )
}
