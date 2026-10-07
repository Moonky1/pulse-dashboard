import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { searchMetadata } from '../searchMetadata.js'

export function SearchMetadata() {
  const { pathname } = useLocation()
  useEffect(() => {
    const metadata = searchMetadata(window.location.hostname, pathname)
    let robots = document.head.querySelector('meta[name="robots"]')
    if (!robots) { robots = document.createElement('meta'); robots.name = 'robots'; document.head.append(robots) }
    robots.content = metadata.robots
    let canonical = document.head.querySelector('link[rel="canonical"]')
    if (!metadata.canonical) { canonical?.remove(); return }
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.append(canonical) }
    canonical.href = metadata.canonical
  }, [pathname])
  return null
}
