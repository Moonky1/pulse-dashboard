begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values
 ('a6000000-0000-4000-8000-000000000001','authenticated','authenticated','audit.super@example.test','',now(),'{}','{}',now(),now()),
 ('a6000000-0000-4000-8000-000000000002','authenticated','authenticated','audit.noaudit@example.test','',now(),'{}','{}',now(),now()),
 ('a6000000-0000-4000-8000-000000000003','authenticated','authenticated','audit.nousers@example.test','',now(),'{}','{}',now(),now()),
 ('a6000000-0000-4000-8000-000000000004','authenticated','authenticated','audit.inactive@example.test','',now(),'{}','{}',now(),now()),
 ('a6000000-0000-4000-8000-000000000005','authenticated','authenticated','audit.target@example.test','',now(),'{}','{}',now(),now());

insert into public.users(id,auth_user_id,employee_id,email,full_name,display_name,status,approved_at)
values
 ('b6000000-0000-4000-8000-000000000001','a6000000-0000-4000-8000-000000000001','KK-960001','audit.super@example.test','Audit Super','Audit Super','active',now()),
 ('b6000000-0000-4000-8000-000000000002','a6000000-0000-4000-8000-000000000002','KK-960002','audit.noaudit@example.test','Audit Without View','No Audit','active',now()),
 ('b6000000-0000-4000-8000-000000000003','a6000000-0000-4000-8000-000000000003','KK-960003','audit.nousers@example.test','Audit Without Users','No Users','active',now()),
 ('b6000000-0000-4000-8000-000000000004','a6000000-0000-4000-8000-000000000004','KK-960004','audit.inactive@example.test','Inactive Audit','Inactive','inactive',now()),
 ('b6000000-0000-4000-8000-000000000005','a6000000-0000-4000-8000-000000000005','KK-960005','audit.target@example.test','Audit Target','Target','active',now());

insert into public.roles(id,key,name,is_system,is_active)
values
 ('16000000-0000-4000-8000-000000000001','admin5_no_audit','ADMIN-5 No Audit',false,true),
 ('16000000-0000-4000-8000-000000000002','admin5_no_users','ADMIN-5 No Users',false,true);
insert into public.role_scopes(role_id,scope_type) values
 ('16000000-0000-4000-8000-000000000001','global'),
 ('16000000-0000-4000-8000-000000000002','global');
insert into public.role_permissions(role_id,permission_id)
select '16000000-0000-4000-8000-000000000001',id from public.permissions where key in ('admin.access','users.view');
insert into public.role_permissions(role_id,permission_id)
select '16000000-0000-4000-8000-000000000002',id from public.permissions where key in ('admin.access','audit.view');
insert into public.user_roles(id,user_id,role_id,scope_type)
values
 ('c6000000-0000-4000-8000-000000000001','b6000000-0000-4000-8000-000000000001','10000000-0000-0000-0000-000000000010','global'),
 ('c6000000-0000-4000-8000-000000000002','b6000000-0000-4000-8000-000000000002','16000000-0000-4000-8000-000000000001','global'),
 ('c6000000-0000-4000-8000-000000000003','b6000000-0000-4000-8000-000000000003','16000000-0000-4000-8000-000000000002','global'),
 ('c6000000-0000-4000-8000-000000000004','b6000000-0000-4000-8000-000000000004','10000000-0000-0000-0000-000000000010','global');

