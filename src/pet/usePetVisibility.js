import { useSyncExternalStore } from 'react'
import { readPetVisibility, savePetVisibility, PET_VISIBILITY_KEY } from './petModel.js'

function storage() {
  try { return window.localStorage } catch { return null }
}

let visible = readPetVisibility(storage())
const listeners = new Set()
const snapshot = () => visible
const publish = () => { for (const listener of listeners) listener() }
const storageChanged = event => {
  if (event.key !== PET_VISIBILITY_KEY && event.key !== null) return
  visible = readPetVisibility(storage())
  publish()
}

function subscribe(listener) {
  listeners.add(listener)
  if (listeners.size === 1) window.addEventListener('storage', storageChanged)
  return () => {
    listeners.delete(listener)
    if (!listeners.size) window.removeEventListener('storage', storageChanged)
  }
}

function setVisible(next) {
  visible = next === true
  savePetVisibility(storage(), visible)
  publish()
}

export function usePetVisibility() {
  return [useSyncExternalStore(subscribe, snapshot, () => true), setVisible]
}
