import { createHash } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { validInvalidQuestions } from '../../src/go/questions/validInvalidQuestions.js'
import { disposeItQuestions } from '../../src/go/questions/disposeItQuestions.js'
import { eligibleQuestions } from '../../src/go/questions/eligibleQuestions.js'
import { objectionBattleQuestions } from '../../src/go/questions/objectionBattleQuestions.js'
import { certificationQuestions } from '../../src/go/questions/certificationQuestions.js'

// The source arrays were transcribed from Pulse Go Questions (2).docx.
// This builder emits a single guarded transaction; it never connects to a DB.
const sourceDocxSha256 = '1197ccf8ea2eae05ab55ee563f7baf858f6d54812bd205cd35daa3afefab941b'
const outputPath = process.argv[2]
if (!outputPath) throw new Error('Pass an output .sql path')

const definitions = [
  ['valid-invalid', validInvalidQuestions, 'Valid or Invalid XFER', 'Transferencia válida o inválida'],
  ['disposition-trainer', disposeItQuestions, 'Dispose It', 'Clasifica la llamada'],
  ['eligible', eligibleQuestions, 'Eligible or Not Eligible', 'Elegible o no elegible'],
  ['objection-battle', objectionBattleQuestions, 'Objection Battle', 'Batalla de objeciones'],
  ['certification', certificationQuestions, 'Certification Mode', 'Certificación'],
]

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

