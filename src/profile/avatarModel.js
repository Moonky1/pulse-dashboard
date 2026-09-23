export const AVATAR_SOURCE_TYPES = Object.freeze(['image/jpeg', 'image/png', 'image/webp'])
export const AVATAR_INPUT_MAX_BYTES = 8 * 1024 * 1024
export const AVATAR_OUTPUT_MAX_BYTES = 1024 * 1024
export const AVATAR_MAX_DIMENSION = 512

export function avatarInitials(name) {
  const words = String(name ?? '').trim().split(/\s+/).filter(Boolean)
  if (!words.length) return 'P'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return `${words[0][0]}${words.at(-1)[0]}`.toUpperCase()
}

export function avatarCandidates({ customAvatarUrl = null, googleAvatarUrl = null } = {}) {
  return [customAvatarUrl, googleAvatarUrl].filter((value, index, values) => Boolean(value) && values.indexOf(value) === index)
}

export function validateAvatarFile(file) {
  if (!file || !AVATAR_SOURCE_TYPES.includes(file.type)) return { code: 'unsupported_type', message: 'Choose a JPEG, PNG, or WebP image.' }
  if (!Number.isFinite(file.size) || file.size <= 0) return { code: 'empty_file', message: 'Choose a valid image file.' }
  if (file.size > AVATAR_INPUT_MAX_BYTES) return { code: 'input_too_large', message: 'Choose an image smaller than 8 MB.' }
  return null
}
