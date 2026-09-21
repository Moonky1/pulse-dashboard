import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '../components/ui/Button.jsx'
import { resolveGoPracticeDestination } from '../training/goPracticeDestination.js'
import { listGoPracticeCatalog } from '../training/trainingApi.js'
import { supabase } from '../utils/supabase.js'
import { canPractice } from './goAccess.js'
import { languagePresentation } from './goHostedModel.js'
import { GoAccessState, GoShell } from './GoShell.jsx'
import { catalogOptions, normalizeCatalog } from './goPracticeModel.js'
import { GO_ART } from './goVisualAssets.js'
import { useGoAccess } from './useGoAccess.js'

const PRACTICE_ART = [GO_ART.classic, GO_ART.goal, GO_ART.valid, GO_ART.points]

export function GoPracticeSelection() {
  const access = useGoAccess()
  const destination = resolveGoPracticeDestination(supabase.supabaseUrl)
  const [filters, setFilters] = useState({ language: '', topicId: '' })
  const [catalog, setCatalog] = useState({ items: [], loading: true, error: null })

  useEffect(() => {
    if (access.state !== 'allowed' || !canPractice(access.capabilities) || !destination.allowed) return
    let current = true
    const timer = setTimeout(() => {
      setCatalog(previous => ({ ...previous, loading: true }))
      void listGoPracticeCatalog(supabase, {
        language: filters.language || null,
        topicId: filters.topicId || null,
      }).then(({ data, error }) => {
        if (current) setCatalog({ items: normalizeCatalog(data || []), loading: false, error })
      })
    }, 0)
    return () => { current = false; clearTimeout(timer) }
  }, [access.capabilities, access.state, destination.allowed, filters.language, filters.topicId])

  const options = useMemo(() => catalogOptions(catalog.items), [catalog.items])
  if (access.state !== 'allowed') return <GoAccessState access={access} />
  if (!canPractice(access.capabilities)) return <GoAccessState access={{ state: 'denied' }} />
  if (!destination.allowed) return <GoShell><section className="go-state" role="status"><h1>Practice isn’t available here.</h1><p>Try again from an enabled Pulse environment.</p><Link to="/go">Back to GO</Link></section></GoShell>

  return <GoShell>
    <section className="go-page-heading go-page-heading--with-art"><div><p className="go-eyebrow">Practice</p><h1>Pick a challenge.</h1><p>Choose something to play.</p></div><img src={GO_ART.goal1} alt="" /></section>
    <section className="go-filterbar" aria-label="Practice filters">
      <label>Language<select value={filters.language} onChange={event => setFilters(value => ({ ...value, language: event.target.value }))}><option value="">All languages</option>{options.languages.map(language => <option key={language} value={language}>{language === 'es' ? 'Español' : 'English'}</option>)}</select></label>
      <label>Topic<select value={filters.topicId} onChange={event => setFilters(value => ({ ...value, topicId: event.target.value }))}><option value="">All topics</option>{options.topics.map(topic => <option key={topic.id} value={topic.id}>{topic.name}</option>)}</select></label>
      <Button variant="ghost" onClick={() => setFilters({ language: '', topicId: '' })}>Clear filters</Button>
    </section>
    <div className="go-live-status" aria-live="polite">{catalog.loading ? 'Finding challenges…' : catalog.error?.message || ''}</div>
    {!catalog.loading && !catalog.error && !catalog.items.length && <section className="go-state"><h2>No practice is ready yet.</h2><p>Published quizzes and assessments you can access will appear here.</p></section>}
    <section className="go-catalog" aria-busy={catalog.loading}>
      {!catalog.loading && catalog.items.map((item, index) => {
        const language = languagePresentation(item.language)
        return <article className="go-content-card" key={item.id}>
        <div className="go-card-visual"><span className="go-card-art"><img src={PRACTICE_ART[index % PRACTICE_ART.length]} alt="" /><i aria-hidden="true">{String(index + 1).padStart(2, '0')}</i></span><span className="go-language"><b aria-hidden="true">{language.flag}</b>{language.label}</span></div>
        <div className="go-card-meta"><span>{item.content_type}</span><span>Ready to play</span></div>
        <h2>{item.title}</h2><p>{item.description || 'A quick way to sharpen what you know.'}</p>
        <div className="go-topic-list">{item.topics?.map(topic => <span key={topic.id}>{topic.name}</span>)}</div>
        <Link to={`/go/practice/${item.id}`}>Play</Link>
      </article>})}
    </section>
  </GoShell>
}