function deterministicUuid(key) {
  const bytes = createHash('sha256').update(`pulse-go3-production:${key}`).digest().subarray(0, 16)
  bytes[6] = (bytes[6] & 0x0f) | 0x50
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = bytes.toString('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

const seenIds = new Set()
const banks = []
for (const [mode, questions, titleEn, titleEs] of definitions) {
  for (const language of ['en', 'es']) {
    const selected = questions.filter((question) => question.language === language)
    if (selected.length !== 40) throw new Error(`${mode}/${language} has ${selected.length} questions, expected 40`)
    const optionCount = ['valid-invalid', 'eligible'].includes(mode) ? 2 : 4
    const normalized = selected.map((question, index) => {
      if (question.mode !== mode || seenIds.has(question.id)) throw new Error(`Unexpected or repeated source ID: ${question.id}`)
      seenIds.add(question.id)
      if (typeof question.question !== 'string' || question.question.trim().length < 2 || question.question.length > 2000) {
        throw new Error(`Invalid prompt: ${question.id}`)
      }
      if (!Array.isArray(question.options) || question.options.length !== optionCount || question.options.some((option) => typeof option !== 'string' || !option.trim())) {
        throw new Error(`Invalid options: ${question.id}`)
      }
      if (!Number.isInteger(question.correct) || question.correct < 0 || question.correct >= optionCount) {
        throw new Error(`Invalid answer: ${question.id}`)
      }
      if (typeof question.explanation !== 'string' || !question.explanation.trim() || question.explanation.length > 4000) {
        throw new Error(`Missing explanation: ${question.id}`)
      }
      return {
        id: question.id,
        position: index + 1,
        prompt: question.question,
        options: question.options,
        correct: question.correct,
        explanation: question.explanation,
      }
    })
    const key = `go3-${mode}-${language}`
    banks.push({
      id: deterministicUuid(key),
      key,
      sha256: sha256(JSON.stringify(normalized)),
      mode,
      language,
      title: language === 'es' ? titleEs : titleEn,
      description: language === 'es'
        ? 'Ronda beta de Pulse GO con preguntas originales.'
        : 'Pulse GO beta round with original questions.',
      questions: normalized,
    })
  }
}
if (banks.length !== 10 || seenIds.size !== 400) throw new Error('Expected exactly ten unique banks and 400 questions')

const payload = JSON.stringify(banks)
if (payload.includes('$go3_payload$')) throw new Error('Unexpected SQL delimiter in question content')
const sql = `-- GO-3 Production import. Source: Pulse Go Questions (2).docx
-- Source DOCX SHA-256: ${sourceDocxSha256}
-- Generated from validated, already-Preview-tested source arrays: 10 banks, 400 questions.
-- Must be run only after migration 20261001000600 in Pulse Dev / Production.
-- All writes are one transaction. Fails closed if the Production baseline differs.
begin;
do $go3_import$
declare
  banks jsonb := $go3_payload$${payload}$go3_payload$::jsonb;
  bank jsonb;
  question jsonb;
  v_content_id uuid;
  v_question_id uuid;
  v_topic_id uuid;
  v_creator_id uuid;
  v_creator_auth uuid;
  imported_count integer := 0;
begin
  if (select count(*) from public.go_question_bank_groups where game_mode='classic') <> 6
    or exists (select 1 from public.go_question_bank_groups where game_mode<>'classic')
    or exists (select 1 from public.go_certification_policy)
    or (select count(*) from supabase_migrations.schema_migrations where version='20261001000600') <> 1 then
    raise exception 'GO-3 Production baseline changed; import aborted' using errcode='55000';
  end if;
  if (select count(distinct c.created_by_user_id)
      from public.go_question_bank_groups g
      join public.training_content c on c.id=g.content_id
      where g.game_mode='classic') <> 1 then
    raise exception 'GO-3 Production Classic creator is ambiguous' using errcode='55000';
  end if;
  select c.created_by_user_id into v_creator_id
    from public.go_question_bank_groups g
    join public.training_content c on c.id=g.content_id
    where g.game_mode='classic' limit 1;
  select u.auth_user_id into v_creator_auth from public.users u
    where u.id=v_creator_id and u.status='active';
  select t.id into v_topic_id from public.training_topics t
    where t.code='product_skills' and t.is_active;
  if v_creator_auth is null or v_topic_id is null or jsonb_array_length(banks)<>10 then
    raise exception 'GO-3 Production creator, topic, or source unavailable' using errcode='55000';
  end if;

  for bank in select value from jsonb_array_elements(banks) loop
    v_content_id := (bank->>'id')::uuid;
    if exists (select 1 from public.training_content where id=v_content_id)
      or jsonb_array_length(bank->'questions')<>40 then
      raise exception 'GO-3 Production content identity/count mismatch: %',bank->>'key' using errcode='55000';
    end if;
    insert into public.training_content
      (id,content_type,title,description,language,status,created_by_user_id)
      values(v_content_id,'quiz',bank->>'title',bank->>'description',bank->>'language','draft',v_creator_id);
    insert into public.training_content_topics(content_id,topic_id) values(v_content_id,v_topic_id);
    insert into public.training_content_audiences(content_id,scope_type) values(v_content_id,'global');
    -- Original modes must be designated before publication. The published
    -- authorship setting is immutable and drives both catalog and access rules.
    perform set_config('request.jwt.claim.sub',v_creator_auth::text,true);
    perform public.mark_training_game_canonical(v_content_id);

    for question in select value from jsonb_array_elements(bank->'questions') loop
      insert into public.training_questions
        (content_id,position,question_type,prompt,answer_options,correct_answer,explanation)
        values(v_content_id,(question->>'position')::integer,'multiple_choice',
          question->>'prompt',question->'options',to_jsonb((question->>'correct')::integer),
          question->>'explanation') returning id into v_question_id;
      insert into public.training_question_topics(question_id,topic_id) values(v_question_id,v_topic_id);
      imported_count := imported_count+1;
    end loop;
    insert into public.go_question_bank_groups
      (content_id,source_group_key,source_sha256,game_mode,difficulty,source_ids)
      values(v_content_id,bank->>'key',bank->>'sha256',bank->>'mode',null,
        array(select item->>'id' from jsonb_array_elements(bank->'questions') item));
    update public.go_question_bank_groups g set
      reviewed_at=statement_timestamp(),
      reviewed_content_updated_at=(select c.updated_at from public.training_content c where c.id=v_content_id)
      where g.content_id=v_content_id;
    perform set_config('request.jwt.claim.sub',v_creator_auth::text,true);
    perform public.publish_training_content(v_content_id,
      (select c.updated_at from public.training_content c where c.id=v_content_id));
    insert into public.audit_events(actor_user_id,target_type,target_id,action,source,metadata)
      values(null,'training_content',v_content_id,'training.go3_production_beta_activated',
        'operator',jsonb_build_object('game_mode',bank->>'mode','language',bank->>'language',
          'review_scope','structural_only'));
  end loop;
  if imported_count<>400 or
    (select count(*) from public.go_question_bank_groups where game_mode<>'classic')<>10 then
    raise exception 'GO-3 Production import incomplete' using errcode='55000';
  end if;
  insert into public.go_certification_policy(singleton,passing_percent) values(true,80);
  raise notice 'GO-3 Production: 10 beta banks, 400 questions, Certification threshold 80%%';
end $go3_import$;
commit;
`
await writeFile(resolve(outputPath), sql, 'utf8')
console.log(`Generated ${banks.length} banks / ${seenIds.size} questions; SQL SHA-256 ${sha256(sql)}`)
