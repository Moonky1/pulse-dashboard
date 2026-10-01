import { useEffect, useState } from 'react'

import { questionSecondsLeft, remainingQuestionMs } from './goQuestionClock.js'

export function useQuestionCountdown(timing) {
  const deadlineAt = timing?.deadline_at
  const serverNow = timing?.server_now
  const [clock, setClock] = useState({ deadlineAt: null, remainingMs: null })
  useEffect(() => {
    if (!deadlineAt || !serverNow) return
    const receivedAt = Date.now()
    const currentTiming = { deadline_at: deadlineAt, server_now: serverNow }
    const update = () => setClock({ deadlineAt, remainingMs: remainingQuestionMs(currentTiming, receivedAt, Date.now()) })
    update()
    const interval = setInterval(update, 100)
    return () => clearInterval(interval)
  }, [deadlineAt, serverNow])
  const remainingMs = clock.deadlineAt === deadlineAt ? clock.remainingMs : null
  return {
    remainingMs,
    secondsLeft: questionSecondsLeft(remainingMs),
    expired: remainingMs !== null && remainingMs <= 0,
  }
}
