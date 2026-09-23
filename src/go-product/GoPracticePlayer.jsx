import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { Button } from '../components/ui/Button.jsx'
import { resolveGoPracticeDestination } from '../training/goPracticeDestination.js'
import { completeTrainingAttempt, getGoPracticeContent, startTrainingAttempt } from '../training/trainingApi.js'
import { supabase } from '../utils/supabase.js'
import { canPractice } from './goAccess.js'
import { resultMedal } from './goHostedModel.js'
import { GoAccessState, GoShell } from './GoShell.jsx'
import { buildAnswerSubmission, isAnswerReady, isSafePracticePayload, normalizePracticeContent, normalizeResult } from './goPracticeModel.js'
import { GO_ART, resolveGoArt } from './goVisualAssets.js'
import { useGoAccess } from './useGoAccess.js'

function AnswerControl({ question, answer, onChange }) {
  if (question.question_type === 'multiple_choice') return <fieldset className="go-answer-list"><legend>Choose one answer</legend>{question.answer_options.map((option, index) => <label key={index}><input type="radio" name={question.id} checked={answer === index} onChange={() => onChange(index)} /><span>{option}</span></label>)}</fieldset>
  if (question.question_type === 'true_false') return <fieldset className="go-answer-list go-answer-list--binary"><legend>Choose one answer</legend>{[true, false].map(value => <label key={String(value)}><input type="radio" name={question.id} checked={answer === value} onChange={() => onChange(value)} /><span>{value ? 'True' : 'False'}</span></label>)}</fieldset>
  return <label className="go-text-answer"><span>Your answer</span><textarea autoFocus rows="4" value={answer ?? ''} maxLength="1000" onChange={event => onChange(event.target.value)} /></label>
}

export function GoPracticePlayer() {
  const { contentId } = useParams()
  const access = useGoAccess()
  const destination = resolveGoPracticeDestination(supabase.supabaseUrl)
  const [session, setSession] = useState({ content: null, attempt: null, loading: true, error: null })
  const [answers, setAnswers] = useState({})
  const [questionIndex, setQuestionIndex] = useState(0)
  const [result, setResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const openAttempt = useCallback(async () => {
    setSession(previous => ({ ...previous, loading: true, error: null }))
    const [contentResponse, attemptResponse] = await Promise.all([
      getGoPracticeContent(supabase, contentId),
      startTrainingAttempt(supabase, contentId, 'go_practice'),
    ])
    const content = normalizePracticeContent(contentResponse.data)
    const attempt = normalizeResult(attemptResponse.data)
    const error = contentResponse.error || attemptResponse.error || (!content || !isSafePracticePayload(content) ? { message: 'This practice item is unavailable.' } : null)
    setSession({ content: error ? null : content, attempt: error ? null : attempt, loading: false, error })
  }, [contentId])

  useEffect(() => {
    if (access.state !== 'allowed' || !canPractice(access.capabilities) || !destination.allowed) return
    const timer = setTimeout(() => { void openAttempt() }, 0)
    return () => clearTimeout(timer)
  }, [access.capabilities, access.state, destination.allowed, openAttempt])

  const question = session.content?.questions[questionIndex]
  const progress = session.content ? ((questionIndex + 1) / session.content.questions.length) * 100 : 0
  if (access.state !== 'allowed') return <GoAccessState access={access} />
  if (!canPractice(access.capabilities)) return <GoAccessState access={{ state: 'denied' }} />
  if (!destination.allowed) return <GoShell><section className="go-state"><h1>Practice isn’t available here</h1><p>Try again from an enabled Pulse environment.</p><Link to="/go">Back to GO</Link></section></GoShell>
  if (session.loading) return <GoShell><section className="go-state" role="status"><h1>Preparing your practice…</h1></section></GoShell>
  if (session.error || !question) return <GoShell><section className="go-state" role="alert"><h1>We couldn’t start this practice</h1><p>{session.error?.message}</p><Link to="/go/practice">Choose another</Link></section></GoShell>

  async function finish() {
    setSubmitting(true)
    const startedAt = new Date(session.attempt.started_at).getTime()
    const durationSeconds = Number.isFinite(startedAt) ? Math.max(0, Math.round((Date.now() - startedAt) / 1000)) : null
    const response = await completeTrainingAttempt(supabase, session.attempt.attempt_id, buildAnswerSubmission(session.content.questions, answers), durationSeconds, { sourceMode: 'go_practice' })
    setSubmitting(false)
    if (response.error) return setSession(previous => ({ ...previous, error: response.error }))
    setResult(normalizeResult(response.data))
  }

  async function practiceAgain() {
    setAnswers({}); setQuestionIndex(0); setResult(null)
    await openAttempt()
  }

  if (result) {
    const medal = resultMedal(result.score_percent)
    const resultAccent = Number(result.score_percent) >= 65 ? GO_ART.valid : GO_ART.zero2
    return <GoShell><section className="go-result" role="status">
    <div className="go-result-art" aria-hidden="true"><img src={resolveGoArt(medal.image)} alt="" /><img src={resultAccent} alt="" /><img src={GO_ART.points} alt="" /></div>
    <p className="go-eyebrow">Practice complete</p><h2>{medal.label}</h2><h1>{Math.round(Number(result.score_percent))}%</h1>
    <p>{result.correct_answers} of {result.total_questions} correct</p>
    {!!result.topic_breakdown?.length && <div className="go-result-topics">{result.topic_breakdown.map(topic => <div key={topic.topic_id}><strong>{topic.topic_name}</strong><span>{topic.correct_answers}/{topic.total_questions}</span></div>)}</div>}
    <div className="go-result-actions"><Button onClick={() => void practiceAgain()}>Practice Again</Button><Link to="/go/practice">Choose another</Link></div>
  </section></GoShell>
  }

  const ready = isAnswerReady(question, answers[question.id])
  const last = questionIndex === session.content.questions.length - 1
  return <GoShell><section className="go-player">
    <header><div className="go-player-identity"><img src={GO_ART.goal} alt="" /><div><p className="go-eyebrow">{session.content.title}</p><span>Question {questionIndex + 1} of {session.content.questions.length}</span></div></div><Link to="/go/practice">Exit</Link></header>
    <div className="go-progress" role="progressbar" aria-valuemin="1" aria-valuemax={session.content.questions.length} aria-valuenow={questionIndex + 1}><span style={{ width: `${progress}%` }} /></div>
    <article><span className="go-question-number" aria-hidden="true">{String(questionIndex + 1).padStart(2, '0')}</span><h1>{question.prompt}</h1><AnswerControl question={question} answer={answers[question.id]} onChange={answer => setAnswers(value => ({ ...value, [question.id]: answer }))} /></article>
    <footer><span aria-live="polite">{ready ? 'Answer saved.' : 'Choose an answer to continue.'}</span><Button disabled={!ready || submitting} onClick={() => last ? void finish() : setQuestionIndex(value => value + 1)}>{submitting ? 'Scoring…' : last ? 'See result' : 'Next'}</Button></footer>
  </section></GoShell>
}
