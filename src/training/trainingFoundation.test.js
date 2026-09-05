import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import {
  getAgentTrainingCapabilities,
  getStaffTrainingCapabilities,
  getTrainingCapabilities,
  getTrainingEntryActions,
  isLearnerVisibleContent,
  normalizeTrainingLanguage,
} from './trainingFoundation.js'

const migrationUrl = new URL(
  '../../supabase/migrations/20260901000100_training_shared_foundation.sql',
  import.meta.url,
)
const authAppUrl = new URL('../auth/AuthApp.jsx', import.meta.url)
const agentSignInUrl = new URL('../auth/screens/AgentSignInPage.jsx', import.meta.url)
const indexUrl = new URL('../../index.html', import.meta.url)

test('Staff training visibility is permission-driven, never role-name-driven', () => {
  const capabilities = getStaffTrainingCapabilities(['go.host', 'studio.view'])
  assert.equal(capabilities.goHost, true)
  assert.equal(capabilities.studioView, true)
  assert.equal(capabilities.goPractice, false)
  assert.equal(capabilities.academyView, false)

  const roleLikeInput = getTrainingCapabilities({
    actorType: 'staff',
    permissions: ['qa', 'supervisor', 'trainer'],
  })
  assert.deepEqual(getTrainingEntryActions({ actorType: 'staff', permissions: ['qa'] }), [])
  assert.equal(roleLikeInput.goHost, false)
})

test('Studio create and publish remain independent canonical permissions', () => {
  const creator = getStaffTrainingCapabilities(['studio.create'])
  assert.equal(creator.studioCreate, true)
  assert.equal(creator.studioPublish, false)
  assert.equal(creator.studioView, false)
})

test('Academy manage implies view but not Studio or GO authority', () => {
  const manager = getStaffTrainingCapabilities(['academy.manage'])
  assert.equal(manager.academyView, true)
  assert.equal(manager.academyManage, true)
  assert.equal(manager.studioCreate, false)
  assert.equal(manager.goHost, false)
})

test('Agent play entitlement is separate from Staff RBAC', () => {
  const agent = getAgentTrainingCapabilities({ playEntitled: true })
  assert.equal(agent.goPractice, true)
  assert.equal(agent.academyView, true)
  assert.equal(agent.goHost, false)
  assert.equal(agent.studioView, false)

  const forgedStaffPermissions = getTrainingCapabilities({
    actorType: 'agent',
    permissions: ['go.host', 'studio.publish', 'academy.manage'],
    agentPlayEntitled: false,
  })
  assert.equal(forgedStaffPermissions.goHost, false)
  assert.equal(forgedStaffPermissions.studioPublish, false)
  assert.equal(forgedStaffPermissions.academyManage, false)
})

test('Unknown actor has no training capability', () => {
  assert.deepEqual(getTrainingEntryActions({ actorType: 'unknown' }), [])
})

test('Learners see only published content and language is explicit', () => {
  assert.equal(isLearnerVisibleContent({ status: 'published' }), true)
  assert.equal(isLearnerVisibleContent({ status: 'draft' }), false)
  assert.equal(isLearnerVisibleContent({ status: 'archived' }), false)
  assert.equal(normalizeTrainingLanguage('ES'), 'es')
  assert.equal(normalizeTrainingLanguage('mixed'), null)
  assert.equal(normalizeTrainingLanguage(''), null)
})

test('migration is protected, read/schema-only, and keeps Agent linkage deferred', async () => {
  const sql = await readFile(migrationUrl, 'utf8')
  for (const table of [
    'training_topics',
    'training_media',
    'training_content',
    'training_questions',
    'training_modules',
    'training_learners',
    'training_staff_learner_links',
    'training_attempts',
    'training_results',
  ]) {
    assert.match(sql, new RegExp(`create table public\\.${table}`))
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`))
  }
  assert.match(sql, /learner_kind = 'staff'/)
  assert.doesNotMatch(sql, /agent_identity_id|create table public\.agents/i)
  assert.doesNotMatch(sql, /create function public\.(create|publish|archive|record)_?training/i)
  assert.doesNotMatch(sql, /grant\s+(select|insert|update|delete|all).*authenticated/i)
  assert.doesNotMatch(sql, /service_role.{0,120}(javascript|jsx|tsx)/i)
  assert.doesNotMatch(sql, /execute\s+format|\btruncate\b/i)
})

test('Production keeps Staff and future Agent entry boundaries separate', async () => {
  const [authApp, agentSignIn, index] = await Promise.all([
    readFile(authAppUrl, 'utf8'),
    readFile(agentSignInUrl, 'utf8'),
    readFile(indexUrl, 'utf8'),
  ])
  assert.match(index, /src\/auth\/main\.jsx/)
  assert.match(authApp, /AGENT_SIGN_IN_PATH/)
  assert.match(authApp, /PublicOnly><AgentSignInPage/)
  assert.doesNotMatch(agentSignIn, /signInWithPassword|signInWithOAuth|signUp|public\.users/)
  assert.doesNotMatch(agentSignIn, /go\.play|academy\.view|studio\./)
})
