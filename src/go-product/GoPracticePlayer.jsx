import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { Button } from '../components/ui/Button.jsx'
import { resolveGoPracticeDestination } from '../training/goPracticeDestination.js'
import { getGoCertificationResult, getGoPracticeCompletedReview, getGoPracticeContent, getGoPracticeTiming, getGoQuestionBankGroups, startTrainingAttempt, submitGoPracticeAnswer } from '../training/trainingApi.js'
import { supabase } from '../utils/supabase.js'
import { QuestionAudioPlayer } from '../training/QuestionAudioPlayer.jsx'
import { canPractice } from './goAccess.js'
import { resultMedal } from './goHostedModel.js'
import { GoAccessState, GoShell } from './GoShell.jsx'
import { isAnswerReady, isSafePracticePayload, normalizePracticeContent, normalizeResult } from './goPracticeModel.js'
import { normalizePracticeReview } from './goPracticeReview.js'
import { GoPracticeReview } from './GoPracticeReview.jsx'
import { modeForContent } from './goModeCatalog.js'
import { GoModeAnswers, GoModePrompt } from './GoModeQuestion.jsx'
import { goModeResultLine, goResultHeading } from './goModeCopy.js'
import { GoQuestionCountdown } from './GoQuestionCountdown.jsx'
import { GoSoundToggle } from './GoSoundToggle.jsx'
import { GO_ART, resolveGoArt } from './goVisualAssets.js'
import { playGoSound, primeGoSound } from './goSoundEffects.js'
import { useGoAccess } from './useGoAccess.js'
import { useGoIdentity } from './useGoIdentity.js'
import { useQuestionCountdown } from './useQuestionCountdown.js'

function AnswerControl({ question, answer, onChange, disabled, language }) {
  if (question.question_type === 'multiple_choice') return <fieldset className="go-answer-list" disabled={disabled}><legend>{language === 'es' ? 'Elige una respuesta' : 'Choose one answer'}</legend>{question.answer_options.map((option, index) => <label key={index}><input type="radio" name={question.id} checked={answer === index} onChange={() => onChange(index)} /><span>{option}</span></label>)}</fieldset>
  if (question.question_type === 'true_false') return <fieldset className="go-answer-list go-answer-list--binary" disabled={disabled}><legend>{language === 'es' ? 'Elige una respuesta' : 'Choose one answer'}</legend>{[true, false].map(value => <label key={String(value)}><input type="radio" name={question.id} checked={answer === value} onChange={() => onChange(value)} /><span>{value ? language === 'es' ? 'Verdadero' : 'True' : language === 'es' ? 'Falso' : 'False'}</span></label>)}</fieldset>
  return <label className="go-text-answer"><span>{language === 'es' ? 'Tu respuesta' : 'Your answer'}</span><textarea autoFocus rows="4" value={answer ?? ''} disabled={disabled} maxLength="1000" onChange={event => onChange(event.target.value)} /></label>
}

