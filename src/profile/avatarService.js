import { supabase } from '../utils/supabase.js'
import { AVATAR_MAX_DIMENSION, AVATAR_OUTPUT_MAX_BYTES, validateAvatarFile } from './avatarModel.js'
const signedAvatarCache = new Map()

function canvasBlob(canvas, type, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality))
}

export async function prepareAvatarFile(file) {
  const validation = validateAvatarFile(file)
  if (validation) throw Object.assign(new Error(validation.message), { code: validation.code })
  const bitmap = await createImageBitmap(file)
  try {
    const side = Math.min(bitmap.width, bitmap.height)
    if (side < 32) throw Object.assign(new Error('Choose an image at least 32 × 32 pixels.'), { code: 'image_too_small' })
    const outputSide = Math.min(side, AVATAR_MAX_DIMENSION)
    const canvas = document.createElement('canvas')
    canvas.width = outputSide
    canvas.height = outputSide
    const context = canvas.getContext('2d', { alpha: false })
    if (!context) throw Object.assign(new Error('Pulse could not prepare this image.'), { code: 'image_processing_failed' })
    context.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, outputSide, outputSide)
    let blob = await canvasBlob(canvas, 'image/webp', 0.86)
    if (blob?.size > AVATAR_OUTPUT_MAX_BYTES) blob = await canvasBlob(canvas, 'image/webp', 0.72)
    if (!blob || blob.type !== 'image/webp' || blob.size > AVATAR_OUTPUT_MAX_BYTES) {
      throw Object.assign(new Error('Pulse could not optimize this image below 1 MB.'), { code: 'output_too_large' })
    }
    return { blob, sourceMime: file.type, width: outputSide, height: outputSide }
  } finally {
    bitmap.close()
  }
}

export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Pulse could not read this image.'))
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
    reader.readAsDataURL(blob)
  })
}

export async function uploadOwnAvatar(file, client = supabase) {
  const prepared = await prepareAvatarFile(file)
  const imageBase64 = await blobToBase64(prepared.blob)
  return client.functions.invoke('pulse-staff-avatar', { body: { action: 'upload', sourceMime: prepared.sourceMime, imageBase64 } })
}

export function removeOwnAvatar(client = supabase) {
  return client.functions.invoke('pulse-staff-avatar', { body: { action: 'remove' } })
}

export async function getSignedAvatarUrl(path, version = '', client = supabase) {
  if (!path) return null
  const key = `${path}:${version ?? ''}`
  if (!signedAvatarCache.has(key)) {
    signedAvatarCache.set(key, client.storage.from('staff-avatars').createSignedUrl(path, 300).then(({ data, error }) => {
      if (error) throw error
      return data?.signedUrl ?? null
    }).catch(() => null))
  }
  return signedAvatarCache.get(key)
}

export function clearSignedAvatarCache() {
  signedAvatarCache.clear()
}
