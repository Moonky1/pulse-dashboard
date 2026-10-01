export function remainingQuestionMs(timing, receivedAt, currentAt) {
  const deadline = Date.parse(timing?.deadline_at)
  const serverNow = Date.parse(timing?.server_now)
  if (!Number.isFinite(deadline) || !Number.isFinite(serverNow) || !Number.isFinite(receivedAt)) return null
  return Math.max(0, deadline - serverNow - (currentAt - receivedAt))
}

export function questionSecondsLeft(remainingMs) {
  return remainingMs === null ? null : Math.ceil(remainingMs / 1000)
}
