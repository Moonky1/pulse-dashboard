import { useNavigate, useSearchParams } from 'react-router-dom'
import { APP_CONFIG } from '../config'
import './GoQuiz.css'

const LANG_OPTIONS = [
  {
    id: 'en',
    flag: 'us',
    title: 'English Questions',
    desc: 'Questions and answers displayed in English.',
  },
  {
    id: 'es',
    flag: 'mx',
    title: 'Spanish Questions',
    desc: 'Preguntas y respuestas mostradas en español.',
  },
  {
    id: 'mixed',
    icon: '🔀',
    title: 'Mixed',
    desc: 'A mix of English and Spanish questions.',
  },
]

const DIFFICULTY_OPTIONS = [
  {
    id: 'easy',
    badge: 'EASY',
    icon: '🟢',
    title: 'Easy',
    desc: 'Basic questions for new agents: dispositions, consent, simple eligibility, and safe wording.',
  },
  {
    id: 'medium',
    badge: 'MEDIUM',
    icon: '🟡',
    title: 'Medium',
    desc: 'Scenario-based questions with more QA judgment and call flow decisions.',
  },
  {
    id: 'advanced',
    badge: 'ADVANCED',
    icon: '🔴',
    title: 'Advanced',
    desc: 'Harder QA scenarios with tricky consent, handoff, eligibility, and compliance details.',
  },
]

