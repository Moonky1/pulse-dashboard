import './GoLanding.css'

const STARS = [
  { top: '12%', left: '10%' },
  { top: '16%', left: '28%' },
  { top: '14%', left: '48%' },
  { top: '18%', left: '72%' },
  { top: '24%', left: '84%' },
  { top: '32%', left: '18%' },
  { top: '36%', left: '38%' },
  { top: '30%', left: '62%' },
  { top: '41%', left: '78%' },
  { top: '52%', left: '14%' },
  { top: '58%', left: '28%' },
  { top: '55%', left: '70%' },
  { top: '66%', left: '18%' },
  { top: '72%', left: '42%' },
  { top: '69%', left: '82%' },
  { top: '83%', left: '20%' },
  { top: '86%', left: '58%' },
  { top: '80%', left: '88%' },
]

const SHOOTING_STARS = [
  { top: '18%', left: '78%', delay: '0s', duration: '6.5s' },
  { top: '28%', left: '64%', delay: '2.4s', duration: '7.5s' },
  { top: '12%', left: '58%', delay: '4.8s', duration: '6.8s' },
  { top: '34%', left: '86%', delay: '7.2s', duration: '8s' },
  { top: '22%', left: '72%', delay: '9.4s', duration: '7.2s' },
]

export default function PulseGoBackground() {
  return (
    <>
      <div className="pgl-bg" />
      <div className="pgl-grid" />
      <div className="pgl-soft-glow" />
      <div className="pgl-cursor-glow" />

      <div className="pgl-stars" aria-hidden="true">
        {STARS.map((star, index) => (
          <span
            key={index}
            className="pgl-star"
            style={{
              top: star.top,
              left: star.left,
              animationDelay: `${index * 0.35}s`,
            }}
          />
        ))}
      </div>

      <div className="pgl-shooting-stars" aria-hidden="true">
        {SHOOTING_STARS.map((item, index) => (
          <span
            key={index}
            className="pgl-shooting-star"
            style={{
              top: item.top,
              left: item.left,
              animationDelay: item.delay,
              animationDuration: item.duration,
            }}
          />
        ))}
      </div>
    </>
  )
}