begin;
create extension if not exists pgtap with schema extensions;
select no_plan();
-- Fictitious disposable data. The runner checks the local container before use.
insert into public.departments(id,code,name,is_active) values ('d3200000-0000-4000-8000-000000000001','studio_test_department','Test Department',true);
insert into public.campaigns(id,code,name,is_active) values
('c3200000-0000-4000-8000-000000000001','studio_test_alpha','Campaign Alpha',true),('c3200000-0000-4000-8000-000000000002','studio_test_beta','Campaign Beta',true);
insert into public.teams(id,department_id,campaign_id,code,name,is_active) values
('e3200000-0000-4000-8000-000000000001','d3200000-0000-4000-8000-000000000001','c3200000-0000-4000-8000-000000000001','studio_test_north','Team North',true),
('e3200000-0000-4000-8000-000000000002','d3200000-0000-4000-8000-000000000001','c3200000-0000-4000-8000-000000000002','studio_test_south','Team South',true);
insert into public.positions(id,code,name,is_active) values
('13200000-0000-4000-8000-000000000001','studio_test_one','Position One',true),('13200000-0000-4000-8000-000000000002','studio_test_two','Position Two',true);
insert into public.training_topics(id,code,name,is_active) values
('23200000-0000-4000-8000-000000000001','studio_test_alpha','Topic Alpha',true),('23200000-0000-4000-8000-000000000002','studio_test_beta','Topic Beta',true);
insert into public.roles(id,key,name,is_active) values ('83200000-0000-4000-8000-000000000001','studio_test_1','Unrelated Title 1',true);
insert into public.role_scopes(role_id,scope_type) values ('83200000-0000-4000-8000-000000000001','global'),('83200000-0000-4000-8000-000000000001','campaign'),('83200000-0000-4000-8000-000000000001','team');
insert into public.role_permissions(role_id,permission_id) select '83200000-0000-4000-8000-000000000001',id from public.permissions where key in ('studio.view','studio.create');
insert into public.roles(id,key,name,is_active) values ('83200000-0000-4000-8000-000000000002','studio_test_2','Unrelated Title 2',true);
insert into public.role_scopes(role_id,scope_type) values ('83200000-0000-4000-8000-000000000002','global'),('83200000-0000-4000-8000-000000000002','campaign'),('83200000-0000-4000-8000-000000000002','team');
insert into public.role_permissions(role_id,permission_id) select '83200000-0000-4000-8000-000000000002',id from public.permissions where key in ('studio.view','studio.publish');
insert into public.roles(id,key,name,is_active) values ('83200000-0000-4000-8000-000000000003','studio_test_3','Unrelated Title 3',true);
insert into public.role_scopes(role_id,scope_type) values ('83200000-0000-4000-8000-000000000003','global'),('83200000-0000-4000-8000-000000000003','campaign'),('83200000-0000-4000-8000-000000000003','team');
insert into public.role_permissions(role_id,permission_id) select '83200000-0000-4000-8000-000000000003',id from public.permissions where key in ('studio.view','studio.create','academy.manage');
insert into public.roles(id,key,name,is_active) values ('83200000-0000-4000-8000-000000000004','studio_test_4','Unrelated Title 4',true);
insert into public.role_scopes(role_id,scope_type) values ('83200000-0000-4000-8000-000000000004','global'),('83200000-0000-4000-8000-000000000004','campaign'),('83200000-0000-4000-8000-000000000004','team');
insert into public.role_permissions(role_id,permission_id) select '83200000-0000-4000-8000-000000000004',id from public.permissions where key in ('studio.view','academy.manage');
insert into public.roles(id,key,name,is_active) values ('83200000-0000-4000-8000-000000000005','studio_test_5','Unrelated Title 5',true);
insert into public.role_scopes(role_id,scope_type) values ('83200000-0000-4000-8000-000000000005','global'),('83200000-0000-4000-8000-000000000005','campaign'),('83200000-0000-4000-8000-000000000005','team');
insert into public.role_permissions(role_id,permission_id) select '83200000-0000-4000-8000-000000000005',id from public.permissions where key in ('studio.view','studio.create','studio.publish','academy.manage','go.play');
insert into public.roles(id,key,name,is_active) values ('83200000-0000-4000-8000-000000000006','studio_test_6','Unrelated Title 6',true);
insert into public.role_scopes(role_id,scope_type) values ('83200000-0000-4000-8000-000000000006','global'),('83200000-0000-4000-8000-000000000006','campaign'),('83200000-0000-4000-8000-000000000006','team');
insert into public.role_permissions(role_id,permission_id) select '83200000-0000-4000-8000-000000000006',id from public.permissions where key in ('studio.view');
insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,confirmation_token,recovery_token,email_change_token_new,email_change,created_at,updated_at)
values ('a3200000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','studio1@example.test','',now(),'{"provider":"email","providers":["email"]}','{}','','','','',now(),now());
insert into public.users(id,auth_user_id,employee_id,email,full_name,status,department_id,approved_at)
values ('b3200000-0000-4000-8000-000000000001','a3200000-0000-4000-8000-000000000001','KK-983201','studio1@example.test','Test Staff 1','active','d3200000-0000-4000-8000-000000000001',now());
insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,confirmation_token,recovery_token,email_change_token_new,email_change,created_at,updated_at)
values ('a3200000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','studio2@example.test','',now(),'{"provider":"email","providers":["email"]}','{}','','','','',now(),now());
insert into public.users(id,auth_user_id,employee_id,email,full_name,status,department_id,approved_at)
values ('b3200000-0000-4000-8000-000000000002','a3200000-0000-4000-8000-000000000002','KK-983202','studio2@example.test','Test Staff 2','active','d3200000-0000-4000-8000-000000000001',now());
insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,confirmation_token,recovery_token,email_change_token_new,email_change,created_at,updated_at)
values ('a3200000-0000-4000-8000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','studio3@example.test','',now(),'{"provider":"email","providers":["email"]}','{}','','','','',now(),now());
insert into public.users(id,auth_user_id,employee_id,email,full_name,status,department_id,approved_at)
values ('b3200000-0000-4000-8000-000000000003','a3200000-0000-4000-8000-000000000003','KK-983203','studio3@example.test','Test Staff 3','active','d3200000-0000-4000-8000-000000000001',now());
insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,confirmation_token,recovery_token,email_change_token_new,email_change,created_at,updated_at)
values ('a3200000-0000-4000-8000-000000000004','00000000-0000-0000-0000-000000000000','authenticated','authenticated','studio4@example.test','',now(),'{"provider":"email","providers":["email"]}','{}','','','','',now(),now());
insert into public.users(id,auth_user_id,employee_id,email,full_name,status,department_id,approved_at)
values ('b3200000-0000-4000-8000-000000000004','a3200000-0000-4000-8000-000000000004','KK-983204','studio4@example.test','Test Staff 4','active','d3200000-0000-4000-8000-000000000001',now());
insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,confirmation_token,recovery_token,email_change_token_new,email_change,created_at,updated_at)
values ('a3200000-0000-4000-8000-000000000005','00000000-0000-0000-0000-000000000000','authenticated','authenticated','studio5@example.test','',now(),'{"provider":"email","providers":["email"]}','{}','','','','',now(),now());
insert into public.users(id,auth_user_id,employee_id,email,full_name,status,department_id,approved_at)
values ('b3200000-0000-4000-8000-000000000005','a3200000-0000-4000-8000-000000000005','KK-983205','studio5@example.test','Test Staff 5','active','d3200000-0000-4000-8000-000000000001',now());
insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,confirmation_token,recovery_token,email_change_token_new,email_change,created_at,updated_at)
values ('a3200000-0000-4000-8000-000000000006','00000000-0000-0000-0000-000000000000','authenticated','authenticated','studio6@example.test','',now(),'{"provider":"email","providers":["email"]}','{}','','','','',now(),now());
insert into public.users(id,auth_user_id,employee_id,email,full_name,status,department_id,approved_at)
values ('b3200000-0000-4000-8000-000000000006','a3200000-0000-4000-8000-000000000006','KK-983206','studio6@example.test','Test Staff 6','active','d3200000-0000-4000-8000-000000000001',now());
insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,confirmation_token,recovery_token,email_change_token_new,email_change,created_at,updated_at)
values ('a3200000-0000-4000-8000-000000000007','00000000-0000-0000-0000-000000000000','authenticated','authenticated','studio7@example.test','',now(),'{"provider":"email","providers":["email"]}','{}','','','','',now(),now());
insert into public.users(id,auth_user_id,employee_id,email,full_name,status,department_id,approved_at)
values ('b3200000-0000-4000-8000-000000000007','a3200000-0000-4000-8000-000000000007','KK-983207','studio7@example.test','Test Staff 7','active','d3200000-0000-4000-8000-000000000001',now());
insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,confirmation_token,recovery_token,email_change_token_new,email_change,created_at,updated_at)
values ('a3200000-0000-4000-8000-000000000008','00000000-0000-0000-0000-000000000000','authenticated','authenticated','studio8@example.test','',now(),'{"provider":"email","providers":["email"]}','{}','','','','',now(),now());
insert into public.users(id,auth_user_id,employee_id,email,full_name,status,department_id,approved_at)
values ('b3200000-0000-4000-8000-000000000008','a3200000-0000-4000-8000-000000000008','KK-983208','studio8@example.test','Test Staff 8','active','d3200000-0000-4000-8000-000000000001',now());
insert into public.user_roles(id,user_id,role_id,scope_type,campaign_id,team_id) values ('f3200000-0000-4000-8000-000000000001','b3200000-0000-4000-8000-000000000001','83200000-0000-4000-8000-000000000001','campaign','c3200000-0000-4000-8000-000000000001',null);
insert into public.user_roles(id,user_id,role_id,scope_type,campaign_id,team_id) values ('f3200000-0000-4000-8000-000000000002','b3200000-0000-4000-8000-000000000002','83200000-0000-4000-8000-000000000002','campaign','c3200000-0000-4000-8000-000000000001',null);
insert into public.user_roles(id,user_id,role_id,scope_type,campaign_id,team_id) values ('f3200000-0000-4000-8000-000000000003','b3200000-0000-4000-8000-000000000003','83200000-0000-4000-8000-000000000003','campaign','c3200000-0000-4000-8000-000000000001',null);
insert into public.user_roles(id,user_id,role_id,scope_type,campaign_id,team_id) values ('f3200000-0000-4000-8000-000000000004','b3200000-0000-4000-8000-000000000004','83200000-0000-4000-8000-000000000001','campaign','c3200000-0000-4000-8000-000000000001',null);
insert into public.user_roles(id,user_id,role_id,scope_type,campaign_id,team_id) values ('f3200000-0000-4000-8000-000000000005','b3200000-0000-4000-8000-000000000004','83200000-0000-4000-8000-000000000004','campaign','c3200000-0000-4000-8000-000000000002',null);
insert into public.user_roles(id,user_id,role_id,scope_type,campaign_id,team_id) values ('f3200000-0000-4000-8000-000000000006','b3200000-0000-4000-8000-000000000005','83200000-0000-4000-8000-000000000001','team',null,'e3200000-0000-4000-8000-000000000001');
insert into public.user_roles(id,user_id,role_id,scope_type,campaign_id,team_id) values ('f3200000-0000-4000-8000-000000000007','b3200000-0000-4000-8000-000000000006','83200000-0000-4000-8000-000000000005','global',null,null);
insert into public.user_roles(id,user_id,role_id,scope_type,campaign_id,team_id) values ('f3200000-0000-4000-8000-000000000008','b3200000-0000-4000-8000-000000000007','83200000-0000-4000-8000-000000000006','campaign','c3200000-0000-4000-8000-000000000001',null);
insert into public.user_roles(id,user_id,role_id,scope_type,campaign_id,team_id) values ('f3200000-0000-4000-8000-000000000009','b3200000-0000-4000-8000-000000000008','83200000-0000-4000-8000-000000000003','team',null,'e3200000-0000-4000-8000-000000000002');
select set_config('request.jwt.claim.sub','a3200000-0000-4000-8000-000000000001',true);
create temporary table fixture as select id content_id from public.create_training_content_draft('quiz','Local test quiz',null,'en',array['23200000-0000-4000-8000-000000000001'::uuid],'campaign','c3200000-0000-4000-8000-000000000001',null,'{}');
select is(public.get_studio_capabilities(null)->>'can_view_studio','true','Campaign Staff can enter Studio');
select is(public.get_studio_capabilities(null)->>'can_create_global','false','Campaign create does not grant Global create');
select is(public.get_studio_capabilities((select content_id from fixture))->>'can_edit','true','creator edits own exact scope');
select is(public.get_studio_capabilities((select content_id from fixture))->>'can_publish','false','create does not imply publish');
select lives_ok($case$select * from public.update_training_content_draft((select content_id from fixture),'Saved title',null,'en',array['23200000-0000-4000-8000-000000000001'::uuid],'campaign','c3200000-0000-4000-8000-000000000001',null,'{}',(select updated_at from public.training_content where id=(select content_id from fixture)))$case$,'same-scope update succeeds');
select throws_ok($case$select * from public.update_training_content_draft((select content_id from fixture),'Saved title',null,'en',array['23200000-0000-4000-8000-000000000001'::uuid],'campaign','c3200000-0000-4000-8000-000000000002',null,'{}',(select updated_at from public.training_content where id=(select content_id from fixture)))$case$,'42501',null,'unauthorized destination denied');
select lives_ok($case$select * from public.update_training_content_draft((select content_id from fixture),'Saved title',null,'en',array['23200000-0000-4000-8000-000000000001'::uuid],'team',null,'e3200000-0000-4000-8000-000000000001','{}',(select updated_at from public.training_content where id=(select content_id from fixture)))$case$,'Campaign to own Team succeeds');
select lives_ok($case$select * from public.update_training_content_draft((select content_id from fixture),'Saved title',null,'en',array['23200000-0000-4000-8000-000000000001'::uuid],'campaign','c3200000-0000-4000-8000-000000000001',null,'{}',(select updated_at from public.training_content where id=(select content_id from fixture)))$case$,'Team to authorized Campaign succeeds');
select set_config('request.jwt.claim.sub','a3200000-0000-4000-8000-000000000004',true);
select throws_ok($case$select public.get_training_content_authoring_details((select content_id from fixture))$case$,'P0002',null,'manager Beta cannot review foreign draft Alpha');
select throws_ok($case$select * from public.update_training_content_draft((select content_id from fixture),'Saved title',null,'en',array['23200000-0000-4000-8000-000000000001'::uuid],'campaign','c3200000-0000-4000-8000-000000000001',null,'{}',(select updated_at from public.training_content where id=(select content_id from fixture)))$case$,'42501',null,'cross-scope manage cannot edit');
select set_config('request.jwt.claim.sub','a3200000-0000-4000-8000-000000000003',true);
select is(public.get_studio_capabilities((select content_id from fixture))->>'can_edit','true','manager create+manage exact scope edits foreign draft');
select lives_ok($case$select * from public.update_training_content_draft((select content_id from fixture),'Saved title',null,'en',array['23200000-0000-4000-8000-000000000001'::uuid],'campaign','c3200000-0000-4000-8000-000000000001',null,'{}',(select updated_at from public.training_content where id=(select content_id from fixture)))$case$,'same-context manager update');
select throws_ok($case$select * from public.update_training_content_draft((select content_id from fixture),'Saved title',null,'en',array['23200000-0000-4000-8000-000000000001'::uuid],'campaign','c3200000-0000-4000-8000-000000000002',null,'{}',(select updated_at from public.training_content where id=(select content_id from fixture)))$case$,'42501',null,'manager cannot retarget outside authority');
select set_config('request.jwt.claim.sub','a3200000-0000-4000-8000-000000000002',true);
select is(public.get_studio_capabilities((select content_id from fixture))->>'can_publish','true','publisher exact scope can publish');
select is(public.get_studio_capabilities((select content_id from fixture))->>'can_edit','false','publisher read keys does not imply edit');
select throws_ok($case$select * from public.update_training_content_draft((select content_id from fixture),'Saved title',null,'en',array['23200000-0000-4000-8000-000000000001'::uuid],'campaign','c3200000-0000-4000-8000-000000000001',null,'{}',(select updated_at from public.training_content where id=(select content_id from fixture)))$case$,'42501',null,'publisher cannot edit');
select set_config('request.jwt.claim.sub','a3200000-0000-4000-8000-000000000005',true);
select throws_ok($case$select public.get_training_content_authoring_details((select content_id from fixture))$case$,'P0002',null,'Team author cannot inspect whole Campaign');
select set_config('request.jwt.claim.sub','a3200000-0000-4000-8000-000000000008',true);
select throws_ok($case$select public.get_training_content_authoring_details((select content_id from fixture))$case$,'P0002',null,'other Team manager denied');
select set_config('request.jwt.claim.sub','a3200000-0000-4000-8000-000000000007',true);
select throws_ok($case$select public.get_training_content_authoring_details((select content_id from fixture))$case$,'P0002',null,'viewer cannot read answer keys');
select set_config('request.jwt.claim.sub','a3200000-0000-4000-8000-000000000006',true);
select lives_ok($case$select * from public.update_training_content_draft((select content_id from fixture),'Saved title',null,'en',array['23200000-0000-4000-8000-000000000001'::uuid],'campaign','c3200000-0000-4000-8000-000000000002',null,'{}',(select updated_at from public.training_content where id=(select content_id from fixture)))$case$,'Global manager retargets between Campaigns');
select lives_ok($case$select * from public.update_training_content_draft((select content_id from fixture),'Saved title',null,'en',array['23200000-0000-4000-8000-000000000001'::uuid],'team',null,'e3200000-0000-4000-8000-000000000002','{}',(select updated_at from public.training_content where id=(select content_id from fixture)))$case$,'Global manager retargets to Team South');
select lives_ok($case$select * from public.update_training_content_draft((select content_id from fixture),'Saved title',null,'en',array['23200000-0000-4000-8000-000000000001'::uuid],'campaign','c3200000-0000-4000-8000-000000000001',null,'{}',(select updated_at from public.training_content where id=(select content_id from fixture)))$case$,'Global manager restores Alpha');
select set_config('request.jwt.claim.sub','a3200000-0000-4000-8000-000000000001',true);
insert into public.user_roles(user_id,role_id,scope_type,campaign_id) values ('b3200000-0000-4000-8000-000000000001','83200000-0000-4000-8000-000000000001','campaign','c3200000-0000-4000-8000-000000000002');
select lives_ok($case$select * from public.update_training_content_draft((select content_id from fixture),'Saved title',null,'en',array['23200000-0000-4000-8000-000000000001'::uuid],'campaign','c3200000-0000-4000-8000-000000000002',null,'{}',(select updated_at from public.training_content where id=(select content_id from fixture)))$case$,'author authorized origin and destination succeeds');
select lives_ok($case$select * from public.update_training_content_draft((select content_id from fixture),'Saved title',null,'en',array['23200000-0000-4000-8000-000000000001'::uuid],'campaign','c3200000-0000-4000-8000-000000000001',null,'{}',(select updated_at from public.training_content where id=(select content_id from fixture)))$case$,'author returns to Alpha');
delete from public.user_roles where user_id='b3200000-0000-4000-8000-000000000001' and campaign_id='c3200000-0000-4000-8000-000000000001';
select throws_ok($case$select * from public.update_training_content_draft((select content_id from fixture),'Saved title',null,'en',array['23200000-0000-4000-8000-000000000001'::uuid],'campaign','c3200000-0000-4000-8000-000000000002',null,'{}',(select updated_at from public.training_content where id=(select content_id from fixture)))$case$,'42501',null,'cached ID and version cannot escape revoked source');
insert into public.user_roles(user_id,role_id,scope_type,campaign_id) values ('b3200000-0000-4000-8000-000000000001','83200000-0000-4000-8000-000000000001','campaign','c3200000-0000-4000-8000-000000000001');
select lives_ok($case$select * from public.replace_training_questions((select content_id from fixture),'[{"position":1,"question_type":"multiple_choice","prompt":"Which answer?","answer_options":["First","Second"],"correct_answer":1,"topic_ids":["23200000-0000-4000-8000-000000000001"]}]'::jsonb,(select updated_at from public.training_content where id=(select content_id from fixture)))$case$,'valid question persists');
select throws_ok($case$select * from public.replace_training_questions((select content_id from fixture),'[{"position":1,"question_type":"multiple_choice","prompt":"Which answer?","answer_options":["","B"],"correct_answer":1,"topic_ids":["23200000-0000-4000-8000-000000000001"]}]'::jsonb,(select updated_at from public.training_content where id=(select content_id from fixture)))$case$,'22023',null,'empty option denied');
select throws_ok($case$select * from public.replace_training_questions((select content_id from fixture),'[{"position":1,"question_type":"multiple_choice","prompt":"Which answer?","answer_options":["   ","B"],"correct_answer":1,"topic_ids":["23200000-0000-4000-8000-000000000001"]}]'::jsonb,(select updated_at from public.training_content where id=(select content_id from fixture)))$case$,'22023',null,'whitespace option denied');
select throws_ok($case$select * from public.replace_training_questions((select content_id from fixture),'[{"position":1,"question_type":"multiple_choice","prompt":"Which answer?","answer_options":[3,"B"],"correct_answer":1,"topic_ids":["23200000-0000-4000-8000-000000000001"]}]'::jsonb,(select updated_at from public.training_content where id=(select content_id from fixture)))$case$,'22023',null,'non-text option denied');
select throws_ok($case$select * from public.replace_training_questions((select content_id from fixture),'[{"position":1,"question_type":"multiple_choice","prompt":"Which answer?","answer_options":[null,"B"],"correct_answer":1,"topic_ids":["23200000-0000-4000-8000-000000000001"]}]'::jsonb,(select updated_at from public.training_content where id=(select content_id from fixture)))$case$,'22023',null,'null option denied');
select throws_ok($case$select * from public.replace_training_questions((select content_id from fixture),'[{"position":1,"question_type":"multiple_choice","prompt":"Which answer?","answer_options":{"a":"A"},"correct_answer":1,"topic_ids":["23200000-0000-4000-8000-000000000001"]}]'::jsonb,(select updated_at from public.training_content where id=(select content_id from fixture)))$case$,'22023',null,'object options denied');
select throws_ok($case$select * from public.replace_training_questions((select content_id from fixture),'[{"position":1,"question_type":"multiple_choice","prompt":"Which answer?","answer_options":null,"correct_answer":1,"topic_ids":["23200000-0000-4000-8000-000000000001"]}]'::jsonb,(select updated_at from public.training_content where id=(select content_id from fixture)))$case$,'22023',null,'missing option denied');
select throws_ok($case$select * from public.replace_training_questions((select content_id from fixture),'[{"position":1,"question_type":"multiple_choice","prompt":"Which answer?","answer_options":["A","A","A","A","A","A","A","A","A"],"correct_answer":1,"topic_ids":["23200000-0000-4000-8000-000000000001"]}]'::jsonb,(select updated_at from public.training_content where id=(select content_id from fixture)))$case$,'22023',null,'nine options denied');
select throws_ok($case$select * from public.replace_training_questions((select content_id from fixture),'[{"position":1,"question_type":"multiple_choice","prompt":"Which answer?","answer_options":["A"],"correct_answer":1,"topic_ids":["23200000-0000-4000-8000-000000000001"]}]'::jsonb,(select updated_at from public.training_content where id=(select content_id from fixture)))$case$,'22023',null,'one option denied');
select throws_ok($case$select * from public.replace_training_questions((select content_id from fixture),'[{"position":1,"question_type":"multiple_choice","prompt":"Which answer?","answer_options":["First","Second"],"correct_answer":0.5,"topic_ids":["23200000-0000-4000-8000-000000000001"]}]'::jsonb,(select updated_at from public.training_content where id=(select content_id from fixture)))$case$,'22023',null,'fractional answer denied');
select throws_ok($case$select * from public.replace_training_questions((select content_id from fixture),'[{"position":1,"question_type":"multiple_choice","prompt":"Which answer?","answer_options":["First","Second"],"correct_answer":2,"topic_ids":["23200000-0000-4000-8000-000000000001"]}]'::jsonb,(select updated_at from public.training_content where id=(select content_id from fixture)))$case$,'22023',null,'out of range answer denied');
select throws_ok($case$select * from public.replace_training_questions((select content_id from fixture),'[{"position":1,"question_type":"multiple_choice","prompt":"Which answer?","answer_options":["First","Second"],"correct_answer":null,"topic_ids":["23200000-0000-4000-8000-000000000001"]}]'::jsonb,(select updated_at from public.training_content where id=(select content_id from fixture)))$case$,'22023',null,'null answer denied');
select throws_ok($case$select * from public.replace_training_questions((select content_id from fixture),'[{"position":1,"question_type":"true_false","prompt":"Which answer?","answer_options":["x"],"correct_answer":true,"topic_ids":["23200000-0000-4000-8000-000000000001"]}]'::jsonb,(select updated_at from public.training_content where id=(select content_id from fixture)))$case$,'22023',null,'true false options denied');
select throws_ok($case$select * from public.replace_training_questions((select content_id from fixture),'[{"position":1,"question_type":"true_false","prompt":"Which answer?","answer_options":[],"correct_answer":"true","topic_ids":["23200000-0000-4000-8000-000000000001"]}]'::jsonb,(select updated_at from public.training_content where id=(select content_id from fixture)))$case$,'22023',null,'true false string denied');
select throws_ok($case$select * from public.replace_training_questions((select content_id from fixture),'[{"position":1,"question_type":"text","prompt":"Which answer?","answer_options":[],"correct_answer":[" "],"topic_ids":["23200000-0000-4000-8000-000000000001"]}]'::jsonb,(select updated_at from public.training_content where id=(select content_id from fixture)))$case$,'22023',null,'empty accepted answer denied');
select throws_ok($case$select * from public.replace_training_questions((select content_id from fixture),'[{"position":1,"question_type":"text","prompt":"Which answer?","answer_options":[],"correct_answer":[{}],"topic_ids":["23200000-0000-4000-8000-000000000001"]}]'::jsonb,(select updated_at from public.training_content where id=(select content_id from fixture)))$case$,'22023',null,'object accepted answer denied');
select throws_ok($case$select * from public.replace_training_questions((select content_id from fixture),'[{"position":1,"question_type":"text","prompt":"Which answer?","answer_options":["x"],"correct_answer":["ok"],"topic_ids":["23200000-0000-4000-8000-000000000001"]}]'::jsonb,(select updated_at from public.training_content where id=(select content_id from fixture)))$case$,'22023',null,'text option structure denied');
select throws_ok($case$select * from public.replace_training_questions((select content_id from fixture),null,(select updated_at from public.training_content where id=(select content_id from fixture)))$case$,'22023',null,'null questions denied');
select is((select count(*) from public.training_questions where content_id=(select content_id from fixture)),1::bigint,'failed replacements keep saved question');
select lives_ok($case$select * from public.replace_training_questions((select content_id from fixture),'[{"position":1,"question_type":"text","prompt":"Which answer?","answer_options":[],"correct_answer":[" Answer "],"topic_ids":["23200000-0000-4000-8000-000000000001"]}]'::jsonb,(select updated_at from public.training_content where id=(select content_id from fixture)))$case$,'normalized text accepted');
select set_config('request.jwt.claim.sub','a3200000-0000-4000-8000-000000000006',true);
create temporary table old_version as select updated_at from public.training_content where id=(select content_id from fixture);
select lives_ok($case$select * from public.update_training_content_draft((select content_id from fixture),'A newer title',null,'en',array['23200000-0000-4000-8000-000000000001'::uuid],'campaign','c3200000-0000-4000-8000-000000000001',null,'{}',(select updated_at from public.training_content where id=(select content_id from fixture)))$case$,'new version saved');
select throws_ok($case$select * from public.publish_training_content((select content_id from fixture),(select updated_at from old_version))$case$,'PT409',null,'stale review denied');
select is((select status from public.training_content where id=(select content_id from fixture)),'draft','stale review does not publish');
select throws_ok($case$select * from public.publish_training_content((select content_id from fixture))$case$,'22023',null,'versionless legacy publish fails closed');
select lives_ok($case$select * from public.publish_training_content((select content_id from fixture),(select updated_at from public.training_content where id=(select content_id from fixture)))$case$,'exact reviewed version publishes');
select is(public.get_studio_capabilities((select content_id from fixture))->>'can_edit','false','published edit false');
select is(public.get_studio_capabilities((select content_id from fixture))->>'can_archive','true','publisher may archive');
select is((select count(*) from public.list_studio_content('draft')),0::bigint,'server draft filter excludes published');
select is((select count(*) from public.list_studio_content('published')),1::bigint,'server published filter');
select lives_ok($case$select * from public.archive_training_content((select content_id from fixture))$case$,'archive preserves history');
select is(public.get_studio_capabilities((select content_id from fixture))->>'can_archive','false','cannot archive twice');
select is((select count(*) from public.training_questions where content_id=(select content_id from fixture)),1::bigint,'archive preserves questions');
select is((select count(*) from public.list_studio_content('archived')),1::bigint,'server archived filter');
create temporary table audit_baseline as select count(*) amount from public.audit_events;
select public.get_training_content_authoring_details((select content_id from fixture));
select public.get_studio_capabilities((select content_id from fixture));
select * from public.list_studio_content();
select is((select count(*) from public.audit_events),(select amount from audit_baseline),'all reads audit-neutral');
select ok(not has_function_privilege('anon','public.get_studio_capabilities(uuid)','EXECUTE'),'anon denied get_studio_capabilities(uuid)');
select ok(not has_function_privilege('public','public.get_studio_capabilities(uuid)','EXECUTE'),'public denied get_studio_capabilities(uuid)');
select ok(not has_function_privilege('service_role','public.get_studio_capabilities(uuid)','EXECUTE'),'service_role denied get_studio_capabilities(uuid)');
select ok(has_function_privilege('authenticated','public.get_studio_capabilities(uuid)','EXECUTE'),'authenticated grant get_studio_capabilities(uuid)');
select is((select proowner::regrole::text from pg_proc where oid='public.get_studio_capabilities(uuid)'::regprocedure),'postgres','owner get_studio_capabilities(uuid)');
select is((select proconfig[1] from pg_proc where oid='public.get_studio_capabilities(uuid)'::regprocedure),'search_path=pg_catalog','path get_studio_capabilities(uuid)');
select ok(not has_function_privilege('anon','public.list_studio_content(text,text,uuid,text,integer,integer)','EXECUTE'),'anon denied list_studio_content(text,text,uuid,text,integer,integer)');
select ok(not has_function_privilege('public','public.list_studio_content(text,text,uuid,text,integer,integer)','EXECUTE'),'public denied list_studio_content(text,text,uuid,text,integer,integer)');
select ok(not has_function_privilege('service_role','public.list_studio_content(text,text,uuid,text,integer,integer)','EXECUTE'),'service_role denied list_studio_content(text,text,uuid,text,integer,integer)');
select ok(has_function_privilege('authenticated','public.list_studio_content(text,text,uuid,text,integer,integer)','EXECUTE'),'authenticated grant list_studio_content(text,text,uuid,text,integer,integer)');
select is((select proowner::regrole::text from pg_proc where oid='public.list_studio_content(text,text,uuid,text,integer,integer)'::regprocedure),'postgres','owner list_studio_content(text,text,uuid,text,integer,integer)');
select is((select proconfig[1] from pg_proc where oid='public.list_studio_content(text,text,uuid,text,integer,integer)'::regprocedure),'search_path=pg_catalog','path list_studio_content(text,text,uuid,text,integer,integer)');
select ok(not has_function_privilege('anon','public.publish_training_content(uuid,timestamptz)','EXECUTE'),'anon denied publish_training_content(uuid,timestamptz)');
select ok(not has_function_privilege('public','public.publish_training_content(uuid,timestamptz)','EXECUTE'),'public denied publish_training_content(uuid,timestamptz)');
select ok(not has_function_privilege('service_role','public.publish_training_content(uuid,timestamptz)','EXECUTE'),'service_role denied publish_training_content(uuid,timestamptz)');
select ok(has_function_privilege('authenticated','public.publish_training_content(uuid,timestamptz)','EXECUTE'),'authenticated grant publish_training_content(uuid,timestamptz)');
select is((select proowner::regrole::text from pg_proc where oid='public.publish_training_content(uuid,timestamptz)'::regprocedure),'postgres','owner publish_training_content(uuid,timestamptz)');
select is((select proconfig[1] from pg_proc where oid='public.publish_training_content(uuid,timestamptz)'::regprocedure),'search_path=pg_catalog','path publish_training_content(uuid,timestamptz)');
select throws_ok($case$select pulse_private.validate_training_answer('multiple_choice', E'["\\t\\n","B"]'::jsonb,'0')$case$,'22023',null,'tab/newline-only option denied');
create temporary table bounded as select id from public.create_training_content_draft('quiz','Bounded questions',null,'en',array['23200000-0000-4000-8000-000000000001'::uuid],'global',null,null,'{}');
select lives_ok($case$select * from public.replace_training_questions((select id from bounded),
  (select jsonb_agg(jsonb_build_object('position',n,'question_type','true_false','prompt','Question ' || n,'answer_options','[]'::jsonb,'correct_answer',true,'topic_ids',jsonb_build_array('23200000-0000-4000-8000-000000000001'))) from generate_series(1,100) n),
  (select updated_at from public.training_content where id=(select id from bounded)))$case$,'100 questions persist in canonical order');
