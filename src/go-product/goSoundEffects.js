// Short, original synthesized cues: no external audio files or answer keys.
export const GO_SOUND_NOTES = Object.freeze({
  correct: [[587.33, 0, 0.11], [783.99, 0.12, 0.19]],
  incorrect: [[329.63, 0, 0.12], [246.94, 0.13, 0.2]],
  complete: [[523.25, 0, 0.1], [659.25, 0.11, 0.1], [783.99, 0.22, 0.28]],
})

let enabled = true
let context = null

export function goSoundEnabled() { return enabled }
export function setGoSoundEnabled(value) { enabled = Boolean(value) }

export function primeGoSound() {
  if (!enabled) return null
  const AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext
  if (!AudioContextClass) return null
  try {
    context ||= new AudioContextClass()
    if (context.state === 'suspended') void context.resume().catch(() => {})
    return context
  } catch {
    return null
  }
}

export function playGoSound(kind, delaySeconds = 0) {
  const notes = GO_SOUND_NOTES[kind]
  const audio = notes && primeGoSound()
  if (!audio) return false
  try {
    for (const [frequency, offset, duration] of notes) {
      const oscillator = audio.createOscillator()
      const gain = audio.createGain()
      const start = audio.currentTime + Math.max(0, delaySeconds) + offset
      oscillator.type = kind === 'incorrect' ? 'triangle' : 'sine'
      oscillator.frequency.setValueAtTime(frequency, start)
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(0.075, start + 0.016)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
      oscillator.connect(gain)
      gain.connect(audio.destination)
      oscillator.start(start)
      oscillator.stop(start + duration + 0.01)
    }
    return true
  } catch {
    return false
  }
}
