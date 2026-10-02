-- GO-3 Preview ONLY. Execute against sgshbawggqapuyqzkyhs after migration
-- 20261001000600. The ten exact UUIDs make accidental Production execution
-- fail before any mutation. This does not edit any authored question.
do $activation$
declare
  expected_ids uuid[] := array[
    '505ee690-d91d-549d-8d0f-871997e432fa', -- Valid EN
    '00c14d0a-af96-59f2-8fd1-0eadf7ef52e0', -- Valid ES
    '17b1a95e-df68-5923-8ab7-ec67e69681bf', -- Dispose EN
    '16c26f22-d397-5c69-88fc-85be3d5c711f', -- Dispose ES
    '963cdeb1-7449-513a-834b-db54d5f1bcee', -- Eligible EN
    '417134af-5599-51ba-89d8-b7657fc62b9a', -- Eligible ES
    '7e874c61-6204-51ad-8d80-abf2bc553bb3', -- Objection EN
    'ffc4cd80-b93e-5870-8406-3a9a71d140c7', -- Objection ES
    '193d6282-572e-572d-8ac0-6d33e20b46aa', -- Certification EN
    '49e1bd43-02f4-5157-8a3d-649976bd966d'  -- Certification ES
  ];
  bank record;
  creator_auth uuid;
  expected_options integer;
  new_title text;
  new_description text;
  published_count integer := 0;
begin
  if (select count(*) from public.go_question_bank_groups
    where content_id=any(expected_ids))<>10 then
    raise exception 'GO-3 Preview bank identity mismatch' using errcode='55000';
  end if;
  if exists(select 1 from public.go_certification_policy) then
    raise exception 'GO-3 Preview certification policy already configured' using errcode='55000';
  end if;
  for bank in
    select content.id,content.language,content.status,content.description,
      content.content_type,content.created_by_user_id,group_row.game_mode,
      group_row.reviewed_at,group_row.reviewed_content_updated_at,
      group_row.source_group_key
    from public.go_question_bank_groups group_row
    join public.training_content content on content.id=group_row.content_id
    where content.id=any(expected_ids)
    order by group_row.game_mode,content.language
    for update of content,group_row
  loop
    expected_options := case when bank.game_mode in ('valid-invalid','eligible') then 2 else 4 end;
    if bank.game_mode not in (
      'valid-invalid','disposition-trainer','eligible','objection-battle','certification'
    ) or bank.language not in ('en','es') or bank.status<>'draft' or
      bank.content_type<>'quiz' or bank.reviewed_at is not null or
      bank.reviewed_content_updated_at is not null or
      bank.description is distinct from
        'Legacy Pulse GO question bank for editorial review. Not approved for play.' or
      (select count(*) from public.training_questions question
        where question.content_id=bank.id)<>40 or
      exists(select 1 from public.training_questions question
        where question.content_id=bank.id and (
          question.question_type<>'multiple_choice' or
          jsonb_typeof(question.answer_options)<>'array' or
          jsonb_array_length(question.answer_options)<>expected_options or
          jsonb_typeof(question.correct_answer)<>'number' or
          (question.correct_answer #>> '{}')::integer not between 0 and expected_options-1 or
          nullif(btrim(question.explanation),'') is null
        )) then
      raise exception 'GO-3 Preview bank changed or incomplete: %',bank.source_group_key
        using errcode='55000';
    end if;
    select users.auth_user_id into creator_auth from public.users users
      where users.id=bank.created_by_user_id and users.status='active';
    if creator_auth is null then
      raise exception 'GO-3 Preview creator unavailable' using errcode='55000';
    end if;
    new_title := case bank.game_mode
      when 'valid-invalid' then case when bank.language='es' then 'Transferencia válida o inválida' else 'Valid or Invalid XFER' end
      when 'disposition-trainer' then case when bank.language='es' then 'Clasifica la llamada' else 'Dispose It' end
      when 'eligible' then case when bank.language='es' then 'Elegible o no elegible' else 'Eligible or Not Eligible' end
      when 'objection-battle' then case when bank.language='es' then 'Batalla de objeciones' else 'Objection Battle' end
      when 'certification' then case when bank.language='es' then 'Certificación' else 'Certification Mode' end
    end;
    new_description := case bank.language
      when 'es' then 'Ronda beta de Pulse GO con preguntas originales.'
      else 'Pulse GO beta round with original questions.' end;
    update public.training_content
      set title=new_title,description=new_description where id=bank.id;
    update public.go_question_bank_groups
      set reviewed_at=statement_timestamp(),
        reviewed_content_updated_at=(select updated_at from public.training_content where id=bank.id)
      where content_id=bank.id;
    perform set_config('request.jwt.claim.sub',creator_auth::text,true);
    perform public.publish_training_content(bank.id,
      (select updated_at from public.training_content where id=bank.id));
    insert into public.audit_events(actor_user_id,target_type,target_id,action,source,metadata)
      values(null,'training_content',bank.id,'training.go3_preview_beta_activated','operator',
        jsonb_build_object('game_mode',bank.game_mode,'language',bank.language,
          'review_scope','structural_only'));
    published_count := published_count+1;
  end loop;
  if published_count<>10 then
    raise exception 'GO-3 Preview expected exactly ten publications' using errcode='55000';
  end if;
  -- Preview-only provisional test setting, not a Kampaign Kings policy.
  insert into public.go_certification_policy(singleton,passing_percent)
    values(true,80);
  raise notice 'GO-3 Preview: % original banks activated, provisional Certification threshold 80%%',
    published_count;
end $activation$;
