import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { buildPayload } from './build-preview-import.mjs'

const classic = buildPayload().filter(group => group.mode === 'classic')
if (classic.length !== 6 || classic.some(group => group.questions.length !== 40)) {
  throw new Error('Expected six Classic groups of forty questions')
}

export function buildPreviewClassicReviewSql() {
  const payload = JSON.stringify(classic)
  if (payload.includes('$classic_review_payload$')) throw new Error('Unexpected SQL delimiter')
  return `-- PULSE PREVIEW ONLY: sgshbawggqapuyqzkyhs. Never run against Dev or Production.
-- Verify the six supplied Classic banks byte-for-byte, mark reviewed, but do NOT publish.
begin;
do $classic_review$
declare
  source jsonb := $classic_review_payload$${payload}$classic_review_payload$::jsonb;
  item jsonb;
  question jsonb;
  content_row public.training_content%rowtype;
  bank_row public.go_question_bank_groups%rowtype;
  expected_title text;
  seen integer;
begin
  if jsonb_array_length(source) <> 6 then raise exception 'unexpected Classic group count'; end if;
  for item in select value from jsonb_array_elements(source) loop
    select * into strict content_row from public.training_content
      where id=(item->>'contentId')::uuid for update;
    select * into strict bank_row from public.go_question_bank_groups
      where content_id=content_row.id for update;
    if content_row.status <> 'draft' or content_row.authorship_kind <> 'pulse' or
      content_row.content_type <> 'quiz' or content_row.language <> item->>'language' or
      bank_row.game_mode <> 'classic' or bank_row.difficulty <> item->>'difficulty' or
      bank_row.source_group_key <> item->>'key' or
      bank_row.source_sha256 <> item->>'sourceSha256' or
      bank_row.source_ids <> array(select jsonb_array_elements_text(item->'sourceIds')) then
      raise exception 'Classic draft differs: %', item->>'key';
    end if;
    if (select count(*) from public.training_questions where content_id=content_row.id) <> 40 or
       not exists (select 1 from public.training_content_audiences
         where content_id=content_row.id and scope_type='global') then
      raise exception 'Classic draft incomplete: %', item->>'key';
    end if;
    for question in select value from jsonb_array_elements(item->'questions') loop
      if not exists (select 1 from public.training_questions stored
        where stored.id=(question->>'id')::uuid and stored.content_id=content_row.id
          and stored.position=(question->>'position')::integer
          and stored.question_type='multiple_choice'
          and stored.prompt=question->>'prompt'
          and stored.answer_options=question->'options'
          and stored.correct_answer=to_jsonb((question->>'correct')::integer)
          and stored.explanation=question->>'explanation'
          and exists (select 1 from public.training_question_topics qt
            join public.training_content_topics ct on ct.topic_id=qt.topic_id
            where qt.question_id=stored.id and ct.content_id=content_row.id)) then
        raise exception 'Classic question differs: %', question->>'sourceId';
      end if;
    end loop;
    expected_title := 'Classic Quiz · ' || initcap(item->>'difficulty');
    if content_row.title is distinct from expected_title or
       content_row.description is distinct from
         'Preview beta · 10 questions per hosted game from a 40-question level bank.' then
      update public.training_content set title=expected_title,
        description='Preview beta · 10 questions per hosted game from a 40-question level bank.',
        updated_at=clock_timestamp() where id=content_row.id returning * into content_row;
    end if;
    if bank_row.reviewed_at is null or
       bank_row.reviewed_content_updated_at is distinct from content_row.updated_at then
      update public.go_question_bank_groups
        set reviewed_at=clock_timestamp(), reviewed_content_updated_at=content_row.updated_at
        where content_id=content_row.id;
      insert into public.audit_events(actor_user_id,target_type,target_id,action,source,metadata)
        values (null,'training_content',content_row.id,'training.question_bank_reviewed',
          'operator',jsonb_build_object('environment','Pulse Preview',
            'mode','classic','source_sha256',bank_row.source_sha256,'question_count',40));
    end if;
    seen := coalesce(seen,0)+1;
  end loop;
  if seen <> 6 then raise exception 'not all Classic groups were reviewed'; end if;
end $classic_review$;
commit;
`
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const output = process.argv[2]
  if (!output) throw new Error('Provide a temporary output .sql path')
  writeFileSync(output, buildPreviewClassicReviewSql(), 'utf8')
  process.stdout.write('Generated review for six Classic groups: ' + output + '\n')
}