insert into public.audit_events(id,actor_user_id,target_type,target_id,action,source,request_id,metadata,occurred_at)
values
 ('f6000000-0000-4000-8000-000000000001','b6000000-0000-4000-8000-000000000001','user','b6000000-0000-4000-8000-000000000005','account.approved','database','96000000-0000-4000-8000-000000000001','{"auth_user_id":"secret-auth-id","employee_id":"KK-960005","previous_status":"pending_approval","reason":"Approved fixture","unknown":"hidden"}','2026-08-30T12:00:00Z'),
 ('f6000000-0000-4000-8000-000000000002','b6000000-0000-4000-8000-000000000001','user','b6000000-0000-4000-8000-000000000005','role.assigned','server','96000000-0000-4000-8000-000000000002','{"user_role_id":"internal","role_id":"10000000-0000-0000-0000-000000000004","scope_type":"global"}','2026-08-30T12:00:00Z'),
 ('f6000000-0000-4000-8000-000000000003','b6000000-0000-4000-8000-000000000001','department',null,'department.created','database',null,'{"code":"operations","name":"Operations"}','2026-08-30T11:00:00Z'),
 ('f6000000-0000-4000-8000-000000000004',null,'system',null,'policy.reconciled','operator',null,'{"token":"hidden"}','2026-08-29T10:00:00Z');

select ok(not has_table_privilege('authenticated','public.audit_events','SELECT'),'authenticated browser has no direct audit table read');
select ok(has_function_privilege('authenticated','public.list_audit_events(integer,timestamptz,uuid,text,text,uuid,text,uuid,timestamptz,timestamptz)','EXECUTE'),'authenticated may invoke protected global audit RPC');
select ok(has_function_privilege('authenticated','public.get_user_audit_history(uuid,integer,timestamptz,uuid)','EXECUTE'),'authenticated may invoke protected user history RPC');
select ok(not has_function_privilege('anon','public.list_audit_events(integer,timestamptz,uuid,text,text,uuid,text,uuid,timestamptz,timestamptz)','EXECUTE'),'anon cannot invoke global audit RPC');
select ok(not has_function_privilege('service_role','public.get_user_audit_history(uuid,integer,timestamptz,uuid)','EXECUTE'),'service_role has no explicit user history execution');
select is((select proowner::regrole::text from pg_proc where oid='public.list_audit_events(integer,timestamptz,uuid,text,text,uuid,text,uuid,timestamptz,timestamptz)'::regprocedure),'postgres','audit RPC owner is postgres');
select is((select proconfig[1] from pg_proc where oid='public.list_audit_events(integer,timestamptz,uuid,text,text,uuid,text,uuid,timestamptz,timestamptz)'::regprocedure),'search_path=pg_catalog','audit RPC fixes search_path');
select ok((select prosecdef from pg_proc where oid='public.get_user_audit_history(uuid,integer,timestamptz,uuid)'::regprocedure),'user history is SECURITY DEFINER');

select set_config('request.jwt.claim.sub','',true);
select throws_ok($$select * from public.list_audit_events()$$,'28000',null,'anonymous JWT context is rejected');

select set_config('request.jwt.claim.sub','a6000000-0000-4000-8000-000000000005',true);
select throws_ok($$select * from public.list_audit_events()$$,'42501',null,'missing admin.access rejects global history');

select set_config('request.jwt.claim.sub','a6000000-0000-4000-8000-000000000002',true);
select throws_ok($$select * from public.list_audit_events()$$,'42501',null,'missing audit.view rejects global history');
select throws_ok($$select * from public.get_user_audit_history('b6000000-0000-4000-8000-000000000005')$$,'42501',null,'missing audit.view rejects user history');

select set_config('request.jwt.claim.sub','a6000000-0000-4000-8000-000000000003',true);
select is((select count(*) from public.list_audit_events()),4::bigint,'admin.access plus audit.view may read global Audit without users.view');
select throws_ok($$select * from public.get_user_audit_history('b6000000-0000-4000-8000-000000000005')$$,'42501',null,'user history additionally requires users.view');

select set_config('request.jwt.claim.sub','a6000000-0000-4000-8000-000000000004',true);
select throws_ok($$select * from public.list_audit_events()$$,'42501',null,'inactive operator is rejected despite catalog grants');

