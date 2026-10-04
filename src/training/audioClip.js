export const MAX_SOURCE_BYTES = 25 * 1024 * 1024
export const MAX_SOURCE_SECONDS = 600
export const CLIP_SAMPLE_RATE = 22050

export function validateAudioSelection(startSeconds, endSeconds, durationSeconds, limitSeconds) {
  if (![startSeconds, endSeconds, durationSeconds, limitSeconds].every(Number.isFinite) ||
    startSeconds < 0 || endSeconds <= startSeconds || endSeconds > durationSeconds + 0.02 ||
    endSeconds - startSeconds > limitSeconds + 0.001 || endSeconds - startSeconds < 0.1) {
    return 'Choose a segment between 0.1 seconds and the question time limit.'
  }
  return null
}

export function encodePcmWav(samples, sampleRate = CLIP_SAMPLE_RATE) {
  const bytes = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(bytes)
  const label = (offset, text) => { for (let index = 0; index < text.length; index += 1) view.setUint8(offset + index, text.charCodeAt(index)) }
  label(0, 'RIFF'); view.setUint32(4, bytes.byteLength - 8, true); label(8, 'WAVE')
  label(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true)
  view.setUint16(22, 1, true); view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true)
  view.setUint16(34, 16, true); label(36, 'data'); view.setUint32(40, samples.length * 2, true)
  for (let index = 0; index < samples.length; index += 1) {
    const value = Math.max(-1, Math.min(1, samples[index]))
    view.setInt16(44 + index * 2, Math.round(value < 0 ? value * 32768 : value * 32767), true)
  }
  return bytes
}

export async function trimAudioToWav(file, startSeconds, endSeconds, limitSeconds) {
  if (!file || file.size > MAX_SOURCE_BYTES) throw new Error('Choose an audio file under 25 MB.')
  const AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext
  if (!AudioContextClass || !globalThis.OfflineAudioContext) throw new Error('This browser cannot prepare audio clips.')
  const context = new AudioContextClass()
  try {
    const decoded = await context.decodeAudioData(await file.arrayBuffer())
    if (decoded.duration > MAX_SOURCE_SECONDS) throw new Error('Choose a recording under 10 minutes.')
    const invalid = validateAudioSelection(startSeconds, endSeconds, decoded.duration, limitSeconds)
    if (invalid) throw new Error(invalid)
    const frameCount = Math.ceil((endSeconds - startSeconds) * CLIP_SAMPLE_RATE)
    const offline = new OfflineAudioContext(1, frameCount, CLIP_SAMPLE_RATE)
    const source = offline.createBufferSource()
    source.buffer = decoded
    source.connect(offline.destination)
    source.start(0, startSeconds, endSeconds - startSeconds)
    const rendered = await offline.startRendering()
    const wav = encodePcmWav(rendered.getChannelData(0))
    if (wav.byteLength > 4_194_304) throw new Error('The selected segment is too large. Shorten it and try again.')
    return new File([wav], 'question-clip.wav', { type: 'audio/wav' })
  } finally {
    await context.close()
  }
}
