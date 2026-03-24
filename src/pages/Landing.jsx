import { useNavigate } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import './Landing.css'

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
  Iniciar sesión →
</button>

        <p className="landing-note">For Supervisors, QA & Team Leaders only</p>
      </div>
    </div>
  )
}