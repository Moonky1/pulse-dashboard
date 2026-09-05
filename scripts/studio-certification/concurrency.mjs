import assert from 'node:assert/strict'
import { sql, sqlAsync, prepareLocal } from './local-runtime.mjs'

prepareLocal()
const actor = "select set_config('request.jwt.claim.sub','a3200000-0000-4000-8000-000000000006',false);"
const created = sql(actor + "select id from public.create_training_content_draft('quiz','Concurrency fixture',null,'en',array['23200000-0000-4000-8000-000000000001'::uuid],'global',null,null,'{}')").split('\n').at(-1)
assert.match(created, /^[0-9a-f-]{36}$/)
const question = [{ position: 1, question_type: 'text', prompt: 'Write the answer', answer_options: [], correct_answer: [' Answer '], topic_ids: ['23200000-0000-4000-8000-000000000001'] }]
const version = () => sql("select updated_at from public.training_content where id='" + created + "'")
sql(actor + "select * from public.replace_training_questions('" + created + "','" + JSON.stringify(question) + "','" + version() + "')")
const reviewed = version()
// Separate docker/psql processes = separate PostgreSQL connections. Session B
// actually waits for A's row lock, then must reject its stale reviewed version.
const a = sqlAsync("set application_name='studio-version-a'; begin; " + actor + "select * from public.update_training_content_draft('" + created + "','Session A saved',null,'en',array['23200000-0000-4000-8000-000000000001'::uuid],'global',null,null,'{}','" + reviewed + "'); select pg_sleep(4); commit;")
// Poll observable lock state, not a guessed sleep, before dispatching B.
let locked = false
let sessionAResult
void a.then(result => { sessionAResult = result })
for (let i = 0; i < 100; i++) {
  if (sessionAResult) throw new Error('Session A ended before lock observation: ' + JSON.stringify(sessionAResult))
  if (sql("select exists(select 1 from pg_stat_activity where application_name='studio-version-a' and wait_event='PgSleep')") === 't') { locked = true; break }
  await new Promise(r => setTimeout(r, 20))
}
assert.equal(locked, true, 'session A holds row lock: ' + JSON.stringify(sessionAResult))
const b = sqlAsync(actor + "select * from public.publish_training_content('" + created + "','" + reviewed + "')")
const [saved, rejected] = await Promise.all([a, b])
assert.equal(saved.code, 0)
assert.notEqual(rejected.code, 0)
assert.match(rejected.error, /reviewed content changed/)
assert.equal(sql("select status from public.training_content where id='" + created + "'"), 'draft')
console.log('PASS independent connections: row-locked stale publication rejects after concurrent commit')
const current = version()
sql(actor + "select * from public.publish_training_content('" + created + "','" + current + "')")
assert.equal(sql("select status from public.training_content where id='" + created + "'"), 'published')
console.log('PASS independent connection: exact current review publishes')
const attempt = sql(actor + "select attempt_id from public.start_training_attempt('" + created + "','go_practice')").split('\n').at(-1)
const questionId = sql("select id from public.training_questions where content_id='" + created + "'")
sql(actor + "select * from public.complete_training_attempt('" + attempt + "','" + JSON.stringify([{ question_id: questionId, answer: '  aNsWeR  ' }]) + "',1)")
assert.equal(sql("select correct_answers from public.training_results where attempt_id='" + attempt + "'"), '1')
console.log('PASS actual scoring preserves case-insensitive outer-space-normalized exact match')
