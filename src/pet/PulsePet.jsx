import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { Link } from 'react-router-dom'

import { anchorFromPosition, clampPetPosition, gazeTarget, movedEnough, petMenuPosition, petSize, positionFromAnchor, readPetPreferences, savePetPreferences, smoothGaze, PET_SETTLE_DELAY_MS } from './petModel.js'
import robot from './assets/pulse-pet-neutral-v1.png'
import workingRobot from './assets/pulse-pet-working-v1.png'
import './pulsePet.css'

function preferencesStorage() {
  try { return window.localStorage } catch { return null }
}

function viewportSize() {
  return { width: window.innerWidth, height: Math.min(window.innerHeight, window.visualViewport?.height || window.innerHeight) }
}

const motionQuery = '(prefers-reduced-motion: reduce)'
const hiddenSnapshot = () => document.hidden
const motionSnapshot = () => window.matchMedia(motionQuery).matches
function subscribeVisibility(listener) {
  document.addEventListener('visibilitychange', listener)
  return () => document.removeEventListener('visibilitychange', listener)
}
function subscribeMotion(listener) {
  const query = window.matchMedia(motionQuery)
  query.addEventListener('change', listener)
  return () => query.removeEventListener('change', listener)
}

function ShortcutIcon({ kind }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
    {kind === 'host' ? <><path d="m9 6 9 6-9 6V6Z" /><path d="M5 6v12" /></>
      : kind === 'dashboard' ? <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></>
        : <><path d="m3 8 9-4 9 4-9 4-9-4Z" /><path d="M6 10v7l6 3 6-3v-7M21 8v7" /></>}
  </svg>
}

function RobotEyes() {
  return <svg className="pulse-pet__eyes" viewBox="0 0 80 44" aria-hidden="true" shapeRendering="crispEdges">
    <g className="pulse-pet__eyes-open"><path d="M14 11h14v24H14V11Zm38 0h14v24H52V11Z" fill="#ffac19" /><path d="M14 11h4v24h-4Zm38 0h4v24h-4Z" fill="#ff7900" /><path d="M18 11h7v5h-7Zm38 0h7v5h-7Z" fill="#fff0ac" /></g>
    <g className="pulse-pet__eyes-happy" fill="#ffac19"><path d="M10 27v-8h5v-6h12v6h5v8h-6v-7H16v7h-6Zm38 0v-8h5v-6h12v6h5v8h-6v-7H54v7h-6Z" /></g>
    <g className="pulse-pet__eyes-sleep" fill="#ffac19"><path d="M10 22h6v4h10v-4h6v8H10v-8Zm38 0h6v4h10v-4h6v8H48v-8Z" /></g>
  </svg>
}

