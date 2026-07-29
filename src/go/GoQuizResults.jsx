import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import { getQuestionById as getQuizQuestionById } from './quizPools'
import './GoQuizRoom.css'
import './GoQuizResults.css'

const QUESTION_COUNT = 10

const OPTS = [
  { c: '#ef4444', s: '▲' },
  { c: '#3b82f6', s: '◆' },
  { c: '#f59e0b', s: '●' },
  { c: '#22c55e', s: '■' },
]

const LTRS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

const GO_RESULT_ASSETS = {
  header: '/emojis/goal1.webp',
  first: {
    medal: '/emojis/medal1.webp',
    trophy: '/emojis/goal1.webp',
    label: '1st Place',
  },
  second: {
    medal: '/emojis/medal2.webp',
    trophy: '/emojis/goal3.webp',
    label: '2nd Place',
  },
  third: {
    medal: '/emojis/medal3.webp',
    trophy: '/emojis/goal4.webp',
    label: '3rd Place',
  },
  review: '/emojis/zero.webp',
  reviewSoft: '/emojis/zero1.webp',
  reviewMedium: '/emojis/zero2.webp',
  reviewCritical: '/emojis/zero3.webp',
}

function getOptionLetter(index) {
  return LTRS[index] || String(index + 1)
}

function getRankVisual(rank) {
  if (rank === 1) return GO_RESULT_ASSETS.first
  if (rank === 2) return GO_RESULT_ASSETS.second
  if (rank === 3) return GO_RESULT_ASSETS.third
  return null
}

function getPracticeVisual(accuracy) {
  const value = Number(accuracy || 0)

  if (value < 40) {
    return {
      icon: GO_RESULT_ASSETS.reviewCritical,
      label: 'Critical Review',
      className: 'critical',
    }
  }

  if (value < 60) {
    return {
      icon: GO_RESULT_ASSETS.reviewMedium,
      label: 'Needs Practice',
      className: 'medium',
    }
  }

  if (value < 70) {
    return {
      icon: GO_RESULT_ASSETS.reviewSoft,
      label: 'Review Soon',
      className: 'soft',
    }
  }

  return null
}

function normalizeCode(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
}

function hashSeed(value) {
  let hash = 2166136261
  const text = String(value || '')

  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i)
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24)
  }

  return hash >>> 0
}

function seededRandom(seed) {
  let t = seed + 0x6d2b79f5

  return () => {
    t += 0x6d2b79f5
    let x = Math.imul(t ^ (t >>> 15), 1 | t)
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x)
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}

function deterministicShuffle(array, seedText) {
  const copy = [...array]
  const random = seededRandom(hashSeed(seedText))

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }

  return copy
}

function buildDisplayQuestion(rawQuestion, roomCode, currentIndex) {
  if (!rawQuestion) return null

  const options = Array.isArray(rawQuestion.options) ? rawQuestion.options : []

  const mappedOptions = options.map((text, originalIndex) => ({
    text,
    originalIndex,
  }))

  const shuffledOptions = deterministicShuffle(
    mappedOptions,
    `${roomCode}:${rawQuestion.id}:${currentIndex}`
  )

  const correct = shuffledOptions.findIndex(
    (option) => option.originalIndex === rawQuestion.correct
  )

  return {
    ...rawQuestion,
    options: shuffledOptions.map((option) => option.text),
    correct,
  }
}

function formatGameName(room) {
  const game = String(room?.game || room?.mode || '').trim()
  const topic = String(room?.topic || 'all').trim()
  const lang = String(room?.lang || 'mixed').trim()

  return [
    game ? `Game: ${game}` : null,
    topic ? `Topic: ${topic}` : null,
    lang ? `Lang: ${lang}` : null,
  ]
    .filter(Boolean)
    .join(' · ')
}