select is((select count(*) from public.training_questions where content_id=(select id from bounded)),100::bigint,'100 stored questions');
select throws_ok($case$select * from public.replace_training_questions((select id from bounded),
  (select jsonb_agg(jsonb_build_object('position',n)) from generate_series(1,101) n),
  (select updated_at from public.training_content where id=(select id from bounded)))$case$,'22023',null,'101 questions rejected before replacement');
select throws_ok($case$select * from public.replace_training_questions((select id from bounded),'[]',
  (select updated_at from public.training_content where id=(select id from bounded)))$case$,'22023',null,'empty replacement rejected');
select is((select count(*) from public.training_questions where content_id=(select id from bounded)),100::bigint,'failed bounded replacement preserves all questions');
select ok((select relrowsecurity from pg_class where oid='public.training_questions'::regclass),'question RLS remains enabled');
grant select on fixture to authenticated;
set local role authenticated;
select throws_ok($case$select * from public.list_studio_content(requested_limit => null)$case$,'22023',null,'explicit NULL cannot bypass catalog pagination bound');
select throws_ok($case$select * from public.list_studio_content(requested_offset => null)$case$,'22023',null,'explicit NULL offset rejected');
select lives_ok($case$select public.get_training_content_authoring_details((select content_id from fixture))$case$,'real authenticated role can use scoped authoring RPC');
select throws_ok($case$select * from public.training_questions$case$,'42501',null,'real browser role cannot read protected answers');
select throws_ok($case$delete from public.training_content$case$,'42501',null,'real browser role cannot directly delete content');
reset role;
set local role anon;
select throws_ok($case$select public.get_studio_capabilities(null)$case$,'42501',null,'actual anonymous role cannot invoke capabilities');
reset role;
update public.users set status='inactive' where id='b3200000-0000-4000-8000-000000000001';
select set_config('request.jwt.claim.sub','a3200000-0000-4000-8000-000000000001',true);
select throws_ok($case$select public.get_studio_capabilities(null)$case$,'42501',null,'inactive Staff cannot resolve capabilities');
select * from finish();
rollback;
