import { useEffect, useState } from 'react'

import { getGoGlobalRanking } from '../training/trainingApi.js'
import { GO_ART } from './goVisualAssets.js'
import { useGoIdentity } from './useGoIdentity.js'

export function GoGlobalRanking() {
  const identity = useGoIdentity()
  const [period, setPeriod] = useState('week')
  const [state, setState] = useState({ data: null, loading: true, error: null })
  useEffect(() => {
    if (!identity.client) return undefined
    let active = true
    const timer = setTimeout(() => {
      setState({ data: null, loading: true, error: null })
      void getGoGlobalRanking(identity.client, period).then(({ data, error }) => {
        if (active) setState({ data, loading: false, error })
      })
    }, 0)
    return () => { active = false; clearTimeout(timer) }
  }, [identity.client, period])
  if (!identity.client) return null
  const top = state.data?.top || []
  const own = state.data?.your_rank
  const ownOutsideTop = own && !top.some(player => player.rank === own.rank)
  return <section className="go-global-ranking" aria-label="Global Ranking">
    <header><div><p className="go-eyebrow">Play together · Grow together</p><h2>Global Ranking</h2><p>Hosted games earn points. Practice is just for you.</p></div><img src={GO_ART.medal1} alt="" /></header>
    <div className="go-global-ranking__tabs" role="group" aria-label="Ranking period">
      <button type="button" aria-pressed={period === 'week'} onClick={() => setPeriod('week')}>This week</button>
      <button type="button" aria-pressed={period === 'all_time'} onClick={() => setPeriod('all_time')}>All time</button>
    </div>
    {state.loading && <p role="status">Loading ranking…</p>}
    {state.error && <p role="alert">Ranking is unavailable right now.</p>}
    {!state.loading && !state.error && (top.length ? <ol>{top.map(player => <li key={player.rank}>
      <span className="go-global-ranking__place">#{player.rank}</span>
      <strong>{player.display_name}<small>{player.team || 'Pulse team'}</small></strong>
      <b>{Number(player.points).toLocaleString()} pts</b>
    </li>)}</ol> : <p>No Hosted scores yet. The first completed game will start the ranking.</p>)}
    {ownOutsideTop && <div className="go-global-ranking__own"><span>Your rank</span><strong>#{own.rank} · {own.display_name}</strong><b>{Number(own.points).toLocaleString()} pts</b></div>}
    <small className="go-global-ranking__note">Weekly results reset every Monday at 00:00 UTC.</small>
  </section>
}
