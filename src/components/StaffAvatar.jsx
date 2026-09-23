import { useEffect, useMemo, useState } from 'react'

import { avatarCandidates, avatarInitials } from '../profile/avatarModel.js'
import { getSignedAvatarUrl } from '../profile/avatarService.js'

export function StaffAvatar({ name, customAvatarPath = null, googleAvatarUrl = null, avatarUpdatedAt = null, size = 'md', className = '' }) {
  const resourceKey = `${customAvatarPath ?? ''}:${avatarUpdatedAt ?? ''}`
  const [customAvatar, setCustomAvatar] = useState({ key: '', url: null })
  const [failure, setFailure] = useState({ key: '', index: 0 })
  useEffect(() => {
    let current = true
    if (customAvatarPath) void getSignedAvatarUrl(customAvatarPath, avatarUpdatedAt).then((url) => { if (current) setCustomAvatar({ key: resourceKey, url }) })
    return () => { current = false }
  }, [avatarUpdatedAt, customAvatarPath, resourceKey])
  const customAvatarUrl = customAvatar.key === resourceKey ? customAvatar.url : null
  const candidates = useMemo(() => avatarCandidates({ customAvatarUrl, googleAvatarUrl }), [customAvatarUrl, googleAvatarUrl])
  const candidateKey = `${resourceKey}:${googleAvatarUrl ?? ''}:${customAvatarUrl ?? ''}`
  const failedIndex = failure.key === candidateKey ? failure.index : 0
  const src = candidates[failedIndex] ?? null
  const classes = `admin-staff-avatar admin-staff-avatar--${size}${src ? ' admin-staff-avatar--photo' : ''}${className ? ` ${className}` : ''}`
  return (
    <span className={classes} aria-label={`${name || 'Pulse user'} profile photo`}>
      {src ? <img src={src} alt="" referrerPolicy="no-referrer" onError={() => setFailure({ key: candidateKey, index: failedIndex + 1 })} /> : avatarInitials(name)}
    </span>
  )
}
