import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { Badge } from '../components/ui/Badge.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Card } from '../components/ui/Card.jsx'
import { PulseOrb } from '../components/ui/PulseOrb.jsx'
import { useAuth } from '../auth/AuthProvider.jsx'
import { supabase } from '../utils/supabase.js'
import { getStudioFilterOptions, listStudioCatalog } from './studioApi.js'
import { canCreateStudioContent } from './studioAccess.js'
import { useStudioAccess } from './hooks/useStudioAccess.js'
import './studio.css'

const PAGE_SIZE = 24

function formatAudience(audience = {}) {
  if (audience.scope_type === 'campaign') return audience.campaign_name || audience.campaign_code || 'Campaign'
  if (audience.scope_type === 'team') return audience.team_name || audience.team_code || 'Team'
  return 'All staff'
}

function StudioCard({ item }) {
  const topics = Array.isArray(item.topics) ? item.topics : []
  return (
    <article className="studio-card">
      <div className="studio-card__meta"><Badge tone="info">{item.content_type || 'Content'}</Badge><span>{item.language === 'es' ? 'Español' : 'English'}</span></div>
      <h2>{item.title || 'Untitled content'}</h2>
      <p>{item.description || 'No description has been added.'}</p>
      <div className="studio-card__topics">{topics.length ? topics.map((topic) => <span key={topic.id || topic.code}>{topic.name || topic.code}</span>) : <span>No topics</span>}</div>
      <footer><span>{formatAudience(item.audience)}</span><Badge tone={item.status === 'published' ? 'success' : 'pending'}>{item.status || 'draft'}</Badge></footer>
    </article>
  )
}

function StudioDenied() {
  return <main className="studio-state"><Card level={2}><p className="studio-eyebrow">Pulse Studio</p><h1>Studio access is unavailable</h1><p>Your current Pulse access does not include Studio. Return to Workspace to continue.</p><Link className="studio-link" to="/workspace">Open Workspace</Link></Card></main>
}

