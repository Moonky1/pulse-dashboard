import './ui.css'

export function Card({ children, level = 2, interactive = false, className = '', ...props }) {
  return (
    <div
      className={`pulse-card pulse-card--level-${level} ${interactive ? 'pulse-card--interactive' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
