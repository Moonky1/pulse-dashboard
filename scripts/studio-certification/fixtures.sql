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
