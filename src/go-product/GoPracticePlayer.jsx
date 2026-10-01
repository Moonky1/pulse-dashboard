import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { Button } from '../components/ui/Button.jsx'
import { resolveGoPracticeDestination } from '../training/goPracticeDestination.js'
import { getGoPracticeCompletedReview, getGoPracticeContent, getGoPracticeTiming, startTrainingAttempt, submitGoPracticeAnswer } from '../training/trainingApi.js'
import { supabase } from '../utils/supabase.js'
import { canPractice } from './goAccess.js'
import { resultMedal } from './goHostedModel.js'
import { GoAccessState, GoShell } from './GoShell.jsx'
import { isAnswerReady, isSafePracticePayload, normalizePracticeContent, normalizeResult } from './goPracticeModel.js'
import { normalizePracticeReview } from './goPracticeReview.js'
import { GoPracticeReview } from './GoPracticeReview.jsx'
import { GoQuestionCountdown } from './GoQuestionCountdown.jsx'
import { GO_ART, resolveGoArt } from './goVisualAssets.js'
import { useGoAccess } from './useGoAccess.js'
import { useQuestionCountdown } from './useQuestionCountdown.js'

function AnswerControl({ question, answer, onChange, disabled }) {
  if (question.question_type === 'multiple_choice') return <fieldset className="go-answer-list" disabled={disabled}><legend>Choose one answer</legend>{question.answer_options.map((option, index) => <label key={index}><input type="radio" name={question.id} checked={answer === index} onChange={() => onChange(index)} /><span>{option}</span></label>)}</fieldset>
  if (question.question_type === 'true_false') return <fieldset className="go-answer-list go-answer-list--binary" disabled={disabled}><legend>Choose one answer</legend>{[true, false].map(value => <label key={String(value)}><input type="radio" name={question.id} checked={answer === value} onChange={() => onChange(value)} /><span>{value ? 'True' : 'False'}</span></label>)}</fieldset>
  return <label className="go-text-answer"><span>Your answer</span><textarea autoFocus rows="4" value={answer ?? ''} disabled={disabled} maxLength="1000" onChange={event => onChange(event.target.value)} /></label>
}

