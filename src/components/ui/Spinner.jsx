import './ui.css'

export function Spinner({ size = 'md', label = 'Loading' }) {
  return (
    <span className={`pulse-spinner pulse-spinner--${size}`} role="status">
      <span className="pulse-sr-only">{label}</span>
    </span>
  )
}