const GAME_MODES = [
  {
    id: 'classic',
    image: '/emojis/classic.webp',
    title: 'Classic Quiz',
    desc: 'Standard Pulse GO questions by difficulty level.',
    topic: 'all',
    needsTopic: false,
    supportsDifficulty: true,
    supportsQuestionStyle: false,
  },
  {
    id: 'valid-invalid',
    image: '/emojis/valid.webp',
    title: 'Valid or Invalid XFER',
    desc: 'Decide if the transfer should count or not.',
    topic: 'dosdonts',
    needsTopic: false,
    supportsQuestionStyle: false,
  },
  {
    id: 'objection-battle',
    image: '/emojis/objection.png',
    title: 'Objection Battle',
    desc: 'Pick the strongest rebuttal under pressure.',
    topic: 'objections',
    needsTopic: false,
    supportsQuestionStyle: false,
  },
  {
    id: 'disposition-trainer',
    image: '/emojis/disposeit.webp',
    title: 'Dispose It',
    desc: 'Pick the correct disposition for each call scenario.',
    topic: 'disposeit',
    needsTopic: false,
    supportsQuestionStyle: false,
  },
  {
    id: 'eligible',
    image: '/emojis/vehiclee.png',
    title: 'Eligible or Not Eligible',
    desc: 'Decide if the vehicle/customer can move forward.',
    topic: 'eligible',
    needsTopic: false,
    supportsQuestionStyle: false,
  },
  {
    id: 'certification',
    image: '/emojis/certification.webp',
    title: 'Certification Mode',
    desc: 'Hard final exam with dedicated questions.',
    topic: 'certification',
    needsTopic: false,
    supportsQuestionStyle: false,
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

const QUESTION_STYLES = [
  {
    id: 'mc',
    icon: '🔘',
    badge: 'SAFE',
    title: 'Multiple Choice Only',
    desc: 'Current format: A/B/C/D questions only.',
    details: ['Best for live rooms today', 'No typing required', 'Fast scoring'],
  },
  {
    id: 'mixed',
    icon: '🔀',
    badge: 'MIX',
    title: 'Mixed Questions',
    desc: 'Allows future 2-option and short-answer questions.',
    details: ['Multiple choice', 'Valid / Invalid style', 'Short written answers'],
  },
]

function makeRoomCode() {
  return `KK${Math.floor(1000 + Math.random() * 9000)}`
}

function normalizeQuestionStyle(value) {
  if (value === 'mixed') return 'mixed'
  return 'mc'
}

function normalizeDifficulty(value) {
  const clean = String(value || 'all')
    .toLowerCase()
    .trim()

  if (clean === 'easy') return 'easy'
  if (clean === 'medium') return 'medium'
  if (clean === 'advanced') return 'advanced'

  return 'all'
}

export default function GoQuiz() {
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const trainingMode = params.get('mode')
  const team = params.get('team')
  const lang = params.get('lang')
  const game = params.get('game')
  const topic = params.get('topic')
  const qstyle = params.get('qstyle')
  const difficulty = params.get('difficulty')

  const activeGame = GAME_MODES.find((item) => item.id === game)
  const selectedQuestionStyle = normalizeQuestionStyle(qstyle)

  const selectedTeam = APP_CONFIG.teams.find((item) => item.id === team) || null

  const getTeamQuery = () => {
  if (trainingMode !== 'host' || !team) return ''
  return `&team=${encodeURIComponent(team)}`
}

  const goHome = () => {
    const loggedIn = Boolean(localStorage.getItem('pulse_user'))
    navigate(loggedIn ? '/dashboard' : '/')
  }

  const goToMode = (nextMode) => {
    navigate(`/go/quiz?mode=${nextMode}`)
  }

const goToTeam = (nextTeam) => {
  navigate(`/go/quiz?mode=host&team=${encodeURIComponent(nextTeam)}`)
}

const goToLanguage = (nextLang) => {
  navigate(`/go/quiz?mode=${trainingMode}${getTeamQuery()}&lang=${nextLang}`)
}

const goToGame = (gameMode) => {
  if (gameMode.supportsDifficulty) {
    navigate(
      `/go/quiz?mode=${trainingMode}${getTeamQuery()}&lang=${lang}&game=${gameMode.id}&topic=${gameMode.topic || 'all'}`
    )
    return
  }

  if (gameMode.supportsQuestionStyle) {
    navigate(
      `/go/quiz?mode=${trainingMode}${getTeamQuery()}&lang=${lang}&game=${gameMode.id}&topic=${gameMode.topic || 'all'}`
    )
    return
  }

  if (gameMode.needsTopic) {
    navigate(`/go/quiz?mode=${trainingMode}${getTeamQuery()}&lang=${lang}&game=${gameMode.id}`)
    return
  }

  launchGame(gameMode.id, gameMode.topic, 'mc', 'all')
}

const goToTopic = (topicId) => {
  if (activeGame?.supportsQuestionStyle) {
    navigate(`/go/quiz?mode=${trainingMode}${getTeamQuery()}&lang=${lang}&game=${game}&topic=${topicId}`)
    return
  }

  launchGame(game, topicId, 'mc', 'all')
}

  const goToDifficulty = (difficultyId) => {
    launchGame(game, topic || 'all', 'mc', difficultyId)
  }

  const goToQuestionStyle = (styleId) => {
    launchGame(game, topic || 'all', styleId, difficulty || 'all')
  }

  const launchGame = (
    gameId,
    topicId,
    questionStyleId = selectedQuestionStyle,
    difficultyId = difficulty || 'all'
  ) => {
    const finalTopic = topicId || 'all'
    const finalLang = lang || 'mixed'
    const finalGame = gameId || game || 'classic'
    const finalQuestionStyle = normalizeQuestionStyle(questionStyleId)
    const finalDifficulty = normalizeDifficulty(difficultyId)

if (trainingMode === 'host') {
  const code = makeRoomCode()
  const finalTeam = team || selectedTeam?.id || 'all'

  navigate(
    `/go/quiz/${code}?host=true&team=${encodeURIComponent(finalTeam)}&topic=${finalTopic}&lang=${finalLang}&game=${finalGame}&qstyle=${finalQuestionStyle}&difficulty=${finalDifficulty}`
  )
  return
}

    navigate(
      `/go/quiz/play?topic=${finalTopic}&lang=${finalLang}&game=${finalGame}&qstyle=${finalQuestionStyle}&difficulty=${finalDifficulty}`
    )
  }

  return (
    <div className="gq-page">
      <div className="gq-bg-stars" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>

<header className="gq-shell-nav">
  <nav className="gq-main-pill">
    <button onClick={goHome}>
      Home
    </button>

    <button
      className="active"
      onClick={() => navigate('/go')}
    >
      GO
    </button>

    <button onClick={() => navigate('/studio')}>
      Studio
    </button>

    <button onClick={() => navigate('/academy')}>
      Academy
    </button>
  </nav>
</header>

      {!trainingMode && (
        <main className="gq-wrap">
          <section className="gq-hero">
            <h1>Training Mode</h1>
            <p>Choose how you want to train with Pulse GO.</p>
          </section>

<section className="gq-card-grid two gq-training-grid">
  <button
    className="gq-card gq-choice-card gq-training-card"
    onClick={() => goToMode('host')}
  >
    <h2>Host a Game</h2>

    <div className="gq-choice-visual">
      <span className="gq-card-icon">🎮</span>
    </div>

    <p>
      Create a live room, share the code, and compete with your team.
    </p>

    <b>Create Room →</b>
  </button>

  <button
    className="gq-card gq-choice-card gq-training-card"
    onClick={() => goToMode('solo')}
  >
    <h2>Practice</h2>

    <div className="gq-choice-visual">
      <span className="gq-card-icon">👤</span>
    </div>

    <p>
      Train at your own pace with instant feedback.
    </p>

    <b>Start →</b>
  </button>
</section>
        </main>
      )}

      {trainingMode === 'host' && !team && (
  <main className="gq-wrap">
    <section className="gq-hero">
      <h1>Choose Team</h1>
      <p>Select which team will play this live game.</p>
    </section>

    <section className="gq-card-grid three gq-team-grid">
      {APP_CONFIG.teams.map((item) => (
        <button
          key={item.id}
          className="gq-card gq-team-card"
          onClick={() => goToTeam(item.id)}
        >
<img
  className="gq-team-flag"
  src={`https://flagcdn.com/w80/${
    item.id === 'asia'
      ? 'ph'
      : item.id === 'central'
        ? 'gt'
        : item.code
  }.png`}
  alt={item.name}
/>

<h2>{item.name}</h2>
        </button>
      ))}
    </section>

    <div className="gq-bottom-actions">
      <button onClick={() => navigate('/go/quiz')}>← Change Mode</button>
    </div>
  </main>
)}



      {trainingMode && (trainingMode !== 'host' || team) && !lang && (
        <main className="gq-wrap">
          <section className="gq-hero">
            <h1>Choose Language</h1>
            <p>
  {trainingMode === 'host' && selectedTeam
    ? `${selectedTeam.name} selected. Pick how questions and answers should appear.`
    : 'Pick how questions and answers should appear.'}
</p>
          </section>

<section className="gq-card-grid three gq-language-grid">
  {LANG_OPTIONS.map((item) => (
    <button
      key={item.id}
      className="gq-card gq-choice-card gq-language-card"
      onClick={() => goToLanguage(item.id)}
    >
      <h2>{item.title}</h2>

      <div className="gq-choice-visual">
        {item.flag ? (
          <img
            className="gq-language-flag"
            src={`https://flagcdn.com/w160/${item.flag}.png`}
            alt={
              item.id === 'en'
                ? 'United States flag'
                : 'Mexico flag'
            }
          />
        ) : (
          <span className="gq-card-icon gq-language-mixed-icon">
            {item.icon}
          </span>
        )}
      </div>

      <p>{item.desc}</p>

      <span
        className="gq-choice-footer-placeholder"
        aria-hidden="true"
      />
    </button>
  ))}
</section>

          <div className="gq-bottom-actions">
            <button onClick={() => navigate(trainingMode === 'host' ? '/go/quiz?mode=host' : '/go/quiz')}>
  {trainingMode === 'host' ? '← Team' : 'Change Mode'}
</button>
          </div>
        </main>
      )}

      {trainingMode && (trainingMode !== 'host' || team) && lang && !game && (
        <main className="gq-wrap">
          <section className="gq-hero">
            <h1>Choose Game</h1>
            <p>Select the training style before starting.</p>
          </section>

<section className="gq-card-grid three gq-game-grid">
  {GAME_MODES.map((item) => (
    <button
      key={item.id}
      className="gq-card gq-choice-card gq-game-card"
      onClick={() => goToGame(item)}
    >
      <h2>{item.title}</h2>

      <div className="gq-choice-visual">
        <img
          className="gq-game-image"
          src={item.image}
          alt=""
          aria-hidden="true"
        />
      </div>

      <p>{item.desc}</p>

      <b>
        {item.supportsDifficulty
          ? 'Choose Difficulty →'
          : item.supportsQuestionStyle
            ? 'Choose Style →'
            : item.needsTopic
              ? 'Choose Topic →'
              : 'Start →'}
      </b>
    </button>
  ))}
</section>

          <div className="gq-bottom-actions">
            <button onClick={() => navigate(`/go/quiz?mode=${trainingMode}${getTeamQuery()}`)}>
              ← Language
            </button>
          </div>
        </main>
      )}


            {trainingMode && (trainingMode !== 'host' || team) && lang && game && activeGame?.supportsDifficulty && topic && !difficulty && (
        <main className="gq-wrap">
          <section className="gq-hero">
            <h1>Choose Difficulty</h1>
            <p>Select the Classic Quiz level for this game.</p>
          </section>

          <section className="gq-card-grid three">
            {DIFFICULTY_OPTIONS.map((item) => (
<button
  key={item.id}
  className="gq-card gq-difficulty-card"
  onClick={() => goToDifficulty(item.id)}
>
  <div className="gq-difficulty-top">
    <span className="gq-card-badge">{item.badge}</span>
    <span className="gq-card-icon">{item.icon}</span>
  </div>

  <p>{item.desc}</p>
  <b>Start →</b>
</button>
            ))}
          </section>

          <div className="gq-bottom-actions">
            <button onClick={() => navigate(`/go/quiz?mode=${trainingMode}${getTeamQuery()}&lang=${lang}`)}>
              ← Game Mode
            </button>
          </div>
        </main>
      )}

      {trainingMode && (trainingMode !== 'host' || team) && lang && game && activeGame?.needsTopic && !topic && (
        <main className="gq-wrap">
          <section className="gq-hero">
            <h1>Choose a Topic</h1>
            <p>Select what you want to practice.</p>
          </section>

          <section className="gq-card-grid three">
            {TOPICS.map((topicItem) => (
              <button
                key={topicItem.id}
                className="gq-card"
                onClick={() => goToTopic(topicItem.id)}
              >
                <span className="gq-card-icon">{topicItem.icon}</span>
                <h2>{topicItem.title}</h2>
                <p>{topicItem.desc}</p>
              </button>
            ))}
          </section>

          <div className="gq-bottom-actions">
            <button onClick={() =>navigate(`/go/quiz?mode=${trainingMode}${getTeamQuery()}&lang=${lang}`) }>
              ← Game Mode
            </button>
          </div>
        </main>
      )}

      {trainingMode && (trainingMode !== 'host' || team) && lang && game && activeGame?.supportsQuestionStyle && topic && !qstyle && (
        <main className="gq-wrap">
          <section className="gq-hero">
            <h1>Question Style</h1>
            <p>Choose if this room should stay classic or allow mixed question types.</p>
          </section>

          <section className="gq-card-grid two gq-style-grid">
            {QUESTION_STYLES.map((item) => (
              <button
                key={item.id}
                className={`gq-card gq-style-card ${item.id === 'mc' ? 'recommended' : ''}`}
                onClick={() => goToQuestionStyle(item.id)}
              >
                <span className="gq-style-badge">{item.badge}</span>
                <span className="gq-card-icon">{item.icon}</span>
                <h2>{item.title}</h2>
                <p>{item.desc}</p>

                <ul>
                  {item.details.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>

                <b>{item.id === 'mc' ? 'Use safe mode →' : 'Use mixed mode →'}</b>
              </button>
            ))}
          </section>

          <div className="gq-bottom-actions">
            <button onClick={() => navigate(`/go/quiz?mode=${trainingMode}${getTeamQuery()}&lang=${lang}`)}>
            ← Game Mode
          </button>
          </div>
        </main>
      )}
    </div>
  )
}
