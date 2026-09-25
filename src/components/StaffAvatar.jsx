import { useEffect, useMemo, useRef, useState } from 'react'

import { avatarCandidates, avatarInitials } from '../profile/avatarModel.js'
import { getSignedAvatarUrl } from '../profile/avatarService.js'

export function StaffAvatar({ name, customAvatarPath = null, googleAvatarUrl = null, avatarUpdatedAt = null, size = 'md', className = '', eager = false }) {
  const elementRef = useRef(null)
  const [visible, setVisible] = useState(() => eager || typeof IntersectionObserver === 'undefined')
  const resourceKey = `${customAvatarPath ?? ''}:${avatarUpdatedAt ?? ''}`
  const [customAvatar, setCustomAvatar] = useState({ key: '', url: null })
  const [failure, setFailure] = useState({ key: '', index: 0 })
  useEffect(() => {
    if (visible || !customAvatarPath) return undefined
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true)
        observer.disconnect()
      }
    }, { rootMargin: '120px' })
    if (elementRef.current) observer.observe(elementRef.current)
    return () => observer.disconnect()
  }, [customAvatarPath, visible])
  useEffect(() => {
    let current = true
    if (customAvatarPath && visible) void getSignedAvatarUrl(customAvatarPath, avatarUpdatedAt).then((url) => { if (current) setCustomAvatar({ key: resourceKey, url }) })
    return () => { current = false }
  }, [avatarUpdatedAt, customAvatarPath, resourceKey, visible])
  const customAvatarUrl = customAvatar.key === resourceKey ? customAvatar.url : null
  const candidates = useMemo(() => avatarCandidates({ customAvatarUrl, googleAvatarUrl }), [customAvatarUrl, googleAvatarUrl])
  const candidateKey = `${resourceKey}:${googleAvatarUrl ?? ''}:${customAvatarUrl ?? ''}`
  const failedIndex = failure.key === candidateKey ? failure.index : 0
  const src = candidates[failedIndex] ?? null
  const classes = `admin-staff-avatar admin-staff-avatar--${size}${src ? ' admin-staff-avatar--photo' : ''}${className ? ` ${className}` : ''}`
  return (
    <span className={classes} ref={elementRef} aria-label={`${name || 'Pulse user'} profile photo`}>
      {src ? <img src={src} alt="" loading={eager ? 'eager' : 'lazy'} decoding="async" width={size === 'lg' ? 100 : size === 'sm' ? 36 : 44} height={size === 'lg' ? 100 : size === 'sm' ? 36 : 44} referrerPolicy="no-referrer" onError={() => setFailure({ key: candidateKey, index: failedIndex + 1 })} /> : avatarInitials(name)}
    </span>
  )
}
