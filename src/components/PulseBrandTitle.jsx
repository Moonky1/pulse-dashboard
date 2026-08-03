import './PulseBrandTitle.css'

export default function PulseBrandTitle({ suffix = '' }) {
  const cleanSuffix = String(suffix || '').trim()

  const suffixClass = cleanSuffix
    ? ` pulse-brand-title--${cleanSuffix
        .toLowerCase()
        .replace(/\s+/g, '-')}`
    : ''

  return (
    <h1
      className={`pulse-brand-title${suffixClass}`}
      draggable="false"
    >
      <span className="pulse-brand-title__main">
        PULSE
      </span>

      {cleanSuffix ? (
        <span className="pulse-brand-title__badge">
          {cleanSuffix}
        </span>
      ) : null}
    </h1>
  )
}