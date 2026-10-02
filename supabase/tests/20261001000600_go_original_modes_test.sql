-- Rollback-only GO-3 integration test. All identities and content are fictional.
begin;

insert into public.departments(id,code,name,is_active) values
  ('da630000-0000-4000-8000-000000000001','go3_test_ops','GO-3 Test Operations',true);
insert into public.campaigns(id,code,name,is_active) values
  ('ca630000-0000-4000-8000-000000000001','go3_test_campaign','GO-3 Test Campaign',true);
insert into public.teams(id,department_id,campaign_id,code,name,is_active) values
  ('ea630000-0000-4000-8000-000000000001','da630000-0000-4000-8000-000000000001',
    'ca630000-0000-4000-8000-000000000001','go3_test_team','GO-3 Test Team',true);
insert into public.roles(id,key,name,is_active) values
  ('8a630000-0000-4000-8000-000000000001','go3_test_role','GO-3 Test Role',true);
insert into public.role_scopes(role_id,scope_type) values
  ('8a630000-0000-4000-8000-000000000001','global');
insert into public.role_permissions(role_id,permission_id)
  select '8a630000-0000-4000-8000-000000000001',id from public.permissions
  where key in ('go.host','go.play','studio.view','studio.create','studio.publish');
insert into auth.users(
  id,aud,role,email,encrypted_password,email_confirmed_at,
  raw_app_meta_data,raw_user_meta_data,created_at,updated_at
) values
  ('aa630000-0000-4000-8000-000000000001','authenticated','authenticated',
    'go3.host@example.test','',now(),'{}','{}',now(),now()),
  ('aa630000-0000-4000-8000-000000000002','authenticated','authenticated',
    'go3.player@example.test','',now(),'{}','{}',now(),now());
insert into public.users(
  id,auth_user_id,employee_id,email,full_name,display_name,status,
  department_id,team_id,approved_at
) values
  ('ba630000-0000-4000-8000-000000000001','aa630000-0000-4000-8000-000000000001',
    'KK-986301','go3.host@example.test','Fictional GO-3 Host','Fictional Host','active',
    'da630000-0000-4000-8000-000000000001','ea630000-0000-4000-8000-000000000001',now()),
  ('ba630000-0000-4000-8000-000000000002','aa630000-0000-4000-8000-000000000002',
    'KK-986302','go3.player@example.test','Fictional GO-3 Player','Fictional Player','active',
    'da630000-0000-4000-8000-000000000001','ea630000-0000-4000-8000-000000000001',now());
insert into public.user_roles(id,user_id,role_id,scope_type) values
  ('fa630000-0000-4000-8000-000000000001','ba630000-0000-4000-8000-000000000001',
    '8a630000-0000-4000-8000-000000000001','global'),
  ('fa630000-0000-4000-8000-000000000002','ba630000-0000-4000-8000-000000000002',
    '8a630000-0000-4000-8000-000000000001','global');
insert into public.training_topics(id,code,name,is_active) values
  ('2a630000-0000-4000-8000-000000000001','go3_test_topic','GO-3 Test Topic',true);

create temporary table go3_fixture(mode text,language text,content_id uuid,primary key(mode,language));
select set_config('request.jwt.claim.sub','aa630000-0000-4000-8000-000000000001',true);

do $test$
declare
  mode_name text;
  lang text;
  v_content_id uuid;
  options jsonb;
  room jsonb;
  player_room jsonb;
  practice_id uuid;
  resumed_id uuid;
  v_question_id uuid;
  response jsonb;
  review jsonb;
  certificate jsonb;
  n integer;
  bank_count integer := 0;
  practice_count integer := 0;
  hosted_count integer := 0;
