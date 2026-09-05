import { useEffect } from 'react'

export function useUnsavedChanges(dirty, savedDestination) {
  useEffect(() => {
    if (!dirty) return
    const confirm = () => window.confirm('You have unsaved changes. Leave without saving them?')
    const unload = e => { e.preventDefault(); e.returnValue = '' }
    const navigate = e => {
      if (savedDestination?.current === new URL(e.destination.url).pathname) { savedDestination.current = null; return }
      if (e.canIntercept && new URL(e.destination.url).pathname !== location.pathname && !confirm()) e.preventDefault()
    }
    const click = e => {
      const link = e.target.closest('a[href]')
      if (link && !link.target && new URL(link.href).pathname !== location.pathname && !confirm()) { e.preventDefault(); e.stopPropagation() }
    }
    window.addEventListener('beforeunload', unload)
    if (window.navigation) window.navigation.addEventListener('navigate', navigate)
    else document.addEventListener('click', click, true)
    return () => {
      window.removeEventListener('beforeunload', unload)
      window.navigation?.removeEventListener('navigate', navigate)
      document.removeEventListener('click', click, true)
    }
  }, [dirty, savedDestination])
  return () => !dirty || window.confirm('You have unsaved changes. Leave without saving them?')
}
