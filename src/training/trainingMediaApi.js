import { assertTrainingAuthoringDestination } from './authoringDestination.js'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function uploadTrainingQuestionAudio(client, contentId, file) {
  assertTrainingAuthoringDestination(client.supabaseUrl)
  if (!UUID.test(contentId) || !(file instanceof File) || file.type !== 'audio/wav' || file.size > 4_194_304) {
    throw new Error('Choose a valid audio segment first.')
  }
  const body = new FormData()
  body.set('action', 'upload')
  body.set('contentId', contentId)
  body.set('file', file)
  const { data, error } = await client.functions.invoke('pulse-training-media', { body })
  if (error || !UUID.test(data?.mediaId || '')) throw new Error('Could not upload this audio. Please try again.')
  return data.mediaId
}

export async function getTrainingQuestionAudioUrl(client, contentId, mediaId, sessionId = null) {
  if (!UUID.test(contentId) || !UUID.test(mediaId) || (sessionId && !UUID.test(sessionId))) {
    throw new Error('Audio unavailable.')
  }
  const { data, error } = await client.functions.invoke('pulse-training-media', {
    body: { action: 'read', contentId, mediaId, sessionId },
  })
  if (error || typeof data?.url !== 'string') throw new Error('Audio unavailable.')
  try {
    const signed = new URL(data.url)
    if (signed.origin !== new URL(client.supabaseUrl).origin ||
      !signed.pathname.includes('/storage/v1/object/sign/training-media/')) throw new Error('Audio unavailable.')
  } catch { throw new Error('Audio unavailable.') }
  return data.url
}

export async function deleteTrainingQuestionAudio(client, mediaId) {
  assertTrainingAuthoringDestination(client.supabaseUrl)
  if (!UUID.test(mediaId)) throw new Error('Audio unavailable.')
  const { data, error } = await client.functions.invoke('pulse-training-media', {
    body: { action: 'delete', mediaId },
  })
  if (error || data?.deleted !== true) throw new Error('Audio could not be removed yet.')
}
