import './ui.css'

export function Input({
  id,
  label,
  hint,
  error,
  success,
  leading,
  className = '',
  ...props
}) {
  const message = error || success || hint
  const messageId = message ? `${id}-message` : undefined

  return (
    <div className={`pulse-field ${error ? 'pulse-field--error' : ''} ${success ? 'pulse-field--success' : ''} ${className}`}>
      <label className="pulse-field__label" htmlFor={id}>{label}</label>
      <div className="pulse-field__control">
        {leading && <span className="pulse-field__leading" aria-hidden="true">{leading}</span>}
        <input
          id={id}
          className="pulse-input"
          aria-invalid={Boolean(error)}
          aria-describedby={messageId}
          {...props}
        />
      </div>
      {message && (
        <p className="pulse-field__message" id={messageId} role={error ? 'alert' : undefined}>
          {message}
        </p>
      )}
    </div>
  )
}
