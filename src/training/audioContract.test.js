import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const read = async path => readFile(new URL(path, import.meta.url), 'utf8')

test('audio upload uses the guarded media function and never uploads a whole source file', async () => {
  const editor = await read('../studio/QuestionAudioEditor.jsx')
  const media = await read('./trainingMediaApi.js')
  const edge = await read('../../supabase/functions/pulse-training-media/index.ts')
  assert.match(editor, /trimAudioToWav\(file, start, end/)
  assert.match(editor, /uploadTrainingQuestionAudio\(supabase, contentId, clip\)/)
  assert.doesNotMatch(editor, /storage\.from|uploadTrainingQuestionAudio\(supabase, contentId, file\)/)
  assert.match(media, /assertTrainingAuthoringDestination/)
  assert.match(edge, /can_write_training_media/)
  assert.match(edge, /can_read_training_media/)
  assert.match(edge, /createSignedUrl\(media.storage_path, 600\)/)
  assert.match(edge, /mime !== 'audio\/wav'/)
  assert.doesNotMatch(edge, /storage_path:.*payload|service_role.*request/i)
})

test('audio metadata is included only in authorized authoring, Practice and Hosted payloads', async () => {
  const migration = await read('../../supabase/migrations/20261003000500_go_question_audio_clips.sql')
  const api = await read('./trainingApi.js')
  assert.match(migration, /get_training_content_authoring_details_v3/)
  assert.match(migration, /get_go_practice_content_v3/)
  assert.match(migration, /get_go_hosted_experience_v2/)
  assert.match(migration, /create_training_content_revision_v3/)
  assert.match(migration, /training_questions_audio_clip_valid/)
  assert.match(api, /get_go_hosted_experience_v2/)
  assert.match(api, /replace_training_questions_v3/)
})
