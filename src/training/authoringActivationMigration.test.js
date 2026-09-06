import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const migrationUrl = new URL(
  '../../supabase/migrations/20260905000100_seed_transfers_training_topic.sql',
  import.meta.url,
)

test('STUDIO-1C migration inserts only the approved Transfers topic and fails on conflict', async () => {
  const sql = await readFile(migrationUrl, 'utf8')
  assert.match(sql, /23500000-0000-4000-8000-000000000001/)
  assert.match(sql, /'transfers'[\s\S]*'Transfers'[\s\S]*'Core transfer procedures and expectations for openers\.'/)
  assert.match(sql, /raise exception 'STUDIO-1C cannot seed Transfers: conflicting training topic already exists'/)
  assert.equal((sql.match(/insert into public\.training_topics/gi) || []).length, 1)
  assert.doesNotMatch(sql, /insert into public\.training_(content|questions|learners|attempts|results)|insert into public\.audit_events/i)
  assert.doesNotMatch(sql, /update\s+public\.|delete\s+from|truncate|alter\s+table|create\s+table/i)
})
