-- The GO-3 Production import published ten original banks as staff games.
-- Repair only those exact, reviewed imports. Preview has different IDs and is
-- intentionally a no-op. No questions, attempts, sessions or versions change.
begin;

lock table public.training_content in access exclusive mode;

do $go4_repair$
declare
  expected jsonb := '[
    {"id":"46ea55fe-2cbb-5572-bcf8-3e8307977411","key":"go3-valid-invalid-en","sha":"efa9bfeecdeac406cf59140eafe72ad031d7b75a899fe0aa9bec60db1a99e4fe","mode":"valid-invalid","language":"en"},
    {"id":"93ef84b1-31cd-5d57-b8d5-85123cf8a654","key":"go3-valid-invalid-es","sha":"fa5ac3bdf3b9246d03bfb0ca5f051e857b5edcfc0748b68e41a218c9faf75ee2","mode":"valid-invalid","language":"es"},
    {"id":"321d4245-0c31-5e28-9506-792e99342ef3","key":"go3-disposition-trainer-en","sha":"f9f43000966aab85aeb469d29bb067984739b630e97bfe9578e43f7c9901fae5","mode":"disposition-trainer","language":"en"},
    {"id":"5f7b80b5-d1d9-5efa-9c0c-1fec7edbafe5","key":"go3-disposition-trainer-es","sha":"c163f36914a32b41dccb0887916388fafa7eeb4c74e3e2189e37c495a2499f85","mode":"disposition-trainer","language":"es"},
    {"id":"4271fcc5-28a7-5dd8-acf7-13f7fcfb0953","key":"go3-eligible-en","sha":"cecbe165fc3b7bda6313ba4815353f9cbc29fd544e1454f124d86bd673d55ea3","mode":"eligible","language":"en"},
    {"id":"a9bbe9a9-b798-55d5-8b05-d59b48577255","key":"go3-eligible-es","sha":"b4cf66775f42719b83280c96636b65ce6a9d299327ccc60cce0ded7e11889b40","mode":"eligible","language":"es"},
    {"id":"b72863b2-e071-5fca-8906-7af694c6dc11","key":"go3-objection-battle-en","sha":"695e26a3179da6daf6a9effa5ed9f17ffbe710a56691ef5fff55d0dc3585202b","mode":"objection-battle","language":"en"},
    {"id":"530051ef-d3fb-57ee-8944-b3e44632356f","key":"go3-objection-battle-es","sha":"66709932dacf2987b40877ec8958e026d7c829253b6164293a2cec528edfb984","mode":"objection-battle","language":"es"},
    {"id":"d79c99fb-cf24-5cfd-8e44-0fea98b8b456","key":"go3-certification-en","sha":"3cce65ba6acddcaa4b41a90d42e0841ce84b753b577435f0cd1498e210168638","mode":"certification","language":"en"},
    {"id":"5f052ed6-c6c8-5908-9043-f368b5525bc5","key":"go3-certification-es","sha":"0a32042cffc9573562e4e321ac40b091d01e80cafe9f7c41a4c98c314411eefd","mode":"certification","language":"es"}
  ]'::jsonb;
  found_count integer;
  staff_count integer;
  entry record;
begin
  select count(*) into found_count
    from public.training_content content
    where content.id in (select (value->>'id')::uuid from jsonb_array_elements(expected));
  if found_count = 0 then
    raise notice 'GO-4 original authorship repair: no Production import IDs here';
    return;
  end if;
  if found_count <> 10 then
    raise exception 'GO-3 original bank identity set is incomplete' using errcode='55000';
  end if;

  for entry in select * from jsonb_to_recordset(expected)
      as x(id uuid, key text, sha text, mode text, language text)
  loop
    if not exists (
      select 1 from public.training_content content
      join public.go_question_bank_groups bank on bank.content_id=content.id
      where content.id=entry.id and content.status='published' and content.is_current
        and content.version_number=1 and content.content_type='quiz'
        and content.authorship_kind in ('staff','pulse')
        and content.language=entry.language
        and bank.source_group_key=entry.key and bank.source_sha256=entry.sha
        and bank.game_mode=entry.mode and bank.difficulty is null
        and bank.reviewed_at is not null and cardinality(bank.source_ids)=40
        and (select count(*) from public.training_questions question
          where question.content_id=content.id)=40
        and not exists (select 1 from public.training_content revision
          where revision.game_id=content.game_id and revision.version_number>1)
    ) then
      raise exception 'GO-3 original bank changed: %',entry.key using errcode='55000';
    end if;
  end loop;

  select count(*) into staff_count from public.training_content content
    where content.id in (select (value->>'id')::uuid from jsonb_array_elements(expected))
      and content.authorship_kind='staff';
  if staff_count = 0 then
    raise notice 'GO-4 original authorship repair: already canonical';
    return;
  end if;
  if staff_count <> 10 then
    raise exception 'GO-3 original authorship is mixed; repair aborted' using errcode='55000';
  end if;

  -- A migration-only, transaction-scoped exception to the published-settings
  -- trigger. The trigger is restored before commit; browser roles never gain a
  -- way to reclassify published content.
  alter table public.training_content disable trigger training_content_protect_go2_settings;
  update public.training_content content set authorship_kind='pulse'
    where content.id in (select (value->>'id')::uuid from jsonb_array_elements(expected));
  alter table public.training_content enable trigger training_content_protect_go2_settings;

  if (select count(*) from public.training_content content
      where content.id in (select (value->>'id')::uuid from jsonb_array_elements(expected))
        and content.authorship_kind='pulse') <> 10
    or not exists (select 1 from pg_catalog.pg_trigger trigger
      where trigger.tgrelid='public.training_content'::regclass
        and trigger.tgname='training_content_protect_go2_settings'
        and trigger.tgenabled='O') then
    raise exception 'GO-3 original authorship repair did not complete' using errcode='55000';
  end if;

  for entry in select * from jsonb_to_recordset(expected)
      as x(id uuid, key text, sha text, mode text, language text)
  loop
    insert into public.audit_events(actor_user_id,target_type,target_id,action,source,metadata)
      values(null,'training_content',entry.id,'training.go3_authorship_corrected',
        'operator',jsonb_build_object('from','staff','to','pulse',
          'source_group_key',entry.key,'source_sha256',entry.sha));
  end loop;
  raise notice 'GO-4 original authorship repair: ten reviewed banks corrected';
end $go4_repair$;

commit;
