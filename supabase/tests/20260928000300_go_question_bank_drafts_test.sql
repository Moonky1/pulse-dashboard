begin;
create extension if not exists pgtap with schema extensions;
set local role postgres;
select set_config('search_path','extensions,public',true);
select extensions.plan(7);

select extensions.has_table('public','go_question_bank_groups','GO question bank is server-owned');
select extensions.ok(not has_table_privilege('authenticated','public.go_question_bank_groups','SELECT'),
  'browser cannot read group provenance directly');
select extensions.ok(not has_table_privilege('authenticated','public.go_question_bank_groups','INSERT'),
  'browser cannot create bank classification');
select extensions.ok(not has_function_privilege('anon','public.get_go_question_bank_groups(uuid[])','EXECUTE'),
  'anonymous users cannot list bank groups');
select extensions.ok(has_function_privilege('authenticated','public.get_go_question_bank_groups(uuid[])','EXECUTE'),
  'authenticated Studio can call the bounded lookup');

insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,
  raw_app_meta_data,raw_user_meta_data,confirmation_token,recovery_token,
  email_change_token_new,email_change,created_at,updated_at)
values ('a2830000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000',
  'authenticated','authenticated','go-bank-guard@example.test','',now(),'{}','{}','','','','',now(),now());
insert into public.users(id,auth_user_id,email,full_name,status)
values ('b2830000-0000-4000-8000-000000000001','a2830000-0000-4000-8000-000000000001',
  'go-bank-guard@example.test','GO Bank Guard','pending_approval');
insert into public.training_content(id,content_type,title,language,created_by_user_id)
values ('d2830000-0000-4000-8000-000000000001','quiz','Bank Guard Test','en',
  'b2830000-0000-4000-8000-000000000001');
insert into public.training_topics(id,code,name,is_active)
values ('92830000-0000-4000-8000-000000000001','bank_guard_test','Bank Guard Topic',true);
insert into public.training_content_topics(content_id,topic_id)
values ('d2830000-0000-4000-8000-000000000001','92830000-0000-4000-8000-000000000001');
insert into public.training_content_audiences(content_id,scope_type)
values ('d2830000-0000-4000-8000-000000000001','global');
insert into public.training_questions(id,content_id,position,question_type,prompt,
  answer_options,correct_answer)
values ('e2830000-0000-4000-8000-000000000001',
  'd2830000-0000-4000-8000-000000000001',1,'multiple_choice','Guarded question?',
  '["Yes","No"]'::jsonb,'0'::jsonb);
insert into public.training_question_topics(question_id,topic_id)
values ('e2830000-0000-4000-8000-000000000001','92830000-0000-4000-8000-000000000001');
insert into public.go_question_bank_groups(content_id,source_group_key,source_sha256,
  game_mode,difficulty,source_ids)
values ('d2830000-0000-4000-8000-000000000001','guard-classic-easy-en',repeat('a',64),
  'classic','easy',array(select 'source-'||n from generate_series(1,40) n));

select extensions.throws_ok($$update public.training_content set status='published'
  where id='d2830000-0000-4000-8000-000000000001'$$,
  '55000',null,'bank drafts cannot be published without a later review checkpoint');
select extensions.throws_ok($$update public.go_question_bank_groups set game_mode='unsupported'
  where content_id='d2830000-0000-4000-8000-000000000001'$$,
  '23514',null,'unsupported mode is rejected by the database');

select * from extensions.finish();
rollback;
