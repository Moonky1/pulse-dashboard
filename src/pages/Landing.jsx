import { useNavigate } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import './landing.css'

export default function Landing() {
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)
  const titleRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => { setTimeout(() => setVisible(true), 100) }, [])

  useEffect(() => {
    const title = titleRef.current
    if (!title) return
    const handleMove = (e) => {
      const rect = title.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = (e.clientX - cx) / (rect.width / 2)
      const dy = (e.clientY - cy) / (rect.height / 2)
      title.style.transform = `perspective(600px) rotateX(${-dy * 8}deg) rotateY(${dx * 8}deg) scale(1.04)`
    }
    const handleLeave = () => {
      title.style.transform = 'perspective(600px) rotateX(0deg) rotateY(0deg) scale(1)'
    }
    title.addEventListener('mousemove', handleMove)
    title.addEventListener('mouseleave', handleLeave)
    return () => {
      title.removeEventListener('mousemove', handleMove)
      title.removeEventListener('mouseleave', handleLeave)
    }
  }, [visible])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    const particles = []

    const onMove = (e) => {
      for (let i = 0; i < 3; i++) {
        particles.push({
          x: e.clientX + (Math.random() - 0.5) * 20,
          y: e.clientY + (Math.random() - 0.5) * 20,
          size: Math.random() * 3 + 1,
          life: 1,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5 - 0.5,
        })
      }
    }

    window.addEventListener('mousemove', onMove)

    let raf
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.life -= 0.03
        p.x += p.vx
        p.y += p.vy
        if (p.life <= 0) { particles.splice(i, 1); continue }
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(249, 115, 22, ${p.life * 0.6})`
        ctx.fill()
      }
      raf = requestAnimationFrame(draw)
    }
    draw()

    const onResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div className="landing">
      <canvas ref={canvasRef} className="trail-canvas" />
      <div className="grid-bg" />
      <div className="particles">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="particle" style={{ '--i': i }} />
        ))}
      </div>

      <div className={`landing-content ${visible ? 'visible' : ''}`}>
        <img src="/kk-logo.png" alt="Kampaign Kings" className="kk-logo-img" />

        <h1 className="landing-title" ref={titleRef}>
          {'PULSE'.split('').map((l, i) => (
            <span key={i} className="letter" style={{ '--d': `${i * 0.08}s` }}>{l}</span>
          ))}
        </h1>

        <p className="landing-sub">Real-time agent performance tracking</p>

        <div className="landing-stats">
          <div className="stat"><strong>850+</strong><span>Active Agents</span></div>
          <div className="stat-div" />
          <div className="stat"><strong>8+</strong><span>Languages</span></div>
          <div className="stat-div" />
          <div className="stat"><strong>6</strong><span>Teams</span></div>
        </div>

        <button className="google-btn" onClick={() => navigate('/register')}>
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <p className="landing-note">For Supervisors, QA & Team Leaders only</p>
      </div>
    </div>
  )
}