export function GoPracticePlayer() {
  const { contentId } = useParams()
  const access = useGoAccess()
  const practiceAllowed = canPractice(access.capabilities)
  const identity = useGoIdentity()
  const client = identity.client || supabase
  const destination = resolveGoPracticeDestination(client.supabaseUrl)
  const [session, setSession] = useState({ content: null, attempt: null, mode: 'classic', loading: true, error: null })
  const [answer, setAnswer] = useState(undefined)
  const [timing, setTiming] = useState(null)
  const [result, setResult] = useState(null)
  const [review, setReview] = useState({ questions: null, loading: false, error: null })
  const [reviewRetry, setReviewRetry] = useState(0)
  const [certification, setCertification] = useState({ data: null, loading: false, error: null })
  const [certificationRetry, setCertificationRetry] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)
  const { remainingMs, secondsLeft, expired } = useQuestionCountdown(timing)

  const openAttempt = useCallback(async () => {
    setSession(previous => ({ ...previous, loading: true, error: null }))
    const [contentResponse, attemptResponse, modeResponse] = await Promise.all([
      getGoPracticeContent(client, contentId),
      startTrainingAttempt(client, contentId, 'go_practice'),
      getGoQuestionBankGroups(client, [contentId]),
    ])
    const attempt = normalizeResult(attemptResponse.data)
    const timingResponse = attempt?.attempt_id
      ? await getGoPracticeTiming(client, attempt.attempt_id)
      : { data: null, error: null }
    const content = normalizePracticeContent(contentResponse.data)
    const selectedIds = normalizeResult(timingResponse.data)?.question_ids
    const questionById = new Map(content?.questions.map(question => [question.id, question]))
    const round = Array.isArray(selectedIds) ? selectedIds.map(id => questionById.get(id)) : []
    const selectedContent = content && round.length === 10 && round.every(Boolean)
      ? { ...content, questions: round }
      : null
    const error = contentResponse.error || attemptResponse.error || modeResponse.error || timingResponse.error || (!selectedContent || !isSafePracticePayload(selectedContent) ? { message: 'This practice item is unavailable.' } : null)
    setTiming(error ? null : normalizeResult(timingResponse.data))
    setAnswer(undefined)
    setSession({ content: error ? null : selectedContent, attempt: error ? null : attempt,
      mode: modeForContent(modeResponse.data, contentId), loading: false, error })
  }, [client, contentId])

  useEffect(() => {
    if (access.state !== 'allowed' || !practiceAllowed || !destination.allowed) return
    const timer = setTimeout(() => { void openAttempt() }, 0)
    return () => clearTimeout(timer)
  }, [access.state, destination.allowed, openAttempt, practiceAllowed])

  const questionIndex = (Number(timing?.question_position) || 1) - 1
  const question = session.content?.questions[questionIndex]
  const progress = session.content ? ((questionIndex + 1) / session.content.questions.length) * 100 : 0
  const es = session.content?.language === 'es'
  const submitCurrent = useCallback(async value => {
    if (submittingRef.current || !question || !session.attempt) return
    if (value !== null) primeGoSound()
    submittingRef.current = true
    setSubmitting(true)
    const response = await submitGoPracticeAnswer(client, session.attempt.attempt_id, question.id, value)
    submittingRef.current = false
    setSubmitting(false)
    if (response.error) return setSession(previous => ({ ...previous, error: response.error }))
    const next = normalizeResult(response.data)
    if (next.answer_feedback === 'correct' || next.answer_feedback === 'incorrect') {
      playGoSound(next.answer_feedback)
    }
    if (next.completed) playGoSound('complete', next.answer_feedback ? 0.55 : 0)
    if (next.completed) setResult(normalizeResult(next.result))
    else { setAnswer(undefined); setTiming(next) }
  }, [client, question, session.attempt])

  useEffect(() => {
    if (!expired || !question || result || submittingRef.current) return
    const timer = setTimeout(() => { void submitCurrent(null) }, 0)
    return () => clearTimeout(timer)
  }, [expired, question, result, submitCurrent])

  useEffect(() => {
    if (!result?.attempt_id || session.mode === 'certification') return
    let current = true
    const timer = setTimeout(() => {
      setReview({ questions: null, loading: true, error: null })
      void getGoPracticeCompletedReview(client, result.attempt_id).then(({ data, error }) => {
        if (!current) return
        const questions = error ? null : normalizePracticeReview(data, result.attempt_id)
        setReview({ questions, loading: false, error: error || (!questions ? { message: 'Review unavailable.' } : null) })
      })
    }, 0)
    return () => { current = false; clearTimeout(timer) }
  }, [client, result?.attempt_id, reviewRetry, session.mode])

  useEffect(() => {
    if (!result?.attempt_id || session.mode !== 'certification') return
    let current = true
    const timer = setTimeout(() => {
      setCertification({ data: null, loading: true, error: null })
      void getGoCertificationResult(client, result.attempt_id).then(({ data, error }) => {
        if (current) setCertification({ data: error ? null : data, loading: false, error })
      })
    }, 0)
    return () => { current = false; clearTimeout(timer) }
  }, [client, result?.attempt_id, session.mode, certificationRetry])

  if (access.state !== 'allowed') return <GoAccessState access={access} />
  if (!practiceAllowed) return <GoAccessState access={{ state: 'denied' }} />
  if (!destination.allowed) return <GoShell><section className="go-state"><h1>Practice isn’t available here</h1><p>Try again from an enabled Pulse environment.</p><Link to="/go">Back to GO</Link></section></GoShell>
  if (session.loading) return <GoShell><section className="go-state" role="status"><h1>Preparing your practice…</h1></section></GoShell>
  if (session.error || (!question && !result)) return <GoShell><section className="go-state" role="alert"><h1>We couldn’t start this practice</h1><p>{session.error?.message}</p><Link to="/go/practice">Choose another</Link></section></GoShell>

  async function practiceAgain() {
    setAnswer(undefined); setTiming(null); setResult(null)
    setReview({ questions: null, loading: false, error: null })
    setCertification({ data: null, loading: false, error: null })
    await openAttempt()
  }

  if (result) {
    if (session.mode === 'certification') return <GoShell><section className="go-result go-result--certification" role="status">
      <div className="go-result-art" aria-hidden="true"><img src={GO_ART.certification} alt="" /></div>
      <p className="go-eyebrow">{session.content.language === 'es' ? 'CERTIFICACIÓN COMPLETA' : 'CERTIFICATION COMPLETE'}</p>
      {certification.loading || !certification.data && !certification.error ? <h1>{session.content.language === 'es' ? 'Preparando resultado…' : 'Preparing result…'}</h1>
        : certification.error ? <><h1>{session.content.language === 'es' ? 'Resultado no disponible' : 'Result unavailable'}</h1><Button onClick={() => setCertificationRetry(value => value + 1)}>{session.content.language === 'es' ? 'Reintentar' : 'Try again'}</Button></>
          : <><h1>{certification.data.passed ? (session.content.language === 'es' ? 'Aprobada' : 'Passed') : (session.content.language === 'es' ? 'Sigue practicando' : 'Keep practicing')}</h1><strong className="go-result-score">{Math.round(Number(certification.data.score_percent))}%</strong>
            <p>{session.content.language === 'es' ? 'Resultado de tu evaluación individual' : 'Your individual assessment result'}</p></>}
      <div className="go-result-actions"><Link to="/go/practice">{session.content.language === 'es' ? 'Elegir otro juego' : 'Choose another'}</Link></div>
    </section></GoShell>
    const medal = resultMedal(result.score_percent)
    const resultAccent = Number(result.score_percent) >= 65 ? GO_ART.valid : GO_ART.zero2
    return <GoShell><section className="go-result" role="status">
    <div className="go-result-art" aria-hidden="true"><img src={resolveGoArt(medal.image)} alt="" /><img src={resultAccent} alt="" /><img src={GO_ART.points} alt="" /></div>
    <p className="go-eyebrow">{es ? 'PRÁCTICA COMPLETA' : 'PRACTICE COMPLETE'}</p><h2>{goResultHeading(result.score_percent, session.content.language)}</h2><h1>{Math.round(Number(result.score_percent))}%</h1>
    <p>{goModeResultLine(session.mode, result.correct_answers, result.total_questions, session.content.language)}</p>
    {!!result.topic_breakdown?.length && <div className="go-result-topics">{result.topic_breakdown.map(topic => <div key={topic.topic_id}><strong>{topic.topic_name}</strong><span>{topic.correct_answers}/{topic.total_questions}</span></div>)}</div>}
    <div className="go-result-actions"><Button onClick={() => void practiceAgain()}>{es ? 'Practicar de nuevo' : 'Practice Again'}</Button><Link to="/go/practice">{es ? 'Elegir otro juego' : 'Choose another'}</Link></div>
  </section><GoPracticeReview questions={review.questions} loading={review.loading} error={review.error} onRetry={() => setReviewRetry(value => value + 1)} language={session.content.language} mode={session.mode} /></GoShell>
  }

  const ready = isAnswerReady(question, answer)
  const last = questionIndex === session.content.questions.length - 1
  return <GoShell><section className="go-player">
    <header><div className="go-player-identity"><img src={GO_ART.goal} alt="" /><div><p className="go-eyebrow">{session.content.title}</p><span>{es ? 'Pregunta' : 'Question'} {questionIndex + 1} {es ? 'de' : 'of'} {session.content.questions.length}</span></div></div><div className="go-player-tools"><GoSoundToggle language={session.content.language} /><Link to="/go/practice">{es ? 'Salir' : 'Exit'}</Link></div></header>
    <div className="go-progress" role="progressbar" aria-valuemin="1" aria-valuemax={session.content.questions.length} aria-valuenow={questionIndex + 1}><span style={{ width: `${progress}%` }} /></div>
    <GoQuestionCountdown timing={timing} remainingMs={remainingMs} secondsLeft={secondsLeft} language={session.content.language} />
    <article className={`go-player-question go-player-question--${session.mode}`} key={question.id}><span className="go-question-number" aria-hidden="true">{String(questionIndex + 1).padStart(2, '0')}</span><GoModePrompt mode={session.mode} question={question} language={session.content.language} /><QuestionAudioPlayer contentId={contentId} question={question} language={session.content.language} />
      {session.mode === 'classic' ? <AnswerControl question={question} answer={answer} onChange={setAnswer} disabled={expired || submitting} language={session.content.language} />
        : <GoModeAnswers mode={session.mode} question={question} answer={answer} onChange={setAnswer} disabled={expired || submitting} language={session.content.language} optionSeed={session.attempt.attempt_id} />}</article>
    <footer><span aria-live="polite">{expired ? (es ? 'Se acabó el tiempo. Seguimos…' : 'Time is up. Moving on…') : ready ? (es ? 'Respuesta lista' : 'Answer ready') : (es ? 'Elige una respuesta para continuar' : 'Choose an answer to continue')}</span><Button disabled={!ready || expired || submitting} onClick={() => void submitCurrent(answer)}>{submitting ? (es ? 'Guardando…' : 'Saving…') : last ? (es ? 'Ver resultado' : 'See result') : (es ? 'Siguiente' : 'Next')}</Button></footer>
  </section></GoShell>
}
