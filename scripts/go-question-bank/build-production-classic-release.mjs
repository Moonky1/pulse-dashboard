import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { buildPayload } from './build-preview-import.mjs'

const classic = buildPayload().filter(group => group.mode === 'classic')
if (classic.length !== 6 || classic.some(group => group.questions.length !== 40)) {
  throw new Error('Expected exactly six Classic levels with forty questions each')
}

export function buildProductionClassicReleaseSql() {
  const payload = JSON.stringify(classic)
  if (payload.includes('$classic_production_payload$')) throw new Error('Unexpected SQL delimiter')
  return `-- Pulse Dev is the live backend for www.pulse-kk.com as of 2026-09-29.
-- Operator-only, one-time release: six Classic levels / 240 questions.
-- Requires migrations through 20260929000300. Never run in Pulse Preview.
begin;
do $classic_production_release$
declare
  source jsonb := $classic_production_payload$${payload}$classic_production_payload$::jsonb;
  bank jsonb;
  question jsonb;
  creator_id uuid;
  topic_id uuid;
  release_content_id uuid;
  content_row public.training_content%rowtype;
  level_title text;
  level_description text;
  released integer := 0;
begin
  select id into strict creator_id from public.users
    where lower(email)='simon@kampaignkings.com' and status='active';
  select id into topic_id from public.training_topics
    where code='product_skills' and is_active for update;
  if topic_id is null then
    if exists (select 1 from public.training_topics where code='product_skills') then
      raise exception 'Product Skills topic is inactive';
    end if;
    insert into public.training_topics(code,name,description)
      values('product_skills','Product Skills','Pulse GO training fundamentals')
      returning id into topic_id;
  end if;
  if jsonb_array_length(source) <> 6 then raise exception 'unexpected Classic level count'; end if;
  for bank in select value from jsonb_array_elements(source) loop
    if bank->>'mode' <> 'classic' or bank->>'language' not in ('en','es') or
      bank->>'difficulty' not in ('easy','medium','advanced') or
      jsonb_array_length(bank->'questions') <> 40 then
      raise exception 'invalid Classic level: %', bank->>'key';
    end if;
    release_content_id := (bank->>'contentId')::uuid;
    if exists (select 1 from public.training_content where id=release_content_id) then
      raise exception 'Classic content identity already exists: %', bank->>'key';
    end if;
    level_title := 'Classic Quiz · ' || case bank->>'difficulty'
      when 'easy' then case when bank->>'language'='es' then 'Fácil' else 'Easy' end
      when 'medium' then case when bank->>'language'='es' then 'Medio' else 'Medium' end
      when 'advanced' then case when bank->>'language'='es' then 'Avanzado' else 'Advanced' end
    end;
    level_description := case when bank->>'language'='es'
      then '40 preguntas del banco Classic de Pulse GO.'
      else '40 questions from the Pulse GO Classic bank.' end;
    insert into public.training_content
      (id,content_type,title,description,language,status,created_by_user_id,authorship_kind)
    values (release_content_id,'quiz',level_title,level_description,bank->>'language',
      'draft',creator_id,'pulse') returning * into content_row;
    insert into public.training_content_audiences(content_id,scope_type)
      values(release_content_id,'global');
    insert into public.training_content_topics(content_id,topic_id)
      values(release_content_id,topic_id);
    insert into public.go_question_bank_groups
      (content_id,source_group_key,source_sha256,game_mode,difficulty,source_ids)
    values(release_content_id,bank->>'key',bank->>'sourceSha256','classic',
      bank->>'difficulty',array(select jsonb_array_elements_text(bank->'sourceIds')));
    for question in select value from jsonb_array_elements(bank->'questions') loop
      insert into public.training_questions
        (id,content_id,position,question_type,prompt,answer_options,correct_answer,explanation)
      values ((question->>'id')::uuid,release_content_id,(question->>'position')::integer,
        'multiple_choice',question->>'prompt',question->'options',
        to_jsonb((question->>'correct')::integer),question->>'explanation');
      insert into public.training_question_topics(question_id,topic_id)
        values((question->>'id')::uuid,topic_id);
    end loop;
    if (select count(*) from public.training_questions where training_questions.content_id=release_content_id) <> 40 or
      (select count(distinct position) from public.training_questions
        where training_questions.content_id=release_content_id) <> 40 then
      raise exception 'Classic level incomplete: %', bank->>'key';
    end if;
    update public.go_question_bank_groups
      set reviewed_at=clock_timestamp(),reviewed_content_updated_at=content_row.updated_at
      where go_question_bank_groups.content_id=release_content_id;
    update public.training_content set status='published'
      where training_content.id=release_content_id;
    if not exists (select 1 from public.training_content
      where id=release_content_id and status='published' and is_current) then
      raise exception 'Classic level did not publish: %', bank->>'key';
    end if;
    insert into public.audit_events(actor_user_id,target_type,target_id,action,source,metadata)
      values(null,'training_content',release_content_id,'training.question_bank_published','operator',
        jsonb_build_object('environment','Pulse Dev / Production',
          'source_group_key',bank->>'key','source_sha256',bank->>'sourceSha256',
          'question_count',40));
    released := released+1;
  end loop;
  if released <> 6 then raise exception 'not all Classic levels were released'; end if;
end $classic_production_release$;
commit;
`
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const output = process.argv[2]
  if (!output) throw new Error('Provide a temporary output .sql path')
  writeFileSync(output, buildProductionClassicReleaseSql(), 'utf8')
  process.stdout.write('Generated one-time Classic Production SQL for 6 levels / 240 questions\n')
}
