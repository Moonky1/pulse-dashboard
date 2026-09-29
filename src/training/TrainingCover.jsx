import { useEffect, useRef, useState } from 'react'
import { supabase } from '../utils/supabase.js'
import { useTrainingMediaUrl } from './trainingMedia.js'

// The actual Storage URL is short-lived and private. Catalog cards request it
// only when near the viewport; the established media hook renews it in place.
export function TrainingCover({ contentId, mediaId, fallback, className = '', eager = false, sessionId = null }) {
  const container = useRef(null)
  const [near, setNear] = useState(eager || typeof IntersectionObserver === 'undefined')
  useEffect(() => {
    if (eager || !mediaId) return undefined
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setNear(true); observer.disconnect() }
    }, { rootMargin: '200px' })
    if (container.current) observer.observe(container.current)
    return () => observer.disconnect()
  }, [eager, mediaId])
  const url = useTrainingMediaUrl(supabase, near ? mediaId : null, contentId, sessionId)
  return <span ref={container} className={`training-cover ${className}`}>
    {url || fallback ? <img className={url ? 'training-cover__photo' : 'training-cover__fallback'}
      src={url || fallback} alt="" loading={eager ? 'eager' : 'lazy'} decoding="async" /> : <span className="training-cover__placeholder" aria-hidden="true">✦</span>}
  </span>
}
