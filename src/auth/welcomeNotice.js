// Cosmetic, per-tab, short-lived intent. No identity, token, role or access decision.
const KEY = 'pulse_welcome_intent'
const TTL = 5 * 60 * 1000
const storage = () => { try { return globalThis.sessionStorage } catch { return null } }
export function markWelcome(now = Date.now(), store = storage()) {
  try { store?.setItem(KEY,String(now)) } catch { /* Optional decoration. */ }
}
export function clearWelcome(store = storage()) {
  try { store?.removeItem(KEY) } catch { /* Optional decoration. */ }
}
export function hasWelcome(now = Date.now(), store = storage()) {
  try { const value = store?.getItem(KEY); const age = now-Number(value); return value !== null && value !== undefined && age >= 0 && age < TTL } catch { return false }
}
