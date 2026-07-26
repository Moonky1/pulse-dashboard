import { useEffect, useMemo, useRef, useState } from 'react'

import {
  SORT_OPTIONS,
  TEAM_ORDER,
  TEAMS,
} from '../config/dashboardConfig'

import {
  formatDateLabel,
  normalizeDate,
  playPulseSound,
  todayKey,
} from '../utils/dashboardViewHelpers'

import { FlagImg } from './DashboardPrimitives'

export function TeamTabs({ selectedTeam, onChange }) {
  return (
    <div className="pulse-tabs-grid">
      <button
        className={`pulse-tab ${
          selectedTeam === 'all' ? 'active' : ''
        }`}
        onClick={() => onChange('all')}
      >
        <span>All Teams</span>
      </button>

      {TEAM_ORDER.map(teamId => {
        const team = TEAMS[teamId]
        const active = selectedTeam === teamId

        return (
          <button
            key={teamId}
            className={`pulse-tab ${active ? 'active' : ''}`}
            onClick={() => onChange(teamId)}
          >
            <FlagImg src={team.flag} size={18} alt="" />
            <span>{team.short}</span>
          </button>
        )
      })}
    </div>
  )
}

export function SortTabs({ sortMetric, onChange }) {
  return (
    <div className="pulse-sort-tabs">
      {SORT_OPTIONS.map(option => (
        <button
          key={option.id}
          className={`pulse-sort-tab ${
            sortMetric === option.id ? 'active' : ''
          }`}
          onClick={() => {
            playPulseSound('click')
            onChange(option.id)
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function DateSelectorRow({
  dates = [],
  selectedDate,
  onChange,
}) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    const handleClickOutside = event => {
      if (
        wrapRef.current
        && !wrapRef.current.contains(event.target)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  const groupedDates = useMemo(() => {
    const monthFormatter = new Intl.DateTimeFormat('en-US', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    })

    const groups = []
    const groupMap = new Map()

    ;(dates || []).forEach(date => {
      const normalized = normalizeDate(date)
      if (!normalized) return

      const key = normalized.slice(0, 7)

      const label = normalized === todayKey()
        ? 'Today'
        : monthFormatter.format(
            new Date(`${normalized}T12:00:00Z`)
          )

      if (!groupMap.has(key)) {
        const group = {
          key,
          label,
          dates: [],
        }

        groupMap.set(key, group)
        groups.push(group)
      }

      groupMap.get(key).dates.push(normalized)
    })

    return groups
  }, [dates])

  return (
    <section
      className="lov-date-row"
      ref={wrapRef}
      style={{
        alignItems: 'center',
        overflow: 'visible',
        flexWrap: 'nowrap',
        paddingBottom: 0,
        position: 'relative',
        zIndex: 20,
      }}
    >
      <button
        type="button"
        className="lov-date-btn active"
        onClick={() => setOpen(previous => !previous)}
        style={{
          minWidth: 190,
          justifyContent: 'space-between',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <span>{formatDateLabel(selectedDate)}</span>

        <span style={{ fontSize: 14, opacity: 0.8 }}>
          {open ? '▲' : '▼'}
        </span>
      </button>

      {open ? (
        <div
        className="lov-date-menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            left: 0,
            width: 310,
            maxHeight: 420,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: 12,
            borderRadius: 18,
            border: '1px solid rgba(215, 185, 135, 0.34)',
            background:
              'linear-gradient(180deg, rgba(16, 14, 12, 0.98), rgba(7, 7, 7, 0.98))',
            boxShadow: '0 22px 60px rgba(0, 0, 0, 0.65)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '4px 4px 10px',
              color: '#f7eee7',
              fontWeight: 800,
            }}
          >
            <span>Select day</span>

            <span
              style={{
                color: '#8f8178',
                fontSize: 12,
              }}
            >
              {dates.length} days
            </span>
          </div>

          {groupedDates.map(group => (
            <div
              key={group.key}
              style={{ marginBottom: 12 }}
            >
              <div
                style={{
                  color: '#8f8178',
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '.08em',
                  textTransform: 'uppercase',
                  margin: '4px 4px 8px',
                }}
              >
                {group.label}
              </div>

              <div
                style={{
                  display: 'grid',
                  gap: 6,
                }}
              >
                {group.dates.map(date => {
                  const active = date === selectedDate

                  return (
                    <button
                      key={date}
                      type="button"
                      onClick={() => {
                        playPulseSound('click')
                        onChange(date)
                        setOpen(false)
                      }}
                      style={{
                        width: '100%',
                        border: active
                          ? '1px solid rgba(215, 185, 135, 0.75)'
                          : '1px solid rgba(255,255,255,0.08)',
                        background: active
                          ? 'rgba(215, 185, 135, 0.16)'
                          : 'rgba(255,255,255,0.035)',
                        color: active
                          ? '#f0d19a'
                          : '#f7eee7',
                        borderRadius: 12,
                        padding: '10px 12px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontWeight: active ? 800 : 600,
                      }}
                    >
                      {formatDateLabel(date)}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}