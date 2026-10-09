// Presentation preferences only. These values never establish identity or access.
export const PET_STORAGE_KEY = 'pulse_pet_preferences_v1'
export const PET_VISIBILITY_KEY = 'pulse_pet_visible_v1'
export const PET_MARGIN = 16
export const DRAG_THRESHOLD = 6
export const PET_SETTLE_DELAY_MS = 3000

const bounded = (value, min, max) => Math.min(max, Math.max(min, value))
const finite = (value, fallback) => Number.isFinite(value) ? value : fallback

export function petSize(viewportWidth, compact = false) {
  if (compact) return { width: 56, height: 64, scale: 0.5 }
  return viewportWidth < 480
    ? { width: 96, height: 127, scale: 96 / 112 }
    : { width: 112, height: 148, scale: 1 }
}

export function clampPetPosition(position, viewport, size) {
  const marginX = Math.min(PET_MARGIN, Math.max(0, (viewport.width - size.width) / 2))
  const marginY = Math.min(PET_MARGIN, Math.max(0, (viewport.height - size.height) / 2))
  return {
    x: bounded(finite(position.x, marginX), marginX, Math.max(marginX, viewport.width - size.width - marginX)),
    y: bounded(finite(position.y, marginY), marginY, Math.max(marginY, viewport.height - size.height - marginY)),
  }
}

export function positionFromAnchor(anchor, viewport, size) {
  return clampPetPosition({
    x: PET_MARGIN + bounded(finite(anchor?.x, 1), 0, 1) * Math.max(0, viewport.width - size.width - PET_MARGIN * 2),
    y: PET_MARGIN + bounded(finite(anchor?.y, 1), 0, 1) * Math.max(0, viewport.height - size.height - PET_MARGIN * 2),
  }, viewport, size)
}

export function anchorFromPosition(position, viewport, size) {
  const point = clampPetPosition(position, viewport, size)
  return {
    x: bounded((point.x - PET_MARGIN) / Math.max(1, viewport.width - size.width - PET_MARGIN * 2), 0, 1),
    y: bounded((point.y - PET_MARGIN) / Math.max(1, viewport.height - size.height - PET_MARGIN * 2), 0, 1),
  }
}

export function petMenuPosition(position, viewport, size, menu) {
  const width = Math.min(menu.width, viewport.width - PET_MARGIN * 2)
  const height = Math.min(menu.height, viewport.height - PET_MARGIN * 2)
  const above = position.y - height - 8
  const below = position.y + size.height + 8
  return {
    x: bounded(position.x + size.width - width, PET_MARGIN, Math.max(PET_MARGIN, viewport.width - width - PET_MARGIN)),
    y: bounded(above >= PET_MARGIN ? above : below, PET_MARGIN, Math.max(PET_MARGIN, viewport.height - height - PET_MARGIN)),
  }
}

export function movedEnough(start, point) {
  return Math.hypot(point.x - start.x, point.y - start.y) >= DRAG_THRESHOLD
}

export function gazeTarget(pointer, position, scale = 1) {
  return {
    x: bounded((pointer.x - position.x - 56 * scale) / 240, -1, 1) * 4,
    y: bounded((pointer.y - position.y - 51 * scale) / 210, -1, 1) * 3,
  }
}

export function smoothGaze(current, target, elapsedMs) {
  // Time based damping: the same comfortable response at 30, 60 and 120 Hz.
  const amount = 1 - Math.exp(-bounded(elapsedMs, 0, 64) / 165)
  return { x: current.x + (target.x - current.x) * amount, y: current.y + (target.y - current.y) * amount }
}

export function readPetPreferences(storage) {
  const defaults = { position: { x: 1, y: 1 }, asleep: false }
  try {
    const saved = JSON.parse(storage?.getItem(PET_STORAGE_KEY) || 'null')
    if (saved?.version !== 1) return defaults
    return {
      position: {
        x: bounded(finite(saved.position?.x, 1), 0, 1),
        y: bounded(finite(saved.position?.y, 1), 0, 1),
      },
      asleep: saved.asleep === true,
    }
  } catch { return defaults }
}

export function savePetPreferences(storage, preferences) {
  try {
    storage?.setItem(PET_STORAGE_KEY, JSON.stringify({ version: 1,
      position: { x: bounded(finite(preferences.position?.x, 1), 0, 1), y: bounded(finite(preferences.position?.y, 1), 0, 1) },
      asleep: preferences.asleep === true,
    }))
  } catch { /* Private mode or a full storage area must not break Pulse. */ }
}

export function readPetVisibility(storage) {
  try { return storage?.getItem(PET_VISIBILITY_KEY) !== 'false' } catch { return true }
}

export function savePetVisibility(storage, visible) {
  try { storage?.setItem(PET_VISIBILITY_KEY, visible === true ? 'true' : 'false') } catch { /* This optional setting must also work without storage. */ }
}

export function petRouteMode(pathname, identity) {
  if (!['staff', 'agent'].includes(identity)) return null
  const shared = /^\/(go|academy)(\/|$)/.test(pathname) || /^\/profile\/[^/]+$/.test(pathname) || pathname === '/agent/settings'
  const staffOnly = /^\/(workspace|dashboard|settings|studio|staff)(\/|$)/.test(pathname)
  if (!shared && !(identity === 'staff' && staffOnly)) return null
  // No navigation shortcuts while writing a draft or taking part in a call/game.
  if (/^\/go\/(host|room|practice)\/[^/]+/.test(pathname)
    || /^\/academy\/simulations\/[^/]+/.test(pathname)
    || /^\/studio\/(create|content\/|simulations\/)/.test(pathname)) return 'quiet'
  return 'normal'
}

export function petActions(identity, capabilities) {
  if (!['staff', 'agent'].includes(identity)) return []
  return [
    ...(identity === 'staff' && capabilities?.can_host === true ? [{ id: 'host', label: 'Host a Game', detail: 'Bring your team together', to: '/go/host' }] : []),
    ...(identity === 'staff' ? [{ id: 'dashboard', label: 'Dashboard', detail: 'Back to your workspace', to: '/dashboard' }] : []),
    { id: 'academy', label: 'Academy', detail: 'Learn something new', to: '/academy' },
  ]
}
