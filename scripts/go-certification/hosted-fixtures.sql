-- Fictitious disposable GO-1B browser data. Never apply remotely.
do $block$
begin
  if exists(select 1 from auth.users) then
    raise exception 'GO-1B fixture requires an empty disposable Auth store';
  end if;
end
$block$;

insert into public.departments(id,code,name,is_active)
values ('db200000-0000-4000-8000-000000000001','go1b_browser','GO-1B Browser',true);
insert into public.roles(id,key,name,is_active) values
 ('8b200000-0000-4000-8000-000000000001','go1b_browser_host','Fictitious Host',true),
 ('8b200000-0000-4000-8000-000000000002','go1b_browser_player','Fictitious Player',true);
insert into public.role_scopes(role_id,scope_type) values
 ('8b200000-0000-4000-8000-000000000001','global'),
 ('8b200000-0000-4000-8000-000000000002','global');
insert into public.role_permissions(role_id,permission_id)
select '8b200000-0000-4000-8000-000000000001',id from public.permissions
where key in ('go.host','studio.view','studio.create','studio.publish');
insert into public.role_permissions(role_id,permission_id)
select '8b200000-0000-4000-8000-000000000002',id from public.permissions where key='go.play';

insert into auth.users(
  id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,
  raw_app_meta_data,raw_user_meta_data,confirmation_token,recovery_token,
  email_change_token_new,email_change,created_at,updated_at
) values
 ('ab200000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','go1b.host@example.test','',now(),'{"provider":"email","providers":["email"]}','{}','','','','',now(),now()),
 ('ab200000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','go1b.player1@example.test','',now(),'{"provider":"email","providers":["email"]}','{}','','','','',now(),now()),
 ('ab200000-0000-4000-8000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','go1b.player2@example.test','',now(),'{"provider":"email","providers":["email"]}','{}','','','','',now(),now());
insert into public.users(id,auth_user_id,employee_id,email,full_name,display_name,status,department_id,approved_at) values
 ('bb200000-0000-4000-8000-000000000001','ab200000-0000-4000-8000-000000000001','KK-967001','go1b.host@example.test','Fictitious Host Staff','Host Staff','active','db200000-0000-4000-8000-000000000001',now()),
 ('bb200000-0000-4000-8000-000000000002','ab200000-0000-4000-8000-000000000002','KK-967002','go1b.player1@example.test','Fictitious Player One','Player One','active','db200000-0000-4000-8000-000000000001',now()),
 ('bb200000-0000-4000-8000-000000000003','ab200000-0000-4000-8000-000000000003','KK-967003','go1b.player2@example.test','Fictitious Player Two','Player Two','active','db200000-0000-4000-8000-000000000001',now());
insert into public.user_roles(id,user_id,role_id,scope_type) values
 ('fb200000-0000-4000-8000-000000000001','bb200000-0000-4000-8000-000000000001','8b200000-0000-4000-8000-000000000001','global'),
 ('fb200000-0000-4000-8000-000000000002','bb200000-0000-4000-8000-000000000002','8b200000-0000-4000-8000-000000000002','global'),
 ('fb200000-0000-4000-8000-000000000003','bb200000-0000-4000-8000-000000000003','8b200000-0000-4000-8000-000000000002','global');
insert into public.training_topics(id,code,name,is_active)
values ('2b200000-0000-4000-8000-000000000001','go1b_product_skills','Product Skills',true);

select set_config('request.jwt.claim.sub','ab200000-0000-4000-8000-000000000001',false);
create temporary table go1b_browser_content(content_id uuid primary key);
insert into go1b_browser_content(content_id)
select id from public.create_training_content_draft(
  'quiz','Hosted Quiz Alpha','A live three-question Product Skills challenge.','en',
  array['2b200000-0000-4000-8000-000000000001'::uuid],
  'global',null,null,'{}'::uuid[]
);
select * from public.replace_training_questions(
  (select content_id from go1b_browser_content),
  '[
    {"position":1,"question_type":"multiple_choice","prompt":"Which launch word is correct?","answer_options":["Beta","Alpha","Gamma"],"correct_answer":1,"explanation":"Alpha is the fixture answer.","topic_ids":["2b200000-0000-4000-8000-000000000001"]},
    {"position":2,"question_type":"true_false","prompt":"Pulse scores hosted games on the server.","answer_options":[],"correct_answer":true,"topic_ids":["2b200000-0000-4000-8000-000000000001"]},
    {"position":3,"question_type":"text","prompt":"Type the launch word.","answer_options":[],"correct_answer":["Alpha"],"topic_ids":["2b200000-0000-4000-8000-000000000001"]}
  ]'::jsonb,
  (select updated_at from public.training_content where id=(select content_id from go1b_browser_content))
);
select * from public.publish_training_content(
  (select content_id from go1b_browser_content),
  (select updated_at from public.training_content where id=(select content_id from go1b_browser_content))
);
