import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import {
  assertTrainingAuthoringDestination,
  resolveTrainingAuthoringDestination,
} from './authoringDestination.js'

const projectRef = 'lhgnbcaundgjeofjrscg'
const backend = `https://${projectRef}.supabase.co`
const production = 'https://www.pulse-kk.com'

test('isolated local Supabase remains the only configuration-free authoring target', () => {
  assert.equal(resolveTrainingAuthoringDestination('http://127.0.0.1:54321').mode, 'local')
  assert.equal(resolveTrainingAuthoringDestination('http://localhost:54321').allowed, true)
  assert.equal(resolveTrainingAuthoringDestination('http://localhost:54322').allowed, false)
  assert.equal(resolveTrainingAuthoringDestination('https://127.0.0.1:54321').allowed, false)
})

test('remote authoring requires the exact project and exact runtime origin together', () => {
  const approved = { approvedProjectRef: projectRef, approvedOrigin: production, currentOrigin: production }
  assert.deepEqual(resolveTrainingAuthoringDestination(backend, approved), {
    allowed: true, mode: 'remote', projectRef, origin: production,
  })
  assert.equal(resolveTrainingAuthoringDestination('https://wrongprojectref12345.supabase.co', approved).allowed, false)
  assert.equal(resolveTrainingAuthoringDestination(backend, { ...approved, currentOrigin: 'https://pulse-kk.com' }).allowed, false)
  assert.equal(resolveTrainingAuthoringDestination(backend, { ...approved, approvedOrigin: 'https://*.vercel.app' }).allowed, false)
  assert.equal(resolveTrainingAuthoringDestination(backend, { ...approved, approvedOrigin: 'http://localhost:5173', currentOrigin: 'http://localhost:5173' }).allowed, false)
})

test('missing or malformed remote configuration fails closed', () => {
  assert.equal(resolveTrainingAuthoringDestination(backend, { currentOrigin: production }).allowed, false)
  assert.equal(resolveTrainingAuthoringDestination(backend, { approvedProjectRef: projectRef, currentOrigin: production }).allowed, false)
  assert.throws(() => assertTrainingAuthoringDestination(backend, {
    approvedProjectRef: projectRef, approvedOrigin: production, currentOrigin: 'https://preview.example.com',
  }))
})

test('browser transport guard stays independent from server authorization', async () => {
  const source = await readFile(new URL('./authoringDestination.js', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /service_role|localStorage|super_admin|email|ALLOW_REMOTE/i)
  assert.match(source, /VITE_TRAINING_AUTHORING_PROJECT_REF/)
  assert.match(source, /VITE_TRAINING_AUTHORING_ORIGIN/)
})
