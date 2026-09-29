import { createHash } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { classicQuestions } from '../../src/go/questions/classicQuestions.js'
import { validInvalidQuestions } from '../../src/go/questions/validInvalidQuestions.js'
import { disposeItQuestions } from '../../src/go/questions/disposeItQuestions.js'
import { eligibleQuestions } from '../../src/go/questions/eligibleQuestions.js'
import { objectionBattleQuestions } from '../../src/go/questions/objectionBattleQuestions.js'
import { certificationQuestions } from '../../src/go/questions/certificationQuestions.js'

const source = [classicQuestions, validInvalidQuestions, disposeItQuestions,
  eligibleQuestions, objectionBattleQuestions, certificationQuestions].flat()
const modes = {
  classic: ['Classic Quiz', 'classic'],
  'valid-invalid': ['Valid or Invalid XFER', 'valid-invalid'],
  'disposition-trainer': ['Dispose It', 'disposition-trainer'],
  eligible: ['Eligible or Not Eligible', 'eligible'],
  'objection-battle': ['Objection Battle', 'objection-battle'],
  certification: ['Certification Mode', 'certification'],
}
const hex = value => createHash('sha256').update(value).digest('hex')
function uuid(value) {
  const h = hex('pulse-go-question-bank-v1:' + value)
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`
}

export function buildPayload() {
  const groups = new Map()
  const ids = new Set()
  for (const q of source) {
    if (ids.has(q.id) || !modes[q.mode] || !['en', 'es'].includes(q.language) ||
        !['mc', 'binary'].includes(q.question_type) ||
        !Array.isArray(q.options) || ![2, 4].includes(q.options.length) ||
        !Number.isInteger(q.correct) || q.correct < 0 || q.correct >= q.options.length ||
        !q.question?.trim() || !q.explanation?.trim() ||
        (q.mode === 'classic' ? !['easy', 'medium', 'advanced'].includes(q.difficulty) : Boolean(q.difficulty))) {
      throw new Error('Invalid or duplicate legacy question: ' + q.id)
    }
    ids.add(q.id)
    const key = [q.mode, ...(q.difficulty ? [q.difficulty] : []), q.language].join('-')
    if (!groups.has(key)) groups.set(key, {
      contentId: uuid('content:' + key), key, mode: modes[q.mode][1],
      difficulty: q.difficulty || null, language: q.language,
      title: `GO Bank · ${modes[q.mode][0]}${q.difficulty ? ' · ' + q.difficulty[0].toUpperCase() + q.difficulty.slice(1) : ''} · ${q.language === 'en' ? 'English' : 'Español'}`,
      topicCode: q.mode === 'valid-invalid' ? 'transfers' : 'product_skills',
      questions: [],
    })
    groups.get(key).questions.push({ id: uuid('question:' + q.id), sourceId: q.id,
      position: groups.get(key).questions.length + 1, prompt: q.question,
      options: q.options, correct: q.correct, explanation: q.explanation })
  }
  const result = [...groups.values()].sort((a, b) => a.key.localeCompare(b.key))
  if (result.length !== 16 || ids.size !== 640 || result.some(g => g.questions.length !== 40)) {
    throw new Error('Expected exactly 16 groups of 40 distinct questions')
  }
  return result.map(g => ({ ...g, sourceIds: g.questions.map(q => q.sourceId),
    sourceSha256: hex(JSON.stringify(g.questions)) }))
}

export function buildPreviewSql(creatorEmail = 'simon@kampaignkings.com') {
  if (!['simon@kampaignkings.com', 'go-bank-test@example.test'].includes(creatorEmail)) {
    throw new Error('Only the existing Preview creator or isolated local fixture is allowed')
  }
  const payload = JSON.stringify(buildPayload())
  if (payload.includes('$go_bank_payload$')) throw new Error('Unexpected SQL delimiter in source')
  return `-- PULSE PREVIEW ONLY: sgshbawggqapuyqzkyhs. Never run against Dev or Production.
-- Imports only 16 unpublished, publication-blocked Studio drafts (640 questions).
begin;
do $go_bank_import$
declare
  source jsonb := $go_bank_payload$${payload}$go_bank_payload$::jsonb;
  bank jsonb;
  question jsonb;
  creator_id uuid;
  topic_id uuid;
  bank_content_id uuid;
  bank_question_id uuid;
  added integer;
begin
  select id into strict creator_id from public.users where lower(email)='${creatorEmail}';
  if jsonb_array_length(source) <> 16 then raise exception 'unexpected bank group count'; end if;
  for bank in select value from jsonb_array_elements(source) loop
    bank_content_id := (bank->>'contentId')::uuid;
    select id into strict topic_id from public.training_topics
      where code=bank->>'topicCode' and is_active;
    insert into public.training_content
      (id,content_type,title,description,language,status,created_by_user_id,authorship_kind)
    values (bank_content_id,'quiz',bank->>'title',
      'Legacy Pulse GO question bank for editorial review. Not approved for play.',
      bank->>'language','draft',creator_id,'pulse')
    on conflict (id) do nothing;
    get diagnostics added = row_count;
    if not exists (select 1 from public.training_content content
      where content.id=bank_content_id and content.status='draft' and content.content_type='quiz'
        and content.title=bank->>'title' and content.language=bank->>'language'
        and content.authorship_kind='pulse' and content.created_by_user_id=creator_id) then
      raise exception 'bank content differs: %', bank->>'key';
    end if;
    insert into public.training_content_audiences(content_id,scope_type)
      values (bank_content_id,'global') on conflict (content_id) do nothing;
    insert into public.training_content_topics(content_id,topic_id)
      values (bank_content_id,topic_id) on conflict do nothing;
    insert into public.go_question_bank_groups
      (content_id,source_group_key,source_sha256,game_mode,difficulty,source_ids)
    values (bank_content_id,bank->>'key',bank->>'sourceSha256',bank->>'mode',
      bank->>'difficulty',array(select jsonb_array_elements_text(bank->'sourceIds')))
    on conflict (content_id) do nothing;
    if not exists (select 1 from public.go_question_bank_groups grp
      where grp.content_id=bank_content_id and grp.source_group_key=bank->>'key'
        and grp.source_sha256=bank->>'sourceSha256' and grp.game_mode=bank->>'mode'
        and grp.difficulty is not distinct from bank->>'difficulty'
        and grp.source_ids=array(select jsonb_array_elements_text(bank->'sourceIds'))) then
      raise exception 'bank provenance differs: %', bank->>'key';
    end if;
    for question in select value from jsonb_array_elements(bank->'questions') loop
      bank_question_id := (question->>'id')::uuid;
      insert into public.training_questions
        (id,content_id,position,question_type,prompt,answer_options,correct_answer,explanation)
      values (bank_question_id,bank_content_id,(question->>'position')::integer,'multiple_choice',
        question->>'prompt',question->'options',to_jsonb((question->>'correct')::integer),
        question->>'explanation')
      on conflict (id) do nothing;
      if not exists (select 1 from public.training_questions stored
        where stored.id=bank_question_id and stored.content_id=bank_content_id
          and stored.position=(question->>'position')::integer
          and stored.question_type='multiple_choice' and stored.prompt=question->>'prompt'
          and stored.answer_options=question->'options'
          and stored.correct_answer=to_jsonb((question->>'correct')::integer)
          and stored.explanation=question->>'explanation') then
        raise exception 'question differs: %', question->>'sourceId';
      end if;
      insert into public.training_question_topics(question_id,topic_id)
        values (bank_question_id,topic_id) on conflict do nothing;
    end loop;
    if (select count(*) from public.training_questions q where q.content_id=bank_content_id) <> 40 or
       not exists (select 1 from public.training_content_audiences a
         where a.content_id=bank_content_id and a.scope_type='global') then
      raise exception 'bank group incomplete: %', bank->>'key';
    end if;
    if added=1 then
      insert into public.audit_events(actor_user_id,target_type,target_id,action,source,metadata)
      values (null,'training_content',bank_content_id,'training.question_bank_imported','operator',
        jsonb_build_object('source_group_key',bank->>'key','question_count',40,'environment','Pulse Preview'));
    end if;
  end loop;
end $go_bank_import$;
commit;
`
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const output = process.argv[2]
  if (!output) throw new Error('Provide a temporary output .sql path')
  const creatorEmail = process.argv[3] || 'simon@kampaignkings.com'
  writeFileSync(output, buildPreviewSql(creatorEmail), 'utf8')
  process.stdout.write('Generated 16 draft groups / 640 questions: ' + output + '\n')
}
