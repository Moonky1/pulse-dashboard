import { useRef, useState } from 'react'

import { useAuth } from '../auth/AuthProvider.jsx'
import { clearSignedAvatarCache, removeOwnAvatar, uploadOwnAvatar } from '../profile/avatarService.js'
import { Button } from './ui/Button.jsx'

const PUBLIC_ERRORS = {
  unsupported_image_type: 'Choose a JPEG, PNG, or WebP image.',
  invalid_image: 'That file is not a valid profile image.',
  image_too_large: 'The prepared image is too large.',
  image_dimensions_too_large: 'The prepared image dimensions are too large.',
  active_staff_required: 'Only active Staff can change a profile photo.',
}

export function AvatarControls({ compact = false, onChanged }) {
  const { profile, refreshProfile } = useAuth()
  const inputRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const apply = async (operation) => {
    setBusy(true)
    setError('')
    try {
      const result = await operation()
      if (result.error) throw result.error
      clearSignedAvatarCache()
      await refreshProfile()
      await onChanged?.()
    } catch (caught) {
      const code = caught?.context?.error || caught?.code
      setError(PUBLIC_ERRORS[code] || caught?.message || 'Pulse could not update your profile photo.')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }
  const onFile = (event) => {
    const file = event.target.files?.[0]
    if (file) void apply(() => uploadOwnAvatar(file))
  }
  const removeLabel = profile?.google_avatar_url ? 'Use Google photo' : 'Remove custom photo'
  return (
    <div className={`staff-avatar-controls${compact ? ' staff-avatar-controls--compact' : ''}`}>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onFile} hidden />
      <Button type="button" variant="secondary" loading={busy} onClick={() => inputRef.current?.click()}>Change photo</Button>
      {profile?.custom_avatar_path && <Button type="button" variant="ghost" disabled={busy} onClick={() => apply(() => removeOwnAvatar())}>{removeLabel}</Button>}
      {error && <p className="staff-avatar-controls__error" role="alert">{error}</p>}
    </div>
  )
}
