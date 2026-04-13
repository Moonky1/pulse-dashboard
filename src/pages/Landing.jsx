import { useNavigate } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import './Landing.css'

export default function Landing() {
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)
  const [orbStyle, setOrbStyle] = useState({})
  const canvasRef = useRef(null)
  const heroRef = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const handleMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 18
      const y = (e.clientY / window.innerHeight - 0.5) * 18

      setOrbStyle({
        transform: `translate(${x}px, ${y * 0.8}px) scale(1.02)`,
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
      const amount = Math.min(36, Math.floor(window.innerWidth / 55))
      particles = Array.from({ length: amount }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.8 + 0.8,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        a: Math.random() * 0.45 + 0.08,
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

    window.addEventListener('resize', () => {
      resize()
      createParticles()
    })

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div className="landing">
      <canvas ref={canvasRef} className="landing-canvas" />
      <div className="landing-grid" />
      <div className="landing-radial landing-radial-left" />
      <div className="landing-radial landing-radial-right" />
      <div className="landing-noise" />

      <section
        ref={heroRef}
        className={`landing-shell ${visible ? 'is-visible' : ''}`}
      >
        <div className="landing-panel">
          <div className="landing-copy">
            <div className="landing-eyebrow">
              <img src="/kk-logo.png" alt="Kampaign Kings" className="landing-eyebrow-logo" />
              <span>Kampaign Kings</span>
            </div>

            <h1 className="landing-title">
              <span className="landing-title-line">PULSE</span>
            </h1>

            <p className="landing-sub">
              Real-time performance intelligence for supervisors, QA and team leaders.
            </p>

            <div className="landing-meta">
              <div className="landing-meta-item">
                <strong>850+</strong>
                <span>Active Agents</span>
              </div>
              <div className="landing-meta-divider" />
              <div className="landing-meta-item">
                <strong>8+</strong>
                <span>Languages</span>
              </div>
              <div className="landing-meta-divider" />
              <div className="landing-meta-item">
                <strong>6</strong>
                <span>Teams</span>
              </div>
            </div>

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
            </div>

            <p className="landing-note">
              For Supervisors, QA & Team Leaders only
            </p>
          </div>

          <div className="landing-visual">
            <div className="visual-wrap">
              <div className="visual-topbar">
                <div className="visual-topbar-dots">
                  <span />
                  <span />
                  <span />
                </div>

                <div className="visual-topbar-actions">
                  <button type="button">Live</button>
                  <button type="button" className="is-accent">Dashboard</button>
                </div>
              </div>

              <div className="visual-stage">
                <div className="orb-glow" />
                <div className="orb-ring orb-ring-1" />
                <div className="orb-ring orb-ring-2" />
                <div className="orb-ring orb-ring-3" />
                <div className="pulse-orb" style={orbStyle}>
                  <div className="pulse-orb-core" />
                  <div className="pulse-orb-grid" />
                  <div className="pulse-orb-shine" />
                </div>

                <div className="floating-card floating-card-main">
                  <div className="fc-chip">
                    <span className="fc-live-dot" />
                    Live Overview
                  </div>
                  <div className="fc-title">Auto Warranty Garrett</div>
                  <div className="fc-stats">
                    <div>
                      <strong>1,231</strong>
                      <span>Total Xfers</span>
                    </div>
                    <div>
                      <strong>253</strong>
                      <span>English</span>
                    </div>
                    <div>
                      <strong>978</strong>
                      <span>Spanish</span>
                    </div>
                  </div>
                </div>

                <div className="floating-card floating-card-side">
                  <div className="mini-label">Top Team</div>
                  <div className="mini-team">
                    <span className="mini-team-flag">🇵🇭</span>
                    <div>
                      <strong>Philippines</strong>
                      <span>345 English xfers</span>
                    </div>
                  </div>
                </div>

                <div className="floating-card floating-card-bottom">
                  <div className="mini-bars">
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                  <div className="mini-bottom-text">
                    Team momentum updating in real time
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}