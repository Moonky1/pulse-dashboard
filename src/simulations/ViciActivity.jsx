import { useEffect, useRef } from 'react'

const outcomes = { correct: ['✓','Correct'], incorrect: ['×','Incorrect'], done: ['·','Done'], unsaved: ['!','Not saved'] }

export function ViciActivity({ entries }) {
  const list = useRef(null)
  useEffect(() => { if (list.current) list.current.scrollTop = list.current.scrollHeight },[entries])
  return <section className="vici-activity" aria-label="Action history">
    <h2>Your actions</h2>
    {!entries.length ? <p>Your clicks will appear here as you practice.</p> : <>
      {entries[0].number > 1 && <p>Showing the most recent 200 actions.</p>}
      <ol ref={list}>{entries.map(entry => { const [icon,label] = outcomes[entry.outcome]; return <li key={entry.number} value={entry.number}>
        <span className="vici-action-number" aria-hidden="true">{entry.number}.</span><span>{entry.label}</span>
        <span className={'vici-action-result vici-action-result--'+entry.outcome}><span aria-hidden="true">{icon}</span> {label}</span>
      </li> })}</ol>
    </>}
    {!!entries.length && <p className="vici-action-latest" role="status">{entries.at(-1).number}. {entries.at(-1).label} · {outcomes[entries.at(-1).outcome][1]}</p>}
  </section>
}
