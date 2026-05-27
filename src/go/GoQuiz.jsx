import { useNavigate, useSearchParams } from 'react-router-dom'
import './GoQuiz.css'

const LANG_OPTIONS = [
  {
    id: 'en',
    badge: 'US',
    icon: '🇺🇸',
    title: 'English Questions',
    desc: 'Questions and answers displayed in English.',
  },
  {
    id: 'es',
    badge: 'ES',
    icon: '🇪🇸',
    title: 'Spanish Questions',
    desc: 'Preguntas y respuestas mostradas en español.',
  },
  {
    id: 'mixed',
    badge: 'MX',
    icon: '🔀',
    title: 'Mixed',
    desc: 'A mix of English and Spanish questions.',
  },
]

const GAME_MODES = [
  {
    id: 'classic',
    icon: '🧠',
    title: 'Classic Quiz',
    desc: 'Standard Pulse GO questions by topic.',
    topic: null,
    needsTopic: true,
  },
  {
    id: 'script-fill',
    icon: '📝',
    title: 'Script Fill-in',
    desc: 'Practice missing lines and script control.',
    topic: 'script',
    needsTopic: false,
  },
  {
    id: 'valid-invalid',
    icon: '✅',
    title: 'Valid or Invalid XFER',
    desc: 'Decide if the transfer should count or not.',
    topic: 'dosdonts',
    needsTopic: false,
  },
  {
    id: 'objection-battle',
    icon: '🛡️',
    title: 'Objection Battle',
    desc: 'Pick the strongest rebuttal under pressure.',
    topic: 'objections',
    needsTopic: false,
  },
  {
  id: 'disposition-trainer',
  icon: '🧾',
  title: 'Dispose It',
  desc: 'Pick the correct disposition for each call scenario.',
  topic: 'disposeit',
  needsTopic: false,
 },
  {
    id: 'certification',
    icon: '🏅',
    title: 'Certification Mode',
    desc: 'Mixed challenge from all training areas.',
    topic: 'all',
    needsTopic: false,
  },
]

const TOPICS = [
  {
    id: 'all',
    icon: '⚡',
    title: 'All Topics',
    desc: 'Mixed from everything.',
  },
  {
    id: 'script',
    icon: '📋',
    title: 'Script',
    desc: 'Opening lines & script control.',
  },
  {
    id: 'objections',
    icon: '🛡️',
    title: 'Objections',
    desc: 'Rebuttals & responses.',
  },
  {
    id: 'product',
    icon: '📦',
    title: 'Product Knowledge',
    desc: 'Coverage & exclusions.',
  },
  {
    id: 'callflow',
    icon: '📞',
    title: 'Call Flow',
    desc: 'Transfer protocol.',
  },
  {
    id: 'dosdonts',
    icon: '⚠️',
    title: "Do's & Don'ts",
    desc: 'Rules & compliance.',
  },
]

function makeRoomCode() {
  return `KK${Math.floor(1000 + Math.random() * 9000)}`
}

