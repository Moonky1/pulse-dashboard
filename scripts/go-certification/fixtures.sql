-- Fictitious disposable GO-1A browser data. Never apply remotely.
do $block$
begin
  if exists(select 1 from auth.users) then
    raise exception 'GO-1A fixture requires an empty disposable Auth store';
  end if;
end
$block$;

insert into public.departments(id,code,name,is_active)
values ('d6100000-0000-4000-8000-000000000001','go1a_browser','GO-1A Browser',true);
insert into public.roles(id,key,name,is_active)
values ('86100000-0000-4000-8000-000000000001','go1a_browser_role','Fictitious Browser Role',true);
insert into public.role_scopes(role_id,scope_type)
values ('86100000-0000-4000-8000-000000000001','global');
insert into public.role_permissions(role_id,permission_id)
select '86100000-0000-4000-8000-000000000001',id
from public.permissions
where key in ('go.play','go.host','studio.view','studio.create','studio.publish');

insert into auth.users(
  id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,
  raw_app_meta_data,raw_user_meta_data,confirmation_token,recovery_token,
  email_change_token_new,email_change,created_at,updated_at
) values (
  'a6100000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000',
  'authenticated','authenticated','go1a.player@example.test',
  '',now(),
  '{"provider":"email","providers":["email"]}','{}','','','','',now(),now()
);
insert into public.users(id,auth_user_id,employee_id,email,full_name,status,department_id,approved_at)
values (
  'b6100000-0000-4000-8000-000000000001','a6100000-0000-4000-8000-000000000001',
  'KK-966101','go1a.player@example.test','GO-1A Browser Player','active',
  'd6100000-0000-4000-8000-000000000001',now()
);
insert into public.user_roles(id,user_id,role_id,scope_type)
values (
  'f6100000-0000-4000-8000-000000000001','b6100000-0000-4000-8000-000000000001',
  '86100000-0000-4000-8000-000000000001','global'
);
insert into public.training_topics(id,code,name,is_active)
values ('26100000-0000-4000-8000-000000000001','go1a_browser_topic','Pulse Basics',true);

select set_config('request.jwt.claim.sub','a6100000-0000-4000-8000-000000000001',false);
create temporary table go1a_browser_content(content_id uuid primary key);
insert into go1a_browser_content(content_id)
select id from public.create_training_content_draft(
  'quiz','Pulse Practice: First Flight','Three quick questions for isolated browser certification.','en',
  array['26100000-0000-4000-8000-000000000001'::uuid],
  'global',null,null,'{}'::uuid[]
);
select * from public.replace_training_questions(
  (select content_id from go1a_browser_content),
  '[
    {"position":1,"question_type":"multiple_choice","prompt":"Which product are you practicing in?","answer_options":["Pulse Studio","Pulse GO","Pulse Admin"],"correct_answer":1,"explanation":"The Practice experience belongs to Pulse GO.","topic_ids":["26100000-0000-4000-8000-000000000001"]},
    {"position":2,"question_type":"true_false","prompt":"Practice scores are calculated by the server.","answer_options":[],"correct_answer":true,"topic_ids":["26100000-0000-4000-8000-000000000001"]},
    {"position":3,"question_type":"text","prompt":"Type the product name.","answer_options":[],"correct_answer":["Pulse GO","GO"],"topic_ids":["26100000-0000-4000-8000-000000000001"]}
  ]'::jsonb,
  (select updated_at from public.training_content where id=(select content_id from go1a_browser_content))
);
select * from public.publish_training_content(
  (select content_id from go1a_browser_content),
  (select updated_at from public.training_content where id=(select content_id from go1a_browser_content))
);
