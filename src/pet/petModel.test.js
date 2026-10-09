import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

import { anchorFromPosition, clampPetPosition, gazeTarget, movedEnough, PET_STORAGE_KEY, PET_VISIBILITY_KEY, petActions, petMenuPosition, petRouteMode, petSize, positionFromAnchor, readPetPreferences, savePetPreferences, readPetVisibility, savePetVisibility, smoothGaze } from './petModel.js'

const read = name => readFile(new URL(name, import.meta.url), 'utf8')
const desktop = { width: 1440, height: 900 }
const size = petSize(desktop.width)

test('three shortcuts reuse existing routes and only verified Staff host capability enables Host', () => {
  assert.deepEqual(petActions('staff', { can_host: true }).map(item => item.to), ['/go/host', '/dashboard', '/academy'])
  for (const capabilities of [null, {}, { can_host: false }, { can_host: 'true' }, { role: 'super_admin' }]) {
    assert.deepEqual(petActions('staff', capabilities).map(item => item.to), ['/dashboard', '/academy'])
  }
  assert.deepEqual(petActions('agent', { can_host: true }).map(item => item.to), ['/academy'])
  assert.deepEqual(petActions('anonymous', { can_host: true }), [])
  assert.deepEqual(petActions('loading', {}), [])
})

test('pet stays off public/auth/admin routes and never confuses legacy presence with identity', () => {
  for (const path of ['/', '/privacy', '/terms', '/signin', '/agent/signin', '/auth/callback', '/pending-approval', '/account-blocked', '/admin/users', '/unrecognized']) {
    assert.equal(petRouteMode(path, 'staff'), null, path)
  }
  for (const kind of ['anonymous', 'loading', 'pulse_user', null]) assert.equal(petRouteMode('/go', kind), null)
  assert.equal(petRouteMode('/dashboard', 'agent'), null)
  assert.equal(petRouteMode('/studio', 'agent'), null)
})

test('normal product browsing keeps the companion and forms/games use quiet controls without links', () => {
  for (const path of ['/workspace', '/dashboard', '/settings/profile', '/go', '/go/host', '/go/practice', '/studio', '/academy', '/academy/topic', '/academy/simulations']) {
    assert.equal(petRouteMode(path, 'staff'), 'normal', path)
  }
  for (const path of ['/go/host/room1', '/go/room/room1', '/go/practice/game1', '/academy/simulations/123', '/academy/simulations/preview/asia', '/studio/create', '/studio/content/123', '/studio/simulations/create', '/studio/simulations/123']) {
    assert.equal(petRouteMode(path, 'staff'), 'quiet', path)
  }
  assert.equal(petRouteMode('/academy', 'agent'), 'normal')
  assert.equal(petRouteMode('/profile/example', 'agent'), 'normal')
})

test('default home is safely inside the bottom-right corner', () => {
  assert.deepEqual(positionFromAnchor(null, desktop, size), { x: 1312, y: 736 })
  assert.deepEqual(anchorFromPosition({ x: 1312, y: 736 }, desktop, size), { x: 1, y: 1 })
})

test('drag clamps extreme and invalid positions to visible bounds', () => {
  assert.deepEqual(clampPetPosition({ x: -500, y: 5000 }, desktop, size), { x: 16, y: 736 })
  assert.deepEqual(clampPetPosition({ x: NaN, y: Infinity }, desktop, size), { x: 16, y: 16 })
  assert.deepEqual(positionFromAnchor({ x: -10, y: 90 }, desktop, size), { x: 16, y: 736 })
})

test('normalized saved position survives responsive resize and sleep without stranding the pet', () => {
  const anchor = anchorFromPosition({ x: 700, y: 400 }, desktop, size)
  for (const viewport of [desktop, { width: 390, height: 844 }, { width: 320, height: 200 }]) {
    for (const compact of [false, true]) {
      const dimensions = petSize(viewport.width, compact)
      const position = positionFromAnchor(anchor, viewport, dimensions)
      assert.ok(position.x >= 0 && position.x + dimensions.width <= viewport.width)
      assert.ok(position.y >= 0 && position.y + dimensions.height <= viewport.height)
    }
  }
  const roundTrip = anchorFromPosition(positionFromAnchor(anchor, desktop, size), desktop, size)
  assert.ok(Math.abs(anchor.x - roundTrip.x) < 1e-10 && Math.abs(anchor.y - roundTrip.y) < 1e-10)
})