export default function GoQuiz() {
  const navigate = useNavigate()
const [params] = useSearchParams()

const goHome = () => {
  const loggedIn = Boolean(localStorage.getItem('pulse_user'))
  navigate(loggedIn ? '/dashboard' : '/')
}

  const trainingMode = params.get('mode')
  const lang = params.get('lang')
  const game = params.get('game')

  const goToMode = (nextMode) => {
    navigate(`/go/quiz?mode=${nextMode}`)
  }

  const goToLanguage = (nextLang) => {
    navigate(`/go/quiz?mode=${trainingMode}&lang=${nextLang}`)
  }

  const goToGame = (gameMode) => {
    if (gameMode.needsTopic) {
      navigate(`/go/quiz?mode=${trainingMode}&lang=${lang}&game=${gameMode.id}`)
      return
    }

    launchGame(gameMode.id, gameMode.topic)
  }

  const launchGame = (gameId, topicId) => {
    const finalTopic = topicId || 'all'
    const finalLang = lang || 'mixed'
    const finalGame = gameId || game || 'classic'

    if (trainingMode === 'host') {
      const code = makeRoomCode()
      navigate(
        `/go/quiz/${code}?host=true&topic=${finalTopic}&lang=${finalLang}&game=${finalGame}`
      )
      return
    }

    navigate(`/go/quiz/play?topic=${finalTopic}&lang=${finalLang}&game=${finalGame}`)
  }

  const activeGame = GAME_MODES.find((item) => item.id === game)

  return (
    <div className="gq-page">
      <div className="gq-bg-stars" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>

      <header className="gq-shell-nav">
        <button className="gq-back-btn" onClick={() => navigate('/go')}>
          ← Home
        </button>

        <nav className="gq-main-pill">
          <button onClick={goHome}>Home</button>
          <button className="active" onClick={() => navigate('/go')}>Pulse GO</button>
          <button onClick={() => navigate('/academy')}>Academy</button>
        </nav>

        <div />
      </header>

      {!trainingMode && (
        <main className="gq-wrap">
          <section className="gq-hero">
            <h1>Training Mode</h1>
            <p>Choose how you want to train with Pulse GO.</p>
          </section>

          <section className="gq-card-grid two">
            <button className="gq-card" onClick={() => goToMode('host')}>
              <span className="gq-card-icon">🎮</span>
              <h2>Host a Game</h2>
              <p>Create a live room, share the code, and compete with your team.</p>
              <b>Create Room →</b>
            </button>

            <button className="gq-card" onClick={() => goToMode('solo')}>
              <span className="gq-card-icon">👤</span>
              <h2>Practice</h2>
              <p>Train at your own pace with instant feedback.</p>
              <b>Start →</b>
            </button>
          </section>
        </main>
      )}

      {trainingMode && !lang && (
        <main className="gq-wrap">
          <section className="gq-hero">
            <h1>Choose Language</h1>
            <p>Pick how questions and answers should appear.</p>
          </section>

          <section className="gq-card-grid three">
            {LANG_OPTIONS.map((item) => (
              <button
                key={item.id}
                className="gq-card"
                onClick={() => goToLanguage(item.id)}
              >
                <span className="gq-card-badge">{item.badge}</span>
                <span className="gq-card-icon">{item.icon}</span>
                <h2>{item.title}</h2>
                <p>{item.desc}</p>
              </button>
            ))}
          </section>

          <div className="gq-bottom-actions">
            <button onClick={() => navigate('/go/quiz')}>Change Mode</button>
          </div>
        </main>
      )}

      {trainingMode && lang && !game && (
        <main className="gq-wrap">
          <section className="gq-hero">
            <h1>Choose Game</h1>
            <p>Select the training style before starting.</p>
          </section>

          <section className="gq-card-grid three">
            {GAME_MODES.map((item) => (
              <button
                key={item.id}
                className="gq-card"
                onClick={() => goToGame(item)}
              >
                <span className="gq-card-icon">{item.icon}</span>
                <h2>{item.title}</h2>
                <p>{item.desc}</p>
                <b>{item.needsTopic ? 'Choose Topic →' : 'Start →'}</b>
              </button>
            ))}
          </section>

          <div className="gq-bottom-actions">
            <button onClick={() => navigate(`/go/quiz?mode=${trainingMode}`)}>
              ← Language
            </button>
          </div>
        </main>
      )}

      {trainingMode && lang && game && activeGame?.needsTopic && (
        <main className="gq-wrap">
          <section className="gq-hero">
            <h1>Choose a Topic</h1>
            <p>Select what you want to practice.</p>
          </section>

          <section className="gq-card-grid three">
            {TOPICS.map((topic) => (
              <button
                key={topic.id}
                className="gq-card"
                onClick={() => launchGame(game, topic.id)}
              >
                <span className="gq-card-icon">{topic.icon}</span>
                <h2>{topic.title}</h2>
                <p>{topic.desc}</p>
              </button>
            ))}
          </section>

          <div className="gq-bottom-actions">
            <button onClick={() => navigate(`/go/quiz?mode=${trainingMode}&lang=${lang}`)}>
              ← Game Mode
            </button>
          </div>
        </main>
      )}
    </div>
  )
}