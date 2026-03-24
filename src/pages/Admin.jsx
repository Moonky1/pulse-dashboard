import { useEffect, useState } from 'react'
import { generateToken, secondsUntilNext } from '../utils/token'

const ADMIN_PASSWORD = 'pulse2026kk'

export default function Admin() {
  const [unlocked, setUnlocked] = useState(false)
  const [pass, setPass]         = useState('')
  const [passError, setPassError] = useState('')
  const [token, setToken]       = useState(generateToken())
  const [seconds, setSeconds]   = useState(secondsUntilNext())
  const [copied, setCopied]     = useState(false)

  useEffect(() => {
    if (!unlocked) return
    const interval = setInterval(() => {
      setToken(generateToken())
      setSeconds(secondsUntilNext())
    }, 1000)
    return () => clearInterval(interval)
  }, [unlocked])

  const unlock = () => {
    if (pass === ADMIN_PASSWORD) {
      setUnlocked(true)
    } else {
      setPassError('Wrong password')
      setPass('')
    }
  }

  const copy = () => {
    navigator.clipboard.writeText(token)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const pct = ((300 - seconds) / 300) * 100

  const boxStyle = {
    background: '#181b23',
    border: '0.5px solid #2a2d38',
    borderRadius: 16,
    padding: '2.5rem 2rem',
    width: '100%',
    maxWidth: 360,
    textAlign: 'center',
  }

  const wrapStyle = {
    minHeight: '100vh',
    background: '#080a0f',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'DM Sans', sans-serif",
  }

  const badgeStyle = {
    width: 48, height: 48,
    background: '#f97316',
    borderRadius: 12,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 1.5rem',
    fontFamily: "'Sora', sans-serif",
    fontWeight: 800, fontSize: 22, color: '#fff',
  }

  if (!unlocked) {
    return (
      <div style={wrapStyle}>
        <div style={boxStyle}>
          <div style={badgeStyle}>P</div>
          <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Admin Access
          </p>
          <input
            type="password"
            placeholder="Enter admin password"
            value={pass}
            onChange={e => { setPass(e.target.value); setPassError('') }}
            onKeyDown={e => e.key === 'Enter' && unlock()}
            style={{
              width: '100%',
              background: '#0d0f14',
              border: `0.5px solid ${passError ? '#f87171' : '#2a2d38'}`,
              borderRadius: 10,
              padding: '12px 16px',
              fontSize: 14,
              color: '#f5f5f5',
              outline: 'none',
              fontFamily: "'DM Sans', sans-serif",
              marginBottom: 8,
            }}
            autoFocus
          />
          {passError && <p style={{ fontSize: 12, color: '#f87171', marginBottom: 12 }}>{passError}</p>}
          <button onClick={unlock} style={{
            width: '100%',
            padding: '12px',
            background: '#f97316',
            border: 'none',
            borderRadius: 10,
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: "'Sora', sans-serif",
            marginTop: 8,
          }}>
            Unlock
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={wrapStyle}>
      <div style={boxStyle}>
        <div style={badgeStyle}>P</div>
        <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Current Access Token
        </p>
        <div style={{
          fontSize: 48,
          fontFamily: "'Sora', sans-serif",
          fontWeight: 800,
          letterSpacing: '0.2em',
          color: '#f97316',
          margin: '0.5rem 0 1.5rem',
        }}>
          {token}
        </div>
        <div style={{ background: '#2a2d38', borderRadius: 4, height: 4, marginBottom: 12, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${pct}%`,
            background: seconds < 30 ? '#f87171' : '#f97316',
            borderRadius: 4,
            transition: 'width 1s linear, background 0.3s',
          }} />
        </div>
        <p style={{ fontSize: 13, color: seconds < 30 ? '#f87171' : '#6b7280', marginBottom: '1.5rem' }}>
          Changes in {seconds}s
        </p>
        <button onClick={copy} style={{
          width: '100%',
          padding: '12px',
          background: copied ? '#0d2018' : 'transparent',
          border: `0.5px solid ${copied ? '#1a4a2e' : '#2a2d38'}`,
          borderRadius: 10,
          color: copied ? '#34d399' : '#9ca3af',
          fontSize: 14,
          cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif",
          transition: 'all 0.2s',
        }}>
          {copied ? '✓ Copied!' : 'Copy token'}
        </button>
        <p style={{ marginTop: '2rem', fontSize: 11, color: '#374151' }}>
          /admin — keep this URL private
        </p>
      </div>
    </div>
  )
}