test('menus at every edge remain fully inside phone and desktop viewports', () => {
  for (const viewport of [desktop, { width: 390, height: 844 }, { width: 320, height: 240 }]) {
    for (const x of [0, 0.5, 1]) for (const y of [0, 0.5, 1]) {
      const dimensions = petSize(viewport.width)
      const menu = { width: Math.min(264, viewport.width - 32), height: Math.min(280, viewport.height - 32) }
      const point = petMenuPosition(positionFromAnchor({ x, y }, viewport, dimensions), viewport, dimensions, menu)
      assert.ok(point.x >= 16 && point.y >= 16)
      assert.ok(point.x + menu.width <= viewport.width - 16)
      assert.ok(point.y + menu.height <= viewport.height - 16)
    }
  }
})

test('tap jitter is not a drag; only deliberate movement suppresses click', () => {
  assert.equal(movedEnough({ x: 0, y: 0 }, { x: 3, y: 4 }), false)
  assert.equal(movedEnough({ x: 0, y: 0 }, { x: 6, y: 0 }), true)
  assert.equal(movedEnough({ x: 15, y: 10 }, { x: 15, y: 10 }), false)
})

test('eyes track in every direction but never leave their face', () => {
  assert.deepEqual(gazeTarget({ x: 56, y: 51 }, { x: 0, y: 0 }), { x: 0, y: 0 })
  assert.deepEqual(gazeTarget({ x: 5000, y: -5000 }, { x: 0, y: 0 }), { x: 4, y: -3 })
  assert.deepEqual(gazeTarget({ x: 28, y: 25.5 }, { x: 0, y: 0 }, 0.5), { x: 0, y: 0 })
})

test('gaze damping is gradual, bounded, and time based', () => {
  const target = { x: 4, y: -3 }
  const first = smoothGaze({ x: 0, y: 0 }, target, 16)
  assert.ok(first.x > 0 && first.x < 0.5 && first.y < 0 && first.y > -0.5)
  const a = smoothGaze(smoothGaze({ x: 0, y: 0 }, target, 16), target, 16)
  const b = smoothGaze({ x: 0, y: 0 }, target, 32)
  assert.ok(Math.abs(a.x - b.x) < 1e-10)
  assert.deepEqual(smoothGaze({ x: 0, y: 0 }, target, -10), { x: 0, y: 0 })
  assert.ok(smoothGaze({ x: 0, y: 0 }, target, 99999).x < 2)
})

test('broken, unavailable, old or malformed storage cannot crash the companion', () => {
  const defaults = { position: { x: 1, y: 1 }, asleep: false }
  assert.deepEqual(readPetPreferences(null), defaults)
  assert.deepEqual(readPetPreferences({ getItem() { throw Error('denied') } }), defaults)
  for (const value of ['{bad', '{}', '{"version":2}', 'null']) assert.deepEqual(readPetPreferences({ getItem: () => value }), defaults)
  assert.deepEqual(readPetPreferences({ getItem: () => '{"version":1,"position":{"x":-30,"y":"bad"},"asleep":"true"}' }), { position: { x: 0, y: 1 }, asleep: false })
  assert.doesNotThrow(() => savePetPreferences({ setItem() { throw Error('quota') } }, defaults))
})

test('only normalized presentation settings persist: no identity, cursor history, messages or capability', () => {
  let written
  savePetPreferences({ setItem(key, value) { assert.equal(key, PET_STORAGE_KEY); written = JSON.parse(value) } }, {
    position: { x: 0.5, y: 0.2 }, asleep: true, cursor: { x: 900, y: 200 }, token: 'not-a-token', can_host: true,
  })
  assert.deepEqual(written, { version: 1, position: { x: 0.5, y: 0.2 }, asleep: true })
})