export default function GoQuizResults() {
  const params = useParams()
  const nav = useNavigate()

  const code = normalizeCode(params.code)

  const [room, setRoom] = useState(null)
  const [players, setPlayers] = useState([])
  const [answers, setAnswers] = useState([])
  const [loading, setLoading] = useState(true)
  const [fatalError, setFatalError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let alive = true

    const loadResults = async () => {
      if (!code) {
        setFatalError('Invalid results code.')
        setLoading(false)
        return
      }

      setLoading(true)
      setFatalError('')

      const { data: roomData, error: roomError } = await supabase
        .from('pulse_go_rooms')
        .select('*')
        .eq('code', code)
        .maybeSingle()

      if (!alive) return

      if (roomError) {
        setFatalError(roomError.message || 'Could not load results.')
        setLoading(false)
        return
      }

      if (!roomData) {
        setFatalError('Results not found.')
        setLoading(false)
        return
      }

      const [{ data: playerData }, { data: answerData }] = await Promise.all([
        supabase
          .from('pulse_go_players')
          .select('*')
          .eq('room_code', code)
          .order('joined_at', { ascending: true }),

        supabase
          .from('pulse_go_answers')
          .select('*')
          .eq('room_code', code)
          .order('question_index', { ascending: true }),
      ])

      if (!alive) return

      setRoom(roomData)
      setPlayers(playerData || [])
      setAnswers(answerData || [])
      setLoading(false)
    }

    loadResults()

    return () => {
      alive = false
    }
  }, [code])

  const activePlayers = useMemo(
    () => players.filter((player) => !player.is_kicked),
    [players]
  )

  const gameQuestions = useMemo(() => {
    const ids = Array.isArray(room?.question_ids) ? room.question_ids : []

    return ids
      .map((questionId, index) =>
        buildDisplayQuestion(getQuizQuestionById(questionId), code, index)
      )
      .filter(Boolean)
  }, [room?.question_ids, code])

  const gameQuestionCount = gameQuestions.length || QUESTION_COUNT

  const playerStats = useMemo(() => {
    const stats = activePlayers.map((player) => {
      const playerAnswers = answers.filter((answer) => answer.player_id === player.id)
      const answerByQuestion = new Map(
        playerAnswers.map((answer) => [Number(answer.question_index), answer])
      )

      const correctCount = playerAnswers.filter((answer) => answer.correct === true).length
      const answeredCount = playerAnswers.length
      const accuracy =
        gameQuestionCount > 0 ? Math.round((correctCount / gameQuestionCount) * 100) : 0

      const questionResults = gameQuestions.map((question, questionIndex) => {
        const answerRow = answerByQuestion.get(questionIndex) || null
        const selectedIndex = answerRow ? Number(answerRow.answer) : null
        const selectedOption = Number.isInteger(selectedIndex)
          ? question.options[selectedIndex]
          : null
        const correctOption = question.options[question.correct] || 'N/A'
        const noAnswer = !answerRow

        return {
          questionIndex,
          questionId: question.id,
          question: question.question,
          selectedIndex,
          selectedLetter: Number.isInteger(selectedIndex)
            ? getOptionLetter(selectedIndex)
            : null,
          selectedOption: selectedOption || 'No answer',
          correctIndex: question.correct,
          correctLetter: getOptionLetter(question.correct),
          correctOption,
          correct: Boolean(answerRow?.correct),
          noAnswer,
          points: Number(answerRow?.points || 0),
          timeLeft: Number(answerRow?.time_left || 0),
        }
      })

      return {
        ...player,
        correctCount,
        answeredCount,
        missedCount: Math.max(0, gameQuestionCount - correctCount),
        accuracy,
        score: Number(player.score || 0),
        questionResults,
      }
    })

    return stats
      .sort((a, b) => {
        if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount
        if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy
        if (b.answeredCount !== a.answeredCount) return b.answeredCount - a.answeredCount
        if (b.score !== a.score) return b.score - a.score

        return new Date(a.joined_at || 0).getTime() - new Date(b.joined_at || 0).getTime()
      })
      .map((player, index) => ({
        ...player,
        rank: index + 1,
      }))
  }, [activePlayers, answers, gameQuestionCount, gameQuestions])

  const questionReport = useMemo(() => {
    const playerById = new Map(activePlayers.map((player) => [player.id, player]))
    const totalPlayers = activePlayers.length

    return gameQuestions.map((question, questionIndex) => {
      const questionAnswers = answers.filter(
        (answer) => Number(answer.question_index) === questionIndex
      )

      const answeredIds = new Set(questionAnswers.map((answer) => answer.player_id))

      const options = question.options.map((option, optionIndex) => {
        const optionAnswers = questionAnswers.filter(
          (answer) => Number(answer.answer) === optionIndex
        )

        const optionPlayers = optionAnswers
          .map((answer) => playerById.get(answer.player_id))
          .filter(Boolean)
          .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))

        return {
          index: optionIndex,
          option,
          count: optionPlayers.length,
          pct: totalPlayers > 0 ? (optionPlayers.length / totalPlayers) * 100 : 0,
          players: optionPlayers,
        }
      })

      const noAnswerPlayers = activePlayers
        .filter((player) => !answeredIds.has(player.id))
        .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))

      return {
        index: questionIndex,
        question,
        options,
        noAnswerPlayers,
      }
    })
  }, [gameQuestions, answers, activePlayers])

  const topPerformers = playerStats.slice(0, Math.min(10, playerStats.length))

  const lowPerformers = useMemo(() => {
    return [...playerStats]
      .filter((player) => {
        if (player.answeredCount <= 0) return false

        const missedEnough = player.missedCount >= 3
        const lowAccuracy = player.accuracy < 80

        return missedEnough || lowAccuracy
      })
      .sort((a, b) => {
        if (a.correctCount !== b.correctCount) return a.correctCount - b.correctCount
        if (a.accuracy !== b.accuracy) return a.accuracy - b.accuracy
        if (b.missedCount !== a.missedCount) return b.missedCount - a.missedCount
        if (a.score !== b.score) return a.score - b.score

        return new Date(a.joined_at || 0).getTime() - new Date(b.joined_at || 0).getTime()
      })
      .slice(0, 10)
  }, [playerStats])

  const podiumPlayers = [playerStats[1], playerStats[0], playerStats[2]]

  const copyResultsLink = async () => {
    const resultsLink = `${window.location.origin}/go/results/${code}`

    try {
      await navigator.clipboard.writeText(resultsLink)
      setCopied(true)

      window.setTimeout(() => {
        setCopied(false)
      }, 1800)
    } catch {
      window.prompt('Copy this results link:', resultsLink)
    }
  }

  if (loading) {
    return (
      <div className="grm grm-center">
        <div className="grm-spin">⏳ Loading results <b>{code}</b>...</div>
      </div>
    )
  }

  if (fatalError) {
    return (
      <div className="grm grm-center">
        <div className="grm-join-box">
          <h2>Results error</h2>
          <p className="grm-err">{fatalError}</p>

          <button className="grm-btn-join" onPointerDown={() => nav('/go')}>
            Back to Pulse GO
          </button>
        </div>
      </div>
    )
  }

  if (room?.state !== 'finished') {
    return (
      <div className="grm grm-center">
        <div className="grm-join-box">
          <h2>Results not ready</h2>
          <p className="grm-muted">
            Room <b>{code}</b> exists, but the game has not finished yet.
          </p>

          <button className="grm-btn-join" onPointerDown={() => nav(`/go/quiz/${code}`)}>
            Open Room
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="grm grm-finished grm-results-page">
      <div className="grm-results-topbar">
        <button className="grm-results-back" onPointerDown={() => nav('/go')}>
          ← Pulse GO
        </button>

        <button
          className={`grm-results-copy ${copied ? 'copied' : ''}`}
          onPointerDown={copyResultsLink}
        >
          {copied ? '✅ Link copied' : '🔗 Copy Results Link'}
        </button>
      </div>

      <div className="grm-finished-title">
        <h1 className="grm-finished-h">Final Results</h1>
      </div>

      <p className="grm-muted">
        {code} · {activePlayers.length} player{activePlayers.length !== 1 ? 's' : ''} ·{' '}
        {gameQuestionCount}/{gameQuestionCount} questions
      </p>

      {formatGameName(room) && <p className="grm-results-meta">{formatGameName(room)}</p>}

      <div className="grm-podium">
        {podiumPlayers.map((player, index) => {
          const podiumClass = ['second', 'first', 'third'][index]
          const visual = player ? getRankVisual(player.rank) : null

          return player ? (
            <div key={player.id} className={`grm-pod ${podiumClass}`}>
              <img src={visual.trophy} alt="" className="grm-pod-trophy" />

              <span className="grm-pod-avatar">{player.avatar}</span>
              <span className="grm-pod-place">{visual.label}</span>
              <span className="grm-pod-name">{player.name}</span>

              <div className="grm-pod-block">
                <img src={visual.medal} alt="" className="grm-pod-medal" />
              </div>

              <span className="grm-pod-score-main">
                {player.correctCount}/{gameQuestionCount}
              </span>

              <span className="grm-pod-score">
                {(player.score || 0).toLocaleString()} pts · {player.accuracy}%
              </span>
            </div>
          ) : (
            <div key={index} />
          )
        })}
      </div>

      {topPerformers.length > 0 && (
        <section className="grm-final-section grm-top-performers">
          <div className="grm-final-section-head">
            <div>
              <span>Leaderboard</span>
              <h2>Top Performers</h2>
            </div>

            <strong>Top {topPerformers.length}</strong>
          </div>

          <div className="grm-top-list">
            {topPerformers.map((player) => {
              const visual = getRankVisual(player.rank)

              return (
                <div key={player.id} className="grm-top-row">
                  <span className="grm-top-rank">
                    {visual ? <img src={visual.medal} alt="" /> : `#${player.rank}`}
                  </span>

                  <span className="grm-top-avatar">{player.avatar}</span>

                  <span className="grm-top-name">
                    {player.name}
                    <small>
                      {player.correctCount}/{gameQuestionCount} correct · {player.accuracy}%
                    </small>
                  </span>

                  <span className="grm-top-score">
                    {(player.score || 0).toLocaleString()}
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {lowPerformers.length > 0 && (
        <section className="grm-final-section grm-low-performers">
          <div className="grm-final-section-head">
            <div>
              <span>Performance Review</span>
              <h2>Low Performers</h2>
            </div>

            <strong>{lowPerformers.length} flagged</strong>
          </div>

          <div className="grm-top-list grm-low-list">
            {lowPerformers.map((player, index) => {
              const practice = getPracticeVisual(player.accuracy) || {
                icon: GO_RESULT_ASSETS.review,
                label: 'Review',
                className: 'soft',
              }

              return (
                <div
                  key={player.id}
                  className={`grm-top-row grm-low-row ${practice.className}`}
                >
                  <span className="grm-top-rank grm-low-rank">
                    <img src={practice.icon} alt="" />
                  </span>

                  <span className="grm-top-avatar">{player.avatar}</span>

                  <span className="grm-top-name">
                    {player.name}
                    <small>
                      {player.correctCount}/{gameQuestionCount} correct · {player.accuracy}% ·{' '}
                      {player.missedCount} missed
                    </small>
                  </span>

                  <span className="grm-top-score">#{index + 1}</span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {playerStats.length > 0 && (
        <section className="grm-final-section grm-participants-section">
          <div className="grm-final-section-head">
            <div>
              <span>Full Results</span>
              <h2>Participants</h2>
            </div>

            <strong>{playerStats.length} players</strong>
          </div>

          <div className="grm-participant-list">
            {playerStats.map((player) => {
              const visual = getRankVisual(player.rank)
              const practice = getPracticeVisual(player.accuracy)
              const statusIcon = visual?.medal || practice?.icon || null

              return (
                <details key={player.id} className="grm-participant-card">
                  <summary>
                    <span className="grm-participant-rank">
                      {statusIcon ? <img src={statusIcon} alt="" /> : `#${player.rank}`}
                    </span>

                    <span className="grm-participant-avatar">{player.avatar}</span>

                    <span className="grm-participant-name">
                      <strong>{player.name}</strong>
                      <small>
                        Rank #{player.rank} · {player.correctCount}/{gameQuestionCount} correct ·{' '}
                        {player.accuracy}%
                      </small>
                    </span>

                    <span className="grm-participant-score">
                      {player.score.toLocaleString()} pts
                    </span>
                  </summary>

                  <div className="grm-agent-answer-sheet">
                    <div className="grm-agent-answer-head">
                      <strong>Answer Review</strong>
                      <span>
                        {player.correctCount}/{gameQuestionCount} correct
                      </span>
                    </div>

                    <div className="grm-agent-answer-grid">
                      {player.questionResults.map((answer) => (
                        <div
                          key={`${player.id}-answer-${answer.questionIndex}`}
                          className={`grm-agent-answer-card ${
                            answer.correct
                              ? 'correct'
                              : answer.noAnswer
                              ? 'no-answer'
                              : 'wrong'
                          }`}
                        >
                          <div className="grm-agent-answer-top">
                            <span>Q{answer.questionIndex + 1}</span>
                            <strong>
                              {answer.correct
                                ? 'Correct'
                                : answer.noAnswer
                                ? 'No Answer'
                                : 'Wrong'}
                            </strong>
                          </div>

                          <p>{answer.question}</p>

                          <div className="grm-agent-answer-lines">
                            <div>
                              <small>Agent answer</small>
                              <b>
                                {answer.noAnswer
                                  ? 'No answer'
                                  : `${answer.selectedLetter} · ${answer.selectedOption}`}
                              </b>
                            </div>

                            <div>
                              <small>Correct answer</small>
                              <b>
                                {answer.correctLetter} · {answer.correctOption}
                              </b>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </details>
              )
            })}
          </div>
        </section>
      )}

      <section className="grm-host-report">
        <div className="grm-host-report-head">
          <div>
            <span>Host Report</span>
            <h2>Question Review</h2>
          </div>

          <strong>{gameQuestionCount} questions</strong>
        </div>

        <div className="grm-report-list">
          {questionReport.map((item) => (
            <details key={`${item.question.id}-${item.index}`} className="grm-report-card">
              <summary>
                <span>Q{item.index + 1}</span>
                <strong>{item.question.question}</strong>
                <em>
                  Correct: {getOptionLetter(item.question.correct)} ·{' '}
                  {item.options[item.question.correct]?.option || 'N/A'}
                </em>
              </summary>

              <div className="grm-report-options">
                {item.options.map((choice) => {
                  const meta = OPTS[choice.index] || OPTS[0]
                  const isAnswer = choice.index === item.question.correct

                  return (
                    <div
                      key={choice.index}
                      className={`grm-report-option ${isAnswer ? 'correct' : ''}`}
                      style={{ '--c': meta.c }}
                    >
                      <div className="grm-report-option-top">
                        <span className="grm-os">{meta.s}</span>
                        <span className="grm-ol">{getOptionLetter(choice.index)}</span>
                        <strong>{choice.option}</strong>
                        <em>
                          {choice.count}/{activePlayers.length}
                        </em>
                      </div>

                      <div className="grm-report-meter">
                        <div style={{ width: `${choice.pct}%` }} />
                      </div>

                      <div className="grm-report-picks">
                        {choice.players.length > 0 ? (
                          choice.players.map((player) => (
                            <span key={player.id} className="grm-host-pick-chip small">
                              <span>{player.avatar}</span>
                              <b>{player.name}</b>
                            </span>
                          ))
                        ) : (
                          <span className="grm-host-empty">No picks</span>
                        )}
                      </div>
                    </div>
                  )
                })}

                {item.noAnswerPlayers.length > 0 && (
                  <div className="grm-report-no-answer">
                    <strong>No answer:</strong>{' '}
                    {item.noAnswerPlayers.map((player) => player.name).join(', ')}
                  </div>
                )}
              </div>

              {item.question.explanation && (
                <div className="grm-report-explanation">
                  💡 {item.question.explanation}
                </div>
              )}
            </details>
          ))}
        </div>
      </section>

      <div className="grm-finished-btns grm-results-actions">
        <button className="grm-btn-primary" onPointerDown={copyResultsLink}>
          {copied ? '✅ Copied' : '🔗 Copy Results Link'}
        </button>

        <button className="grm-btn-outline" onPointerDown={() => nav('/go')}>
          Home
        </button>
      </div>
    </div>
  )
}