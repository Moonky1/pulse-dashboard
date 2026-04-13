import { useNavigate } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import './Landing.css'

export default function Landing() {
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)
  const [orbStyle, setOrbStyle] = useState({})
  const canvasRef = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const handleMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 14
      const y = (e.clientY / window.innerHeight - 0.5) * 10
      setOrbStyle({
        transform: `translate(${x}px, ${y}px)`,
      })
    }

    window.addEventListener('mousemove', handleMove)
    return () => window.removeEventListener('mousemove', handleMove)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId
    let particles = []

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    const createParticles = () => {
      const amount = Math.min(32, Math.floor(window.innerWidth / 70))
      particles = Array.from({ length: amount }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.7 + 0.6,
        vx: (Math.random() - 0.5) * 0.14,
        vy: (Math.random() - 0.5) * 0.14,
        a: Math.random() * 0.35 + 0.05,
      }))
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy

        if (p.x < -20) p.x = canvas.width + 20
        if (p.x > canvas.width + 20) p.x = -20
        if (p.y < -20) p.y = canvas.height + 20
        if (p.y > canvas.height + 20) p.y = -20

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(249, 115, 22, ${p.a})`
        ctx.fill()
      }

      animationFrameId = requestAnimationFrame(draw)
    }

    resize()
    createParticles()
    draw()

    const handleResize = () => {
      resize()
      createParticles()
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div className="landing">
      <canvas ref={canvasRef} className="landing-canvas" />
      <div className="landing-grid" />
      <div className="landing-noise" />
      <div className="landing-side-glow landing-side-glow-left" />
      <div className="landing-side-glow landing-side-glow-right" />

      <section className={`landing-shell ${visible ? 'is-visible' : ''}`}>
        <div className="landing-panel">
          <div className="landing-topbar">
            <div className="landing-brand">
              <img src="/kk-logo.png" alt="Kampaign Kings" className="landing-brand-logo" />
              <span>Kampaign Kings</span>
            </div>

            <div className="landing-top-actions">
              <button type="button" onClick={() => navigate('/go')}>GO</button>
              <button type="button" className="is-accent" onClick={() => navigate('/signin')}>
                Dashboard
              </button>
            </div>
          </div>

          <div className="landing-hero">
            <div className="landing-copy">
              <h1 className="landing-title">PULSE</h1>

              <p className="landing-sub">
                Performance intelligence for leaders.
              </p>

              <div className="landing-actions">
                <button
                  className="landing-btn landing-btn-primary"
                  onClick={() => navigate('/register')}
                >
                  Registrarse
                </button>

                <button
                  className="landing-btn landing-btn-secondary"
                  onClick={() => navigate('/signin')}
                >
                  Iniciar sesión
                </button>

                <button
                  className="landing-btn landing-btn-go"
                  onClick={() => navigate('/go')}
                >
                  Pulse GO
                </button>
              </div>

              <p className="landing-note">
                Supervisors, QA & Team Leaders
              </p>
            </div>

            <div className="landing-visual" aria-hidden="true">
              <div className="visual-card">
                <div className="visual-frame" />
                <div className="visual-glow-floor" />
                <div className="visual-horizon" />
                <div className="visual-core-wrap" style={orbStyle}>
                  <div className="visual-core" />
                  <div className="visual-core-inner" />
                </div>
                <div className="visual-reflection" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}