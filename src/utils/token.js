const SECRET = 'PULSE_KK_2026_SECRET'

export function generateToken() {
  const block = Math.floor(Date.now() / (5 * 60 * 1000))
  let hash = 0
  const str = SECRET + block
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return String(Math.abs(hash) % 1000000).padStart(6, '0')
}

export function secondsUntilNext() {
  const ms = 5 * 60 * 1000
  return Math.ceil((ms - (Date.now() % ms)) / 1000)
}

export function validateToken(input) {
  return input.trim() === generateToken()
}