export function PulsePet({ actions, mode = 'normal', pathname = '', motionOverride }) {
  const [preferences, setPreferences] = useState(() => readPetPreferences(preferencesStorage()))
  const [viewport, setViewport] = useState(viewportSize)
  // Snapshot synchronization also covers a tab becoming visible between render
  // and effect subscription; animation must not stay paused after that race.
  const systemReducedMotion = useSyncExternalStore(subscribeMotion, motionSnapshot, () => true)
  // The local review fixture may inject a motion policy; the account layer
  // never overrides the user's system preference.
  const reducedMotion = motionOverride ?? systemReducedMotion
  const hidden = useSyncExternalStore(subscribeVisibility, hiddenSnapshot, () => true)
  const [panel, setPanel] = useState({ open: false, pathname })
  const [hovered, setHovered] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const [assetFailed, setAssetFailed] = useState(false)
  const root = useRef(null), trigger = useRef(null), menu = useRef(null)
  const position = useRef({ x: 0, y: 0 }), drag = useRef(null), suppressClick = useRef(false)
  const pointer = useRef(null)
  const settleTimer = useRef(null)
  const cursorInside = useRef(false), keyboardFocus = useRef(false)
  const compact = preferences.asleep || mode === 'quiet'
  const size = useMemo(() => petSize(viewport.width, compact), [viewport.width, compact])
  const open = panel.open && panel.pathname === pathname
  const paused = hidden || reducedMotion || compact || assetFailed
  const working = !compact && !hovered && !open && !dragging

  function engage(event) {
    if (event?.type === 'pointerenter') cursorInside.current = true
    if (event?.type === 'focus') keyboardFocus.current = event.currentTarget.matches(':focus-visible')
    window.clearTimeout(settleTimer.current)
    setHovered(true)
  }

  function settle(event) {
    if (event.type === 'pointerleave') cursorInside.current = false
    if (event.type === 'blur') keyboardFocus.current = false
    window.clearTimeout(settleTimer.current)
    if (cursorInside.current || keyboardFocus.current) return
    settleTimer.current = window.setTimeout(() => {
      if (!cursorInside.current && !keyboardFocus.current) setHovered(false)
    }, PET_SETTLE_DELAY_MS)
  }

  useEffect(() => () => window.clearTimeout(settleTimer.current), [])

  function place(point) {
    position.current = clampPetPosition(point, viewport, size)
    if (root.current) {
      root.current.style.left = position.current.x + 'px'
      root.current.style.top = position.current.y + 'px'
    }
  }

  function save(next) {
    savePetPreferences(preferencesStorage(), next)
    setPreferences(next)
  }

  function closePanel(restoreFocus = false) {
    setPanel({ open: false, pathname })
    if (restoreFocus) trigger.current?.focus({ preventScroll: true })
  }

  useLayoutEffect(() => {
    position.current = positionFromAnchor(preferences.position, viewport, size)
    root.current?.style.setProperty('left', position.current.x + 'px')
    root.current?.style.setProperty('top', position.current.y + 'px')
  }, [preferences.position, viewport, size])

  useLayoutEffect(() => {
    if (!open || !menu.current) return
    const box = menu.current.getBoundingClientRect()
    const point = petMenuPosition(position.current, viewport, size, box)
    menu.current.style.left = point.x + 'px'
    menu.current.style.top = point.y + 'px'
  }, [open, viewport, size, actions.length, mode])

  useEffect(() => {
    const resize = () => setViewport(viewportSize())
    window.addEventListener('resize', resize)
    window.visualViewport?.addEventListener('resize', resize)
    return () => {
      window.removeEventListener('resize', resize)
      window.visualViewport?.removeEventListener('resize', resize)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const outside = event => { if (!root.current?.contains(event.target)) setPanel({ open: false, pathname }) }
    const escape = event => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setPanel({ open: false, pathname })
        trigger.current?.focus({ preventScroll: true })
      }
    }
    const history = () => setPanel({ open: false, pathname })
    document.addEventListener('pointerdown', outside)
    document.addEventListener('focusin', outside)
    document.addEventListener('keydown', escape)
    window.addEventListener('popstate', history)
    return () => {
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('focusin', outside)
      document.removeEventListener('keydown', escape)
      window.removeEventListener('popstate', history)
    }
  }, [open, pathname])

  useEffect(() => {
    const element = root.current
    if (!element) return
    element.style.setProperty('--pet-eye-x', '0px')
    element.style.setProperty('--pet-eye-y', '0px')
    element.style.setProperty('--pet-head-turn', '0deg')
    element.style.setProperty('--pet-blink', '1')
    if (paused) return
    let frame, blinkTimer, reopenTimer, previous = performance.now()
    let look = { x: 0, y: 0 }, idleLook = { x: 0, y: 0 }, idleAt = previous + 4500
    const track = event => {
      if (event.pointerType !== 'touch') pointer.current = { x: event.clientX, y: event.clientY, at: performance.now() }
    }
    const leave = () => { pointer.current = null }
    const animate = now => {
      const elapsed = now - previous
      previous = now
      if (now >= idleAt) {
        idleLook = { x: (Math.random() - 0.5) * 2.8, y: (Math.random() - 0.5) * 1.2 }
        idleAt = now + 6500 + Math.random() * 5000
      }
      const cursor = pointer.current
      const target = drag.current ? { x: 0, y: 0 }
        : cursor && now - cursor.at < 7000 ? gazeTarget(cursor, position.current, size.scale) : idleLook
      look = smoothGaze(look, target, elapsed)
      element.style.setProperty('--pet-eye-x', look.x.toFixed(2) + 'px')
      element.style.setProperty('--pet-eye-y', look.y.toFixed(2) + 'px')
      element.style.setProperty('--pet-head-turn', (look.x * 0.75).toFixed(2) + 'deg')
      frame = window.requestAnimationFrame(animate)
    }
    const scheduleBlink = () => {
      blinkTimer = window.setTimeout(() => {
        element.style.setProperty('--pet-blink', '0.09')
        reopenTimer = window.setTimeout(() => {
          element.style.setProperty('--pet-blink', '1')
          scheduleBlink()
        }, 110 + Math.random() * 55)
      }, 2900 + Math.random() * 3900)
    }
    window.addEventListener('pointermove', track, { passive: true })
    document.addEventListener('pointerleave', leave)
    frame = window.requestAnimationFrame(animate)
    scheduleBlink()
    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(blinkTimer)
      window.clearTimeout(reopenTimer)
      window.removeEventListener('pointermove', track)
      document.removeEventListener('pointerleave', leave)
    }
  }, [paused, size.scale])

  function pointerDown(event) {
    if (event.button !== 0 || !event.isPrimary) return
    keyboardFocus.current = false
    drag.current = { id: event.pointerId, start: { x: event.clientX, y: event.clientY }, origin: { ...position.current }, moved: false }
    suppressClick.current = false
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function pointerMove(event) {
    const gesture = drag.current
    if (!gesture || event.pointerId !== gesture.id) return
    const point = { x: event.clientX, y: event.clientY }
    if (!gesture.moved && movedEnough(gesture.start, point)) {
      gesture.moved = true
      setDragging(true)
      closePanel()
    }
    if (gesture.moved) {
      event.preventDefault()
      place({ x: gesture.origin.x + point.x - gesture.start.x, y: gesture.origin.y + point.y - gesture.start.y })
    }
  }

  function finishDrag(event, cancelled = false) {
    const gesture = drag.current
    if (!gesture || event.pointerId !== gesture.id) return
    drag.current = null
    suppressClick.current = gesture.moved || cancelled
    setDragging(false)
    if (cancelled) place(gesture.origin)
    else if (gesture.moved) {
      save({ ...preferences, position: anchorFromPosition(position.current, viewport, size) })
      setAnnouncement('Pulse Pet moved. Position saved on this browser.')
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }

  function activate(event) {
    if (suppressClick.current && event.detail !== 0) { suppressClick.current = false; event.preventDefault(); return }
    if (preferences.asleep && mode !== 'quiet') {
      save({ ...preferences, asleep: false })
      setAnnouncement('Pulse Pet is awake.')
      return
    }
    setPanel({ open: !open, pathname })
  }

  function moveByKeyboard(event) {
    const offsets = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }
    const offset = offsets[event.key]
    if (!offset) return
    event.preventDefault()
    keyboardFocus.current = true
    engage()
    closePanel()
    const amount = event.shiftKey ? 40 : 10
    place({ x: position.current.x + offset[0] * amount, y: position.current.y + offset[1] * amount })
    save({ ...preferences, position: anchorFromPosition(position.current, viewport, size) })
    setAnnouncement('Pulse Pet moved.')
  }

  if (assetFailed) return null
  const expression = compact ? 'sleep' : dragging ? 'curious' : hovered || open ? 'happy' : 'neutral'
  return <aside ref={root} className={`pulse-pet${compact ? ' pulse-pet--compact' : ''}${dragging ? ' pulse-pet--dragging' : ''}${hovered || open ? ' pulse-pet--engaged' : ''}${paused ? ' pulse-pet--still' : ''}`}
    aria-label="Pulse Pet" data-expression={expression} data-mode={mode} data-pose={working ? 'working' : 'standing'}
    style={{ width: size.width, height: size.height, '--pet-scale': size.scale }}>
    <button ref={trigger} className="pulse-pet__trigger" type="button" aria-label={preferences.asleep && mode !== 'quiet' ? 'Wake Pulse Pet' : 'Pulse Pet · Open shortcuts'}
      aria-expanded={open} aria-controls={open ? 'pulse-pet-shortcuts' : undefined} aria-describedby="pulse-pet-instructions"
      onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={event => finishDrag(event)} onPointerCancel={event => finishDrag(event, true)} onLostPointerCapture={event => finishDrag(event, true)}
      onPointerEnter={engage} onPointerLeave={settle} onFocus={engage} onBlur={settle} onClick={activate} onKeyDown={moveByKeyboard}>
      <span className="pulse-pet__scene" aria-hidden="true">
        <span className="pulse-pet__shadow" />
        <span className="pulse-pet__rig">
          <span className="pulse-pet__pose pulse-pet__standing">
            <span className="pulse-pet__body pulse-pet__part"><img src={robot} alt="" draggable="false" onError={() => setAssetFailed(true)} /></span>
            <span className="pulse-pet__arm pulse-pet__part"><img src={robot} alt="" draggable="false" /></span>
          </span>
          <span className="pulse-pet__pose pulse-pet__working">
            <span className="pulse-pet__working-body pulse-pet__part"><img src={workingRobot} alt="" draggable="false" onError={() => setAssetFailed(true)} /></span>
          </span>
          <span className="pulse-pet__head">
            <span className="pulse-pet__helmet pulse-pet__part"><img src={robot} alt="" draggable="false" /></span>
            <span className="pulse-pet__face"><RobotEyes /></span>
          </span>
        </span>
        {compact && <span className="pulse-pet__zzz">z<span>z</span></span>}
      </span>
    </button>
    <span id="pulse-pet-instructions" className="pulse-sr-only">Click for shortcuts. Drag to move, or use arrow keys while focused. Shift and arrow keys move farther.</span>
    <span className="pulse-sr-only" role="status" aria-live="polite">{announcement}</span>
    {open && <nav ref={menu} id="pulse-pet-shortcuts" className="pulse-pet__panel" aria-label="Pulse Pet shortcuts">
      <div className="pulse-pet__panel-heading"><div><strong>Pulse Pet</strong><span>{mode === 'quiet' ? 'Resting while you work' : 'A little company. A quick way there.'}</span></div><button type="button" aria-label="Close Pulse Pet shortcuts" onClick={() => closePanel(true)}>×</button></div>
      {mode === 'normal' ? <div className="pulse-pet__links">{actions.map(action => <Link key={action.id} to={action.to} onClick={() => closePanel()}><ShortcutIcon kind={action.id} /><span><strong>{action.label}</strong><small>{action.detail}</small></span><span className="pulse-pet__arrow" aria-hidden="true">↗</span></Link>)}</div>
        : <p className="pulse-pet__quiet-copy">Your game or draft stays right here. Shortcuts return when you finish.</p>}
      <div className="pulse-pet__controls"><button type="button" onClick={() => { save({ ...preferences, position: { x: 1, y: 1 } }); closePanel(true); setAnnouncement('Pulse Pet returned to the bottom-right corner.') }}>Reset position</button>
        {mode === 'normal' && <button type="button" onClick={() => { save({ ...preferences, asleep: true }); closePanel(true); setAnnouncement('Pulse Pet is resting. Click to wake.') }}>Let me rest <span aria-hidden="true">☾</span></button>}</div>
    </nav>}
  </aside>
}
