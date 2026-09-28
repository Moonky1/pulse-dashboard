import { useEffect, useState } from 'react'

import { assertTrainingAuthoringDestination } from './authoringDestination.js'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const SPECS = Object.freeze({
  game_cover: { types: ['image/jpeg', 'image/png', 'image/webp'], max: 2 * 1024 * 1024 },
  question_image: { types: ['image/jpeg', 'image/png', 'image/webp'], max: 2 * 1024 * 1024 },
  question_audio: { types: ['audio/mpeg', 'audio/mp4'], max: 4 * 1024 * 1024 },
  lobby_audio: { types: ['audio/mpeg', 'audio/mp4'], max: 4 * 1024 * 1024 },
})

export function validateTrainingMedia(file, kind) {
  const spec = SPECS[kind]
  if (!spec || !file || !spec.types.includes(file.type)) return 'Choose a supported image or audio file.'
  if (!Number.isFinite(file.size) || file.size < 64 || file.size > spec.max) {
    return kind.endsWith('audio') ? 'Keep audio under 4 MB.' : 'Keep images under 2 MB.'
  }
  return null
}

export async function uploadTrainingMedia(client, contentId, kind, file, uploadKey = crypto.randomUUID()) {
  if (!UUID.test(contentId) || !UUID.test(uploadKey)) throw new Error('Open a saved draft before uploading media.')
  const invalid = validateTrainingMedia(file, kind)
  if (invalid) throw new Error(invalid)
  assertTrainingAuthoringDestination(client.supabaseUrl)
  const { data, error } = await client.functions.invoke('pulse-training-media', {
    body: file,
    headers: {
      'x-pulse-action': 'upload', 'x-pulse-content-id': contentId,
      'x-pulse-kind': kind, 'x-pulse-upload-key': uploadKey, 'content-type': file.type,
    },
  })
  if (error || !UUID.test(data?.mediaId)) throw new Error('Pulse could not upload that file. Try again.')
  return data.mediaId
}

export async function getTrainingMediaUrl(client, mediaId, contentId, sessionId = null) {
  if (!UUID.test(mediaId) || !UUID.test(contentId) || (sessionId && !UUID.test(sessionId))) return null
  const { data, error } = await client.functions.invoke('pulse-training-media', {
    body: { mediaId, contentId, sessionId }, headers: { 'x-pulse-action': 'read' },
  })
  if (error || typeof data?.url !== 'string') return null
  return data.url
}

export async function removeTrainingMedia(client, mediaId) {
  if (!UUID.test(mediaId)) throw new Error('That file is unavailable.')
  assertTrainingAuthoringDestination(client.supabaseUrl)
  const { data, error } = await client.functions.invoke('pulse-training-media', {
    body: { mediaId }, headers: { 'x-pulse-action': 'delete' },
  })
  if (error || data?.removed !== true) throw new Error('Pulse could not remove that unused file.')
}

export function useTrainingMediaUrl(client, mediaId, contentId, sessionId = null) {
  const [url, setUrl] = useState(null)
  useEffect(() => {
    let current = true
    let timer
    if (!mediaId || !contentId) return undefined
    const refresh = async () => {
      const next = await getTrainingMediaUrl(client, mediaId, contentId, sessionId)
      if (current) {
        setUrl(next)
        timer = setTimeout(refresh, next ? 240000 : 30000)
      }
    }
    void refresh()
    return () => { current = false; clearTimeout(timer); setUrl(null) }
  }, [client, mediaId, contentId, sessionId])
  return url
}