select set_config('request.jwt.claim.sub','a6000000-0000-4000-8000-000000000001',true);
select is((select event_id from public.list_audit_events(1)), 'f6000000-0000-4000-8000-000000000002'::uuid,'same-timestamp page order uses descending event id');
select is((select has_more from public.list_audit_events(1)),true,'first bounded page advertises more events');
select is((select event_id from public.list_audit_events(1,'2026-08-30T12:00:00Z','f6000000-0000-4000-8000-000000000002')), 'f6000000-0000-4000-8000-000000000001'::uuid,'keyset cursor returns the exact next event without duplication');
select is((select count(*) from public.list_audit_events(25,null,null,'account')),1::bigint,'category filter is server-authoritative');
select is((select count(*) from public.list_audit_events(25,null,null,'organization')),1::bigint,'organization category returns canonical department and team events');
select is((select count(*) from public.list_audit_events(25,null,null,null,'missing.event')),0::bigint,'valid filters preserve an empty audit result');
select is((select count(*) from public.list_audit_events(25,null,null,null,'role.assigned')),1::bigint,'action filter is exact');
select is((select count(*) from public.list_audit_events(25,null,null,null,null,'b6000000-0000-4000-8000-000000000001')),3::bigint,'actor filter is exact');
select is((select count(*) from public.list_audit_events(25,null,null,null,null,null,null,null,'2026-08-30T11:30:00Z','2026-08-30T12:30:00Z')),2::bigint,'date range is inclusive and server-filtered');
select is((select count(*) from public.get_user_audit_history('b6000000-0000-4000-8000-000000000005')),2::bigint,'user history is bound to one target');
select is((select actor_display_name from public.get_user_audit_history('b6000000-0000-4000-8000-000000000005',1)), 'Audit Super','actor identity is resolved to a safe display value');
select is((select target_employee_id from public.get_user_audit_history('b6000000-0000-4000-8000-000000000005',1)), 'KK-960005','target employee ID is resolved server-side');
select is((select reason from public.list_audit_events(25,null,null,null,'account.approved')), 'Approved fixture','bounded audit note is available');
select ok(not ((select safe_metadata from public.list_audit_events(25,null,null,null,'account.approved')) ?| array['auth_user_id','employee_id','unknown']),'unsafe metadata keys are removed');
select ok(not ((select safe_metadata from public.list_audit_events(25,null,null,null,'role.assigned')) ? 'user_role_id'),'internal assignment ID is removed');
select is((select safe_metadata ->> 'scope_type' from public.list_audit_events(25,null,null,null,'role.assigned')), 'global','allowlisted scope metadata remains available');
select is((select target_name from public.list_audit_events(25,null,null,null,'policy.reconciled')), 'system','unknown event types have a safe fallback target');
select throws_ok($$select * from public.list_audit_events(0)$$,'22023',null,'zero page size is rejected');
select throws_ok($$select * from public.list_audit_events(101)$$,'22023',null,'oversized page is rejected');
select throws_ok($$select * from public.list_audit_events(25,now(),null)$$,'22023',null,'partial keyset cursor is rejected');
select throws_ok($$select * from public.list_audit_events(25,null,null,'secrets')$$,'22023',null,'unsupported category is rejected');
select throws_ok($$select * from public.get_user_audit_history('b6999999-0000-4000-8000-000000000099')$$,'P0002',null,'missing history target is rejected');
select is((select count(*) from public.audit_events),4::bigint,'read-only calls create no audit side effects');

set local role authenticated;
select set_config('request.jwt.claim.sub','a6000000-0000-4000-8000-000000000001',true);
select throws_ok($$select count(*) from public.audit_events$$,'42501',null,'browser cannot bypass the protected RPC with direct SELECT');
select throws_ok($$update public.audit_events set action='browser.tamper'$$,'42501',null,'authenticated browser cannot update audit rows');
select throws_ok($$delete from public.audit_events$$,'42501',null,'authenticated browser cannot delete audit rows');
reset role;
select throws_ok($$update public.audit_events set action='tampered' where id='f6000000-0000-4000-8000-000000000001'$$,'P0001',null,'audit ledger remains append-only for UPDATE');
select throws_ok($$delete from public.audit_events where id='f6000000-0000-4000-8000-000000000001'$$,'P0001',null,'audit ledger remains append-only for DELETE');

select * from finish();
rollback;