test('integration is a single lazy layer inside the router and isolates mascot failures', async () => {
  const app = await read('../auth/AuthApp.jsx'), layer = await read('PulsePetLayer.jsx')
  assert.equal((app.match(/<PulsePetLayer\s*\/>/g) || []).length, 1)
  assert.match(app, /lazy\(\(\) => import\('\.\.\/pet\/PulsePetLayer.jsx'\)/)
  assert.match(layer, /useGoIdentity\(\)/)
  assert.match(layer, /useGoAccess\(\)/)
  assert.match(layer, /getDerivedStateFromError/)
  assert.doesNotMatch(layer, /pulse_user|localStorage|role|\.from\(|createGoHostedSession/)
  assert.doesNotMatch(layer, /motionOverride/)
})

test('optional navigation never performs mutations, and draft/game quiet mode renders no shortcut links', async () => {
  const component = await read('PulsePet.jsx')
  assert.match(component, /mode === 'normal' \? <div className="pulse-pet__links"/)
  assert.match(component, /<Link key=\{action.id\} to=\{action.to\}/)
  assert.doesNotMatch(component, /supabase|fetch\(|\.rpc\(|createGoHostedSession|updateOwnStaffProfile|password|access_token/)
})

test('animation respects motion preference, visibility, and cleans up pointer/frame/blink work', async () => {
  const component = await read('PulsePet.jsx'), css = await read('pulsePet.css')
  assert.match(component, /document.hidden/)
  assert.match(component, /if \(paused\) return/)
  assert.match(component, /cancelAnimationFrame\(frame\)/)
  assert.match(component, /clearTimeout\(blinkTimer\)/)
  assert.match(component, /removeEventListener\('pointermove', track\)/)
  assert.match(css, /prefers-reduced-motion: reduce/)
  assert.match(css, /animation: none !important/)
})

test('keyboard, drag cancellation, focus restoration and touch all have explicit handling', async () => {
  const component = await read('PulsePet.jsx'), css = await read('pulsePet.css')
  assert.match(component, /onPointerCancel=\{event => finishDrag\(event, true\)\}/)
  assert.match(component, /onLostPointerCapture/)
  assert.match(component, /if \(cancelled\) place\(gesture.origin\)/)
  assert.match(component, /event.detail !== 0/)
  assert.match(component, /event.key === 'Escape'/)
  assert.match(component, /ArrowLeft: \[-1, 0\]/)
  assert.match(component, /focus\(\{ preventScroll: true \}\)/)
  assert.match(css, /touch-action: none/)
})

test('Show Pet / Hide Pet is a safe local preference, separate from saved position and sleep', () => {
  assert.equal(readPetVisibility(null), true)
  assert.equal(readPetVisibility({ getItem() { throw Error('denied') } }), true)
  for (const value of [null, 'true', 'bad', '0', '{}']) assert.equal(readPetVisibility({ getItem: () => value }), true)
  assert.equal(readPetVisibility({ getItem: () => 'false' }), false)
  const entries = new Map()
  const storage = { setItem: (key, value) => entries.set(key, value), getItem: key => entries.get(key) }
  savePetPreferences(storage, { position: { x: .4, y: .3 }, asleep: true })
  savePetVisibility(storage, false)
  assert.equal(entries.get(PET_VISIBILITY_KEY), 'false')
  assert.equal(readPetVisibility(storage), false)
  assert.deepEqual(readPetPreferences(storage), { position: { x: .4, y: .3 }, asleep: true })
  savePetVisibility(storage, true)
  assert.equal(readPetVisibility(storage), true)
  assert.doesNotThrow(() => savePetVisibility({ setItem() { throw Error('quota') } }, false))
})

test('both account menus share the visibility control and hiding unmounts all mascot work', async () => {
  const staff = await read('../components/ProductHeader.jsx'), agent = await read('../go-product/AgentGoHeader.jsx')
  const button = await read('PetVisibilityButton.jsx'), layer = await read('PulsePetLayer.jsx'), store = await read('usePetVisibility.js')
  for (const header of [staff, agent]) assert.equal((header.match(/<PetVisibilityButton\s*\/>/g) || []).length, 1)
  assert.match(button, /'Hide Pet' : 'Show Pet'/)
  assert.match(button, /aria-pressed=\{visible\}/)
  assert.match(layer, /!visible\) return null/)
  assert.match(store, /useSyncExternalStore/)
  assert.match(store, /removeEventListener\('storage', storageChanged\)/)
  assert.doesNotMatch(button + store, /fetch\(|supabase|\.rpc\(|\.from\(|authUser|access_token/)
})

test('idle laptop pose stands on pointer or keyboard engagement, then settles with cleaned-up timer', async () => {
  const component = await read('PulsePet.jsx'), css = await read('pulsePet.css')
  assert.match(component, /workingRobot from '.\/assets\/pulse-pet-working-v1.png'/)
  assert.match(component, /const working = !compact && !hovered && !open && !dragging/)
  assert.match(component, /onPointerEnter=\{engage\}/)
  assert.match(component, /onFocus=\{engage\}/)
  assert.match(component, /onPointerLeave=\{settle\}/)
  assert.match(component, /clearTimeout\(settleTimer.current\)/)
  assert.match(component, /setTimeout\(\(\) => setHovered\(false\), 850\)/)
  assert.match(css, /pulse-pet\[data-pose="working"\]/)
  assert.match(css, /pulse-pet--still .pulse-pet__pose \{ transition: none/)
  assert.doesNotMatch(css, /scale\(\.9(?:0|6)?\)/)
  assert.match(css, /pulse-pet\[data-pose="working"\] .pulse-pet__working \{ opacity: 1; transform: none; \}/)
  assert.equal((component.match(/className="pulse-pet__helmet pulse-pet__part"><img src=\{robot\}/g) || []).length, 2)
})
