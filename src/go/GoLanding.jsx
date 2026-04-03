import { useNavigate } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import './GoLanding.css'

export default function GoLanding() {
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [step, setStep] = useState('code')
  const titleRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => { setTimeout(() => setVisible(true), 100) }, [])

  useEffect(() => {
    const title = titleRef.current
    if (!title) return
    const onMove = (e) => {
      const rect = title.getBoundingClientRect()
      const dx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)
      const dy = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2)
      title.style.transform = `perspective(600px) rotateX(${-dy * 8}deg) rotateY(${dx * 8}deg) scale(1.04)`
    }
    const onLeave = () => { title.style.transform = 'perspective(600px) rotateX(0deg) rotateY(0deg) scale(1)' }
    title.addEventListener('mousemove', onMove)
    title.addEventListener('mouseleave', onLeave)
    return () => { title.removeEventListener('mousemove', onMove); title.removeEventListener('mouseleave', onLeave) }
  }, [visible])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    const pts = []
    const onMove = (e) => {
      for (let i = 0; i < 3; i++) pts.push({
        x: e.clientX + (Math.random() - 0.5) * 20,
        y: e.clientY + (Math.random() - 0.5) * 20,
        size: Math.random() * 3 + 1, life: 1,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5 - 0.5,
      })
    }
    window.addEventListener('mousemove', onMove)
    let raf
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (let i = pts.length - 1; i >= 0; i--) {
        const p = pts[i]
        p.life -= 0.03; p.x += p.vx; p.y += p.vy
        if (p.life <= 0) { pts.splice(i, 1); continue }
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(249,115,22,${p.life * 0.6})`
        ctx.fill()
      }
      raf = requestAnimationFrame(draw)
    }
    draw()
    const onResize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    window.addEventListener('resize', onResize)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('resize', onResize); cancelAnimationFrame(raf) }
  }, [])

  const handleCodeNext = () => { if (code.trim().length >= 4) setStep('name') }
  const handleJoin = () => {
    if (!name.trim()) return
    navigate(`/go/quiz/${code.trim().toUpperCase()}?name=${encodeURIComponent(name.trim())}`)
  }

  const tabs = [
    { icon: '📚', label: 'Learn',   path: '/go/learn'   },
    { icon: '🧠', label: 'Quiz',    path: '/go/quiz'    },
    { icon: '📊', label: 'Present', path: '/go/present' },
  ]

  return (
    <div className="gol-wrap">
      <canvas ref={canvasRef} className="gol-canvas" />
      <div className="gol-grid" />
      <div className="gol-particles">
        {[...Array(20)].map((_, i) => <div key={i} className="gol-particle" style={{ '--i': i }} />)}
      </div>

      {/* Nav — no logo image, just text */}
      <nav className="gol-nav">
        <div className="gol-nav-logo" onClick={() => navigate('/dashboard')}>
          <span className="gol-nav-logotext">Pulse</span>
          <span className="gol-nav-badge">GO</span>
        </div>

        <div className="gol-nav-tabs">
          {tabs.map((t) => (
            <button key={t.label} className="gol-nav-tab" onClick={() => navigate(t.path)}>
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        <button className="gol-nav-back" onClick={() => navigate('/dashboard')}>
          ← Dashboard
        </button>
      </nav>

      {/* Hero */}
      <div className={`gol-hero ${visible ? 'visible' : ''}`}>
        <img src="/kk-logo.png" alt="Kampaign Kings" className="gol-logo" />

        <h1 className="gol-title" ref={titleRef}>
          {'PULSE'.split('').map((l, i) => (
            <span key={`p${i}`} className="gol-letter" style={{ '--d': `${i * 0.08}s` }}>{l}</span>
          ))}
          <span className="gol-letter gol-space" style={{ '--d': '0.45s' }}>&nbsp;</span>
          {'GO'.split('').map((l, i) => (
            <span key={`g${i}`} className="gol-letter gol-orange" style={{ '--d': `${0.53 + i * 0.08}s` }}>{l}</span>
          ))}
        </h1>

        <p className="gol-sub">Kampaign Kings Training Hub</p>

        <div className="gol-card">
          {step === 'code' ? (
            <>
              <input
                className="gol-input"
                type="text"
                placeholder="Room code (e.g. KK1234)"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleCodeNext()}
                maxLength={8}
                autoComplete="off"
              />
              <button className="gol-btn-primary" onClick={handleCodeNext} disabled={code.trim().length < 4}>
                Enter →
              </button>
              <p className="gol-card-note">Or pick a section above ↑</p>
            </>
          ) : (
            <>
              <p className="gol-card-code">Code: <strong>{code}</strong></p>
              <input
                className="gol-input"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                autoComplete="off"
                autoFocus
              />
              <button className="gol-btn-primary" onClick={handleJoin} disabled={!name.trim()}>
                Join Session →
              </button>
              <button className="gol-btn-ghost" onClick={() => setStep('code')}>← Back</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}