export function StudioPage() {
  const { profile, signOut } = useAuth()
  const access = useStudioAccess()
  const [filters, setFilters] = useState({ language: '', topicId: '', lifecycle: '', search: '' })
  const [catalog, setCatalog] = useState({ items: [], loading: true, error: null })
  const [options, setOptions] = useState({ data: null, loading: true, error: null })
  const [offset, setOffset] = useState(0)
  const [notice, setNotice] = useState(null)

  const load = useCallback(async ({ resetPage = false, requestedOffset = null } = {}) => {
    const nextOffset = requestedOffset ?? (resetPage ? 0 : offset)
    setCatalog((current) => ({ ...current, loading: true, error: null }))
    const result = await listStudioCatalog(supabase, { language: filters.language || null, topicId: filters.topicId || null, search: filters.search, limit: PAGE_SIZE, offset: nextOffset })
    setCatalog({ items: result.data, loading: false, error: result.error })
    if (resetPage) setOffset(0)
  }, [filters.language, filters.search, filters.topicId, offset])

  const loadOptions = useCallback(async () => {
    setOptions((current) => ({ ...current, loading: true, error: null }))
    const result = await getStudioFilterOptions(supabase)
    setOptions({ data: result.data, loading: false, error: result.error })
  }, [])

  useEffect(() => {
    if (access.state === 'allowed') {
      const timer = window.setTimeout(() => {
        void load({ resetPage: true })
        void loadOptions()
      }, 0)
      return () => window.clearTimeout(timer)
    }
    return undefined
  }, [access.state, load, loadOptions])

  const visibleItems = useMemo(() => filters.lifecycle
    ? catalog.items.filter((item) => item.status === filters.lifecycle)
    : catalog.items, [catalog.items, filters.lifecycle])
  const createAllowed = canCreateStudioContent(access.permissionKeys)
  const hasNextPage = catalog.items.length === PAGE_SIZE
  const updateFilter = (name, value) => setFilters((current) => ({ ...current, [name]: value }))
  const refresh = async () => { await Promise.all([load({ resetPage: true }), loadOptions()]) }

  if (access.state === 'loading') return <main className="studio-state"><Card level={2}><p>Checking Studio access…</p></Card></main>
  if (access.state === 'error') return <main className="studio-state"><Card level={2}><h1>Studio is temporarily unavailable</h1><p>{access.error?.message || 'Pulse could not verify Studio access.'}</p></Card></main>
  if (access.state === 'denied') return <StudioDenied />

  return (
    <div className="studio-shell">
      <header className="studio-topbar">
        <Link className="studio-brand" to="/workspace"><PulseOrb size="sm" active /><span>Pulse</span></Link>
        <nav aria-label="Studio navigation"><Link to="/workspace">Workspace</Link><span aria-current="page">Studio</span></nav>
        <Button type="button" variant="ghost" onClick={signOut}>Sign out</Button>
      </header>
      <main className="studio-main">
        <section className="studio-heading">
          <div><p className="studio-eyebrow">Training workspace</p><h1>Studio</h1><p>Browse the protected training catalog and prepare for the next content-authoring checkpoint.</p></div>
          <div className="studio-heading__actions"><Button type="button" variant="secondary" loading={catalog.loading || options.loading} onClick={refresh}>Refresh</Button><Button type="button" disabled={!createAllowed} onClick={() => setNotice('Content creation is coming next. Studio is read-only in this checkpoint.')}>Create content</Button></div>
        </section>
        {createAllowed && notice && <div className="studio-notice" role="status">{notice}</div>}
        <section className="studio-overview" aria-label="Studio overview"><Card level={2}><strong>{catalog.items.length}</strong><span>content items on this page</span></Card><Card level={2}><strong>{options.data?.topics.length ?? 0}</strong><span>available topics</span></Card><Card level={2}><strong>{options.data?.campaigns.length ?? 0}</strong><span>authorized campaigns</span></Card></section>
        <section className="studio-filters" aria-label="Studio catalog filters">
          <label className="studio-search"><span>Search catalog</span><input value={filters.search} onChange={(event) => updateFilter('search', event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void load({ resetPage: true }) }} placeholder="Title or description" /></label>
          <label><span>Language</span><select value={filters.language} onChange={(event) => updateFilter('language', event.target.value)}><option value="">All languages</option>{(options.data?.languages ?? []).map((language) => <option key={language.id} value={language.id}>{language.label}</option>)}</select></label>
          <label><span>Topic</span><select value={filters.topicId} onChange={(event) => updateFilter('topicId', event.target.value)}><option value="">All topics</option>{(options.data?.topics ?? []).map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}</select></label>
          <label><span>Lifecycle</span><select value={filters.lifecycle} onChange={(event) => updateFilter('lifecycle', event.target.value)}><option value="">All lifecycle states</option><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label>
          <Button type="button" variant="secondary" onClick={() => void load({ resetPage: true })}>Apply</Button>
        </section>
        <div className="studio-catalog-meta" aria-live="polite"><strong>{visibleItems.length}</strong> protected catalog items <span>Read-only</span></div>
        {catalog.error ? <Card level={2} className="studio-empty"><h2>Catalog unavailable</h2><p>{catalog.error.message}</p><Button type="button" variant="secondary" onClick={() => void refresh()}>Try again</Button></Card>
          : !catalog.loading && !visibleItems.length ? <Card level={2} className="studio-empty"><h2>No training content yet</h2><p>There is no Studio content matching these filters. Creating content will arrive in a later checkpoint.</p></Card>
            : <div className="studio-grid">{visibleItems.map((item) => <StudioCard key={item.id} item={item} />)}</div>}
        <div className="studio-pagination"><Button type="button" variant="secondary" disabled={offset === 0 || catalog.loading} onClick={() => { const nextOffset = Math.max(0, offset - PAGE_SIZE); setOffset(nextOffset); void load({ requestedOffset: nextOffset }) }}>Previous</Button><span>Page {Math.floor(offset / PAGE_SIZE) + 1}</span><Button type="button" variant="secondary" disabled={!hasNextPage || catalog.loading} onClick={() => { const nextOffset = offset + PAGE_SIZE; setOffset(nextOffset); void load({ requestedOffset: nextOffset }) }}>Next</Button></div>
      </main>
      <footer className="studio-footer">Signed in as {profile?.display_name || profile?.full_name || 'Pulse user'}</footer>
    </div>
  )
}
