import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button.jsx'
import { supabase } from '../utils/supabase.js'
import { getStudioFilterOptions, listStudioCatalog } from './studioApi.js'
import { useStudioAccess } from './hooks/useStudioAccess.js'
import { StudioShell, StudioAccessState } from './StudioShell.jsx'
import { audienceLabel, languageLabel, typeLabel } from './builderModel.js'
import './studio.css'

const PAGE_SIZE = 24
export function StudioPage() {
  const access = useStudioAccess()
  const [filters, setFilters] = useState({ search: '', language: '', topicId: '' })
  const [query, setQuery] = useState({ search: '', language: null, topicId: null, status: null, offset: 0 })
  const [revision, setRevision] = useState(0)
  const [catalog, setCatalog] = useState({ items: [], loading: true, error: null })
  const [options, setOptions] = useState(null)
  useEffect(() => {
    if (access.state !== 'allowed') return
    let current = true
    getStudioFilterOptions(supabase).then(result => { if (current) setOptions(result.data) })
    return () => { current = false }
  }, [access.state])
  useEffect(() => {
    if (access.state !== 'allowed') return
    let current = true
    const timer = setTimeout(() => {
      setCatalog(previous => ({ ...previous, loading: true }))
      listStudioCatalog(supabase, { ...query, limit: PAGE_SIZE }).then(result => {
        if (current) setCatalog({ items: result.data || [], loading: false, error: result.error })
      })
    }, 0)
    return () => { current = false; clearTimeout(timer) }
  }, [access.state, query, revision])
  if (access.state !== 'allowed') return <StudioAccessState access={access} />
  function search(event) {
    event.preventDefault()
    setQuery(q => ({ ...q, search: filters.search, language: filters.language || null, topicId: filters.topicId || null, offset: 0 }))
  }
  return <StudioShell>
    <section className="studio-heading">
      <div><p className="studio-eyebrow">Make room for a good idea</p><h1>Pulse Studio</h1><p>Create training your teams will actually use.</p></div>
      {access.capabilities?.can_create && <Link className="studio-primary" to="/studio/create">+ Create</Link>}
    </section>
    <section className="studio-library">
      <div className="studio-library-bar">
        <nav className="studio-tabs" aria-label="Library status">
          {[[null,'All'],['draft','Drafts'],['published','Published'],['archived','Archived']].map(([value,label]) =>
            <button key={label} type="button" aria-current={query.status === value ? 'page' : undefined} onClick={() => setQuery(q => ({ ...q, status: value, offset: 0 }))}>{label}</button>)}
        </nav>
        <Button variant="ghost" onClick={() => setRevision(v => v + 1)}>Refresh</Button>
      </div>
      <form className="studio-searchbar" onSubmit={search}>
        <label className="studio-search"><span className="studio-sr-only">Search library</span><input placeholder="Find something you created…" value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} /></label>
        <details className="studio-filter-details"><summary>Filters</summary><div>
          <label>Language<select value={filters.language} onChange={e => setFilters(f => ({ ...f, language: e.target.value }))}><option value="">All languages</option><option value="en">English</option><option value="es">Español</option></select></label>
          <label>Topic<select value={filters.topicId} onChange={e => setFilters(f => ({ ...f, topicId: e.target.value }))}><option value="">All topics</option>{options?.topics?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
        </div></details>
        <Button type="submit" variant="secondary">Search</Button>
      </form>
      <div aria-live="polite" className="studio-load-status">{catalog.loading ? 'Loading your library…' : catalog.error ? catalog.error.message : ''}</div>
      {!catalog.loading && !catalog.error && !catalog.items.length && <div className="studio-empty"><span aria-hidden="true" className="studio-empty-symbol">✦</span><h2>Your next idea starts here.</h2><p>No items match this view. Create something new, or try another search.</p></div>}
      <div className="studio-grid" aria-busy={catalog.loading}>
        {!catalog.loading && !catalog.error && catalog.items.map(item => <article className="studio-card" key={item.id}>
          <div className="studio-card__meta"><span>{typeLabel(item.content_type)}</span><span>{languageLabel(item.language)}</span></div>
          <h2>{item.can_open ? <Link to={'/studio/content/' + item.id}>{item.title}</Link> : item.title}</h2>
          <p>{item.description || 'A little knowledge goes a long way.'}</p>
          <div className="studio-card__topics">{item.topics?.map(t => <span key={t.id}>{t.name}</span>)}</div>
          <footer><span>{audienceLabel(item.audience)}</span><span className={'studio-status studio-status--' + item.status}>{item.status}</span></footer>
          <small>Updated {new Date(item.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</small>
        </article>)}
      </div>
      <div className="studio-pagination"><Button variant="ghost" disabled={!query.offset || catalog.loading} onClick={() => setQuery(q => ({ ...q, offset: Math.max(0, q.offset - PAGE_SIZE) }))}>Previous</Button><span>Page {Math.floor(query.offset / PAGE_SIZE) + 1}</span><Button variant="ghost" disabled={catalog.items.length < PAGE_SIZE || catalog.loading} onClick={() => setQuery(q => ({ ...q, offset: q.offset + PAGE_SIZE }))}>Next</Button></div>
    </section>
  </StudioShell>
}