export function GoPracticePlayer() {
  const { contentId } = useParams()
  const access = useGoAccess()
  const destination = resolveGoPracticeDestination(supabase.supabaseUrl)
  const [session, setSession] = useState({ content: null, attempt: null, loading: true, error: null })
  const [answer, setAnswer] = useState(undefined)
  const [timing, setTiming] = useState(null)
  const [result, setResult] = useState(null)
  const [review, setReview] = useState({ questions: null, loading: false, error: null })
  const [reviewRetry, setReviewRetry] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)
  const { remainingMs, secondsLeft, expired } = useQuestionCountdown(timing)

  const openAttempt = useCallback(async () => {
    setSession(previous => ({ ...previous, loading: true, error: null }))
    const [contentResponse, attemptResponse] = await Promise.all([
      getGoPracticeContent(supabase, contentId),
      startTrainingAttempt(supabase, contentId, 'go_practice'),
    ])
    const attempt = normalizeResult(attemptResponse.data)
    const timingResponse = attempt?.attempt_id
      ? await getGoPracticeTiming(supabase, attempt.attempt_id)
      : { data: null, error: null }
    const content = normalizePracticeContent(contentResponse.data)
    const selectedIds = normalizeResult(timingResponse.data)?.question_ids
    const questionById = new Map(content?.questions.map(question => [question.id, question]))
    const round = Array.isArray(selectedIds) ? selectedIds.map(id => questionById.get(id)) : []
    const selectedContent = content && round.length === 10 && round.every(Boolean)
      ? { ...content, questions: round }
      : null
    const error = contentResponse.error || attemptResponse.error || timingResponse.error || (!selectedContent || !isSafePracticePayload(selectedContent) ? { message: 'This practice item is unavailable.' } : null)
    setTiming(error ? null : normalizeResult(timingResponse.data))
    setAnswer(undefined)
    setSession({ content: error ? null : selectedContent, attempt: error ? null : attempt, loading: false, error })
  }, [contentId])

  useEffect(() => {
    if (access.state !== 'allowed' || !canPractice(access.capabilities) || !destination.allowed) return
    const timer = setTimeout(() => { void openAttempt() }, 0)
    return () => clearTimeout(timer)
  }, [access.capabilities, access.state, destination.allowed, openAttempt])

  const questionIndex = (Number(timing?.question_position) || 1) - 1
  const question = session.content?.questions[questionIndex]
  const progress = session.content ? ((questionIndex + 1) / session.content.questions.length) * 100 : 0
  const submitCurrent = useCallback(async value => {
    if (submittingRef.current || !question || !session.attempt) return
    submittingRef.current = true
    setSubmitting(true)
    const response = await submitGoPracticeAnswer(supabase, session.attempt.attempt_id, question.id, value)
    submittingRef.current = false
    setSubmitting(false)
    if (response.error) return setSession(previous => ({ ...previous, error: response.error }))
    const next = normalizeResult(response.data)
    if (next.completed) setResult(normalizeResult(next.result))
    else { setAnswer(undefined); setTiming(next) }
  }, [question, session.attempt])

  useEffect(() => {
    if (!expired || !question || result || submittingRef.current) return
    const timer = setTimeout(() => { void submitCurrent(null) }, 0)
    return () => clearTimeout(timer)
  }, [expired, question, result, submitCurrent])

  useEffect(() => {
    if (!result?.attempt_id) return
    let current = true
    const timer = setTimeout(() => {
      setReview({ questions: null, loading: true, error: null })
      void getGoPracticeCompletedReview(supabase, result.attempt_id).then(({ data, error }) => {
        if (!current) return
        const questions = error ? null : normalizePracticeReview(data, result.attempt_id)
        setReview({ questions, loading: false, error: error || (!questions ? { message: 'Review unavailable.' } : null) })
      })
    }, 0)
    return () => { current = false; clearTimeout(timer) }
  }, [result?.attempt_id, reviewRetry])

  if (access.state !== 'allowed') return <GoAccessState access={access} />
  if (!canPractice(access.capabilities)) return <GoAccessState access={{ state: 'denied' }} />
  if (!destination.allowed) return <GoShell><section className="go-state"><h1>Practice isn’t available here</h1><p>Try again from an enabled Pulse environment.</p><Link to="/go">Back to GO</Link></section></GoShell>
  if (session.loading) return <GoShell><section className="go-state" role="status"><h1>Preparing your practice…</h1></section></GoShell>
  if (session.error || (!question && !result)) return <GoShell><section className="go-state" role="alert"><h1>We couldn’t start this practice</h1><p>{session.error?.message}</p><Link to="/go/practice">Choose another</Link></section></GoShell>

  async function practiceAgain() {
    setAnswer(undefined); setTiming(null); setResult(null)
    setReview({ questions: null, loading: false, error: null })
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
  </section><GoPracticeReview questions={review.questions} loading={review.loading} error={review.error} onRetry={() => setReviewRetry(value => value + 1)} language={session.content.language} /></GoShell>
  }

  const ready = isAnswerReady(question, answer)
  const last = questionIndex === session.content.questions.length - 1
  return <GoShell><section className="go-player">
    <header><div className="go-player-identity"><img src={GO_ART.goal} alt="" /><div><p className="go-eyebrow">{session.content.title}</p><span>Question {questionIndex + 1} of {session.content.questions.length}</span></div></div><Link to="/go/practice">Exit</Link></header>
    <div className="go-progress" role="progressbar" aria-valuemin="1" aria-valuemax={session.content.questions.length} aria-valuenow={questionIndex + 1}><span style={{ width: `${progress}%` }} /></div>
    <GoQuestionCountdown timing={timing} remainingMs={remainingMs} secondsLeft={secondsLeft} />
    <article><span className="go-question-number" aria-hidden="true">{String(questionIndex + 1).padStart(2, '0')}</span><h1>{question.prompt}</h1><AnswerControl question={question} answer={answer} onChange={setAnswer} disabled={expired || submitting} /></article>
    <footer><span aria-live="polite">{expired ? 'Time is up. Moving on…' : ready ? 'Answer ready.' : 'Choose an answer to continue.'}</span><Button disabled={!ready || expired || submitting} onClick={() => void submitCurrent(answer)}>{submitting ? 'Saving…' : last ? 'See result' : 'Next'}</Button></footer>
  </section></GoShell>
}