begin
  for mode_name in select unnest(array[
    'valid-invalid','disposition-trainer','eligible','objection-battle','certification'
  ]) loop
    for lang in select unnest(array['en','es']) loop
      select id into v_content_id from public.create_training_content_draft(
        'quiz','GO-3 ' || mode_name || ' ' || lang,'Fictional local-only test',lang,
        array['2a630000-0000-4000-8000-000000000001'::uuid],
        'global',null,null,'{}'::uuid[]
      );
      insert into go3_fixture values(mode_name,lang,v_content_id);
      options := case when mode_name in ('valid-invalid','eligible') then
        jsonb_build_array('Valid','Invalid')
      else jsonb_build_array('First','Second','Third','Fourth') end;
      perform public.replace_training_questions_v2(
        v_content_id,
        (select jsonb_agg(jsonb_build_object(
          'position',number,'question_type','multiple_choice',
          'prompt','Fictional ' || mode_name || ' question ' || number,
          'answer_options',options,'correct_answer',0,
          'explanation','Fictional explanation ' || number,
          'time_limit_seconds',30,
          'topic_ids',jsonb_build_array('2a630000-0000-4000-8000-000000000001')
        ) order by number) from generate_series(1,40) number),
        (select updated_at from public.training_content where id=v_content_id)
      );
      insert into public.go_question_bank_groups(
        content_id,source_group_key,source_sha256,game_mode,difficulty,source_ids
      ) values (
        v_content_id,'go3-local-' || mode_name || '-' || lang,repeat('a',64),
        mode_name,null,array(select 'fictional-' || number from generate_series(1,40) number)
      );
      if bank_count=0 then
        begin
          perform public.publish_training_content(v_content_id,
            (select updated_at from public.training_content where id=v_content_id));
          raise exception 'unreviewed GO mode published';
        exception when sqlstate '55000' then null; end;
      end if;
      update public.go_question_bank_groups
        set reviewed_at=now(),reviewed_content_updated_at=(
          select updated_at from public.training_content where id=v_content_id)
        where content_id=v_content_id;
      perform public.publish_training_content(v_content_id,
        (select updated_at from public.training_content where id=v_content_id));
      bank_count := bank_count+1;
    end loop;
  end loop;
  if bank_count<>10 then raise exception 'not all ten local banks published'; end if;

  -- No threshold exists until explicitly configured for Preview.
  select fixture.content_id into v_content_id from go3_fixture fixture
  where fixture.mode='certification' and fixture.language='en';
  begin
    perform public.start_training_attempt(v_content_id,'go_practice');
    raise exception 'Certification started without a configured threshold';
  exception when sqlstate '55000' then null; end;
  insert into public.go_certification_policy(singleton,passing_percent) values(true,80);

  for mode_name in select unnest(array[
    'valid-invalid','disposition-trainer','eligible','objection-battle','certification'
  ]) loop
    for lang in select unnest(array['en','es']) loop
      select fixture.content_id into v_content_id from go3_fixture fixture
      where fixture.mode=mode_name and fixture.language=lang;
      if (select count(*) from public.list_go_practice_catalog_v2(lang,null,100,0)
        where id=v_content_id)<>1 then raise exception 'Practice catalog omitted % %',mode_name,lang; end if;
      select attempt_id into practice_id from public.start_training_attempt(v_content_id,'go_practice');
      select attempt_id into resumed_id from public.start_training_attempt(v_content_id,'go_practice');
      if mode_name='certification' then
        begin
          perform public.get_go_certification_result(practice_id);
          raise exception 'Certification result exposed before completion';
        exception when sqlstate 'P0002' then null; end;
      end if;
      if practice_id<>resumed_id or
        (select count(distinct selected.question_id) from public.go_practice_round_questions selected
          where selected.attempt_id=practice_id)<>10 then
        raise exception 'Practice round not pinned to ten distinct questions: % %',mode_name,lang;
      end if;
      for n in 1..10 loop
        select selected.question_id into v_question_id from public.go_practice_round_questions selected
        where selected.attempt_id=practice_id and selected.round_position=n;
        response := public.submit_go_practice_answer(practice_id,v_question_id,'0'::jsonb);
        if n<10 and (response ? 'is_correct' or response ? 'correct_answer' or
          response ? 'score_percent') then
          raise exception 'Practice response leaked scoring during the round';
        end if;
      end loop;
      if response->>'completed'<>'true' or
        (response->'result'->>'correct_answers')::integer<>10 then
        raise exception 'Practice scoring failed for % %',mode_name,lang;
      end if;
      if mode_name='certification' then
        begin
          perform public.get_go_practice_completed_review(practice_id);
          raise exception 'Certification answer key exposed';
        exception when sqlstate 'P0002' then null; end;
        certificate := public.get_go_certification_result(practice_id);
        if certificate->>'passed'<>'true' then raise exception 'Certification pass failed'; end if;
      else
        review := public.get_go_practice_completed_review(practice_id);
        if jsonb_array_length(review->'questions')<>10 or
          review->'questions'->0->>'explanation' is null then
          raise exception 'Practice review failed for % %',mode_name,lang;
        end if;
      end if;
      practice_count := practice_count+1;
      begin
        perform public.submit_go_practice_answer(practice_id,v_question_id,'0'::jsonb);
        raise exception 'final answer could be submitted twice';
      exception when sqlstate '55000' then null; end;

      if mode_name='certification' then
        begin
          perform public.create_go_hosted_session(v_content_id);
          raise exception 'Hosted Certification unexpectedly created';
        exception when sqlstate '55000' then null; end;
      else
        if (select count(*) from public.list_go_host_catalog_v2(lang,100,0)
          where id=v_content_id)<>1 then raise exception 'Host catalog omitted % %',mode_name,lang; end if;
        room := public.create_go_hosted_session(v_content_id);
        perform set_config('request.jwt.claim.sub','aa630000-0000-4000-8000-000000000002',true);
        player_room := public.join_go_hosted_session(room->>'room_code');
        if player_room->>'viewer_role'<>'participant' then raise exception 'player did not join'; end if;
        perform set_config('request.jwt.claim.sub','aa630000-0000-4000-8000-000000000001',true);
        room := public.get_go_hosted_session((room->>'session_id')::uuid);
        room := public.start_go_hosted_session((room->>'session_id')::uuid,(room->>'version')::integer);
        for n in 1..10 loop
          perform set_config('request.jwt.claim.sub','aa630000-0000-4000-8000-000000000002',true);
          player_room := public.get_go_hosted_session((room->>'session_id')::uuid);
          perform public.submit_go_hosted_answer(
            (room->>'session_id')::uuid,(player_room->'current_question'->>'id')::uuid,
            '0'::jsonb,n
          );
          perform set_config('request.jwt.claim.sub','aa630000-0000-4000-8000-000000000001',true);
          room := public.get_go_hosted_session((room->>'session_id')::uuid);
          room := public.advance_go_hosted_session((room->>'session_id')::uuid,(room->>'version')::integer);
        end loop;
        if room->>'status'<>'completed' then raise exception 'hosted round did not complete'; end if;
        hosted_count := hosted_count+1;
      end if;
    end loop;
  end loop;

  -- Policy changes do not retroactively alter a started Certification attempt.
  select fixture.content_id into v_content_id from go3_fixture fixture
  where fixture.mode='certification' and fixture.language='en';
  select attempt_id into practice_id from public.start_training_attempt(v_content_id,'go_practice');
  update public.go_certification_policy set passing_percent=90 where singleton;
  for n in 1..10 loop
    select selected.question_id into v_question_id from public.go_practice_round_questions selected
    where selected.attempt_id=practice_id and selected.round_position=n;
    response := public.submit_go_practice_answer(practice_id,v_question_id,
      case when n<=8 then '0'::jsonb else '1'::jsonb end);
  end loop;
  certificate := public.get_go_certification_result(practice_id);
  if certificate->>'passed'<>'true' or (certificate->>'score_percent')::numeric<>80 then
    raise exception 'Certification threshold changed after attempt start';
  end if;

  -- A fresh Certification run with deliberately wrong answers does not pass.
  select fixture.content_id into v_content_id from go3_fixture fixture
  where fixture.mode='certification' and fixture.language='en';
  select attempt_id into practice_id from public.start_training_attempt(v_content_id,'go_practice');
  for n in 1..10 loop
    select selected.question_id into v_question_id from public.go_practice_round_questions selected
    where selected.attempt_id=practice_id and selected.round_position=n;
    response := public.submit_go_practice_answer(practice_id,v_question_id,'1'::jsonb);
  end loop;
  certificate := public.get_go_certification_result(practice_id);
  if certificate->>'passed'<>'false' or (certificate->>'score_percent')::numeric<>0 then
    raise exception 'Certification non-pass failed';
  end if;
  perform set_config('request.jwt.claim.sub','aa630000-0000-4000-8000-000000000002',true);
  begin
    perform public.get_go_certification_result(practice_id);
    raise exception 'another Staff member read Certification result';
  exception when sqlstate 'P0002' then null; end;
  raise notice 'GO-3 local: % banks, % Practice, % Hosted, pass/non-pass and access checks',
    bank_count,practice_count,hosted_count;
end
$test$;

rollback;
