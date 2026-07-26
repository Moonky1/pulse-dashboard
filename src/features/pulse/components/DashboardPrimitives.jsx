import { MEDALS } from '../config/dashboardConfig'
import {
  getTeamFlag,
  getTeamLabel,
} from '../utils/dashboardHelpers'

export function FlagImg({ src, size = 18, alt = '' }) {
  if (!src) {
    return (
      <span
        style={{
          fontSize: size * 0.9,
          lineHeight: 1,
        }}
      >
        🌎
      </span>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={Math.round(size * 0.72)}
      style={{
        borderRadius: 3,
        objectFit: 'cover',
        display: 'inline-block',
      }}
    />
  )
}

export function Medal({ index, size = 18 }) {
  return (
    <img
      src={MEDALS[index]}
      alt=""
      width={size}
      height={size}
      style={{ objectFit: 'contain' }}
    />
  )
}

export function RankMarker({ index }) {
  if (index < 3) {
    return <Medal index={index} size={20} />
  }

  return (
    <span className="pulse-team-rank-text">
      #{index + 1}
    </span>
  )
}

export function TeamInlineLabel({
  teamId,
  teamFlag,
  teamLabel,
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        fontWeight: 900,
      }}
    >
      <FlagImg
        src={teamFlag || getTeamFlag(teamId)}
        size={18}
        alt=""
      />

      {teamLabel || getTeamLabel(teamId)}
    </span>
  )
}

export function SummaryCard({
  title,
  value,
  color,
  subtitle,
  titleColor,
}) {
  return (
    <div className="pulse-summary-card">
      <div
        className="pulse-summary-title"
        style={{ color: titleColor || undefined }}
      >
        {title}
      </div>

      <div
        className="pulse-summary-value"
        style={{ color }}
      >
        {Number(value || 0).toLocaleString()}
      </div>

      <div className="pulse-summary-subtitle">
        {subtitle || ''}
      </div>
    </div>
  )
}

export function LovableKpi({
  title,
  value,
  tone,
}) {
  return (
    <div className={`lov-kpi-card ${tone}`}>
      <div className="lov-kpi-title">
        {title}
      </div>

      <div className="lov-kpi-value">
        {Number(value || 0).toLocaleString()}
      </div>
    </div>
  )
}