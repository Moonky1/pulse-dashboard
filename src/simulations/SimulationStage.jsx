import { useState } from 'react'

export function SimulationStage({ step, url, busy = false, onAnswer, drawing = false, onRegion }) {
  const [value, setValue] = useState('')
  const [start, setStart] = useState(null)
  const input = step.regions?.[0]
  const point = event => {
    const bounds = event.currentTarget.getBoundingClientRect()
    return { x: Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width)), y: Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height)) }
  }
  function press(event) {
    if (!url || busy || event.target.closest('input,select,button')) return
    if (drawing) { event.currentTarget.setPointerCapture(event.pointerId); setStart(point(event)); return }
    if (step.interaction === 'click') onAnswer(point(event))
  }
  function release(event) {
    if (!drawing || !start) return
    const end = point(event), area = { x: Math.min(start.x, end.x), y: Math.min(start.y, end.y), w: Math.abs(end.x - start.x), h: Math.abs(end.y - start.y) }
    setStart(null)
    if (area.w > .004 && area.h > .004) onRegion(area)
  }
  return <>
    <div className="sim-screen-scroll" tabIndex={0} aria-label="Dialer screen; scroll horizontally on a narrow display">
      <div className={'sim-screen' + (drawing ? ' sim-screen--drawing' : '')} onPointerDown={press} onPointerUp={release} onPointerCancel={() => setStart(null)}>
        {url ? <img src={url} alt="Synthetic VICIdial-style training screen. Use the instruction and the accessible controls below." draggable={false} /> : step.interaction !== 'info' && <div className="sim-screen-empty" role="status">Loading private screen…</div>}
        {drawing && step.regions?.map(r => <div key={r.id} className="sim-target" style={{ left: r.x * 100 + '%', top: r.y * 100 + '%', width: r.w * 100 + '%', height: r.h * 100 + '%' }}><span>{r.label}</span></div>)}
        {!drawing && input && ['text', 'select'].includes(step.interaction) && url && <div className="sim-input-overlay" style={{ left: input.x * 100 + '%', top: input.y * 100 + '%', width: input.w * 100 + '%', height: input.h * 100 + '%' }}>
          {step.interaction === 'text' ? <input aria-label={input.label} value={value} onChange={e => setValue(e.target.value)} disabled={busy} autoComplete="off" maxLength={500} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onAnswer(value) } }} /> : <select aria-label={input.label} value={value} onChange={e => setValue(e.target.value)} disabled={busy}><option value="">Choose…</option>{step.options.map(option => <option key={option}>{option}</option>)}</select>}
        </div>}
      </div>
    </div>
    {!drawing && <div className="sim-stage-controls">
      {step.interaction === 'click' && <details><summary>Keyboard / accessible controls</summary><div className="sim-target-buttons">{step.regions.map(r => <button key={r.id} disabled={busy || !url} onClick={() => onAnswer(r.id)}>{r.label}</button>)}</div></details>}
      {['text', 'select'].includes(step.interaction) && <button className="sim-primary" disabled={busy || !url || !value.trim()} onClick={() => onAnswer(value)}>Confirm {step.interaction === 'text' ? 'entry' : 'selection'} →</button>}
      {['choice', 'action'].includes(step.interaction) && <div className="sim-target-buttons">{step.options.map(option => <button key={option} disabled={busy || !url} onClick={() => onAnswer(option)}>{option}</button>)}</div>}
      {step.interaction === 'info' && <button className="sim-primary" disabled={busy} onClick={() => onAnswer('continue')}>I understand · Continue →</button>}
    </div>}
  </>
}
