begin;
set local search_path=extensions,public;
select no_plan();
insert into public.business_areas(id,code,name) values('ba520000-0000-4000-8000-000000000001','admin2_directory','ADMIN-2 Business Area');
insert into public.departments(id,business_area_id,code,name) values('d2520000-0000-4000-8000-000000000001','ba520000-0000-4000-8000-000000000001','admin2_directory','ADMIN-2 Directory');
insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values('a2520000-0000-4000-8000-000000000001','authenticated','authenticated','admin2.directory@example.test','',now(),'{}','{}',now(),now());
insert into public.users(id,auth_user_id,email,full_name,status,department_id,employee_id,approved_at)
values('b2520000-0000-4000-8000-000000000001','a2520000-0000-4000-8000-000000000001','admin2.directory@example.test','ADMIN-2 Directory Operator','active','d2520000-0000-4000-8000-000000000001','KK-925201',now());
insert into public.user_roles(user_id,role_id,scope_type)
values('b2520000-0000-4000-8000-000000000001','10000000-0000-0000-0000-000000000010','global');
select set_config('request.jwt.claim.sub','a2520000-0000-4000-8000-000000000001',true);
insert into public.campaigns(id,business_area_id,code,name) values('c2520000-0000-4000-8000-000000000001','ba520000-0000-4000-8000-000000000001','admin2_directory','ADMIN-2 Campaign');
insert into public.operating_units(id,business_area_id,campaign_id,code,name) values('02520000-0000-4000-8000-000000000001','ba520000-0000-4000-8000-000000000001','c2520000-0000-4000-8000-000000000001','openers','Openers');
insert into public.teams(id,business_area_id,department_id,campaign_id,operating_unit_id,code,name)
values('e2520000-0000-4000-8000-000000000001','ba520000-0000-4000-8000-000000000001','d2520000-0000-4000-8000-000000000001','c2520000-0000-4000-8000-000000000001','02520000-0000-4000-8000-000000000001','asia_team_a','Asia Team A');
insert into public.agents(id,agent_code,display_name,team_id,status) values
 ('f2520000-0000-4000-8000-000000000001','992001','María Directory','e2520000-0000-4000-8000-000000000001','active'),
 ('f2520000-0000-4000-8000-000000000002','992002','Second Directory','e2520000-0000-4000-8000-000000000001','blocked');
insert into public.agent_credentials(agent_id,pin_hash) values('f2520000-0000-4000-8000-000000000001',null);
select is(public.list_admin_agents()->'agents'->0->>'status','pending_activation','unactivated Agent is pending, not misleadingly Active');
select is(public.list_admin_agents()->'agents'->0->>'agent_code','992001','directory returns canonical Agent ID');
select is(public.list_admin_agents()->'agents'->0->>'team_code','asia_team_a','canonical team identity drives gradients and profile links');
select ok(not (public.list_admin_agents()->'agents'->0 ?| array['id','pin_hash','session_token','activation_code','auth_user_id']),'Agent read never returns private credentials or internal identity UUID');
select is(jsonb_array_length(public.list_admin_agents('María',null,null,null,50)->'agents'),1,'canonical name search works');
select is(jsonb_array_length(public.list_admin_agents(null,null,'blocked',null,50)->'agents'),1,'status filter works');
select is(jsonb_array_length(public.list_admin_agents(null,'e2520000-0000-4000-8000-000000000009',null,null,50)->'agents'),0,'unknown team cannot leak unrelated Agent rows');
select is(public.list_admin_agents(null,null,null,null,1)->>'has_more','true','bounded pagination advertises next page');
select is(public.list_admin_agents(null,null,null,'992001',1)->'agents'->0->>'agent_code','992002','cursor advances without duplicating the first Agent');
select throws_ok($$select public.list_admin_agents(null,null,null,null,null)$$,'22023',null,'NULL limit cannot bypass the directory bound');
select throws_ok($$select public.list_admin_agents(null,null,'super_admin',null,50)$$,'22023',null,'invalid state rejected by server');
update public.agent_credentials set pin_hash=extensions.crypt('135790',extensions.gen_salt('bf',4)) where agent_id='f2520000-0000-4000-8000-000000000001';
select is(public.list_admin_agents()->'agents'->0->>'status','active','fresh canonical read automatically reflects completed activation');

insert into public.staff_invitations(id,email_normalized,full_name,status,expires_at,created_by_user_id,department_id,role_id,scope_type,request_key,sent_at,revoked_at,accepted_at,failed_at)
select ('12520000-0000-4000-8000-'||lpad(number::text,12,'0'))::uuid,'admin2.invite.'||number||'@example.test','ADMIN-2 Invitation '||number,
 case when number=2 then 'expired' when number=3 then 'failed' when number=4 then 'sent' when number=5 then 'accepted' else 'revoked' end,
 now()+interval '24 hours','b2520000-0000-4000-8000-000000000001','d2520000-0000-4000-8000-000000000001',
 '10000000-0000-0000-0000-000000000001','global',gen_random_uuid(),now(),now(),case when number=5 then now() else null end,now()
from generate_series(1,7) number;
update public.staff_invitations set previous_invitation_id='12520000-0000-4000-8000-000000000006' where id='12520000-0000-4000-8000-000000000007';
insert into public.audit_events(actor_user_id,target_type,target_id,action,source)
values('b2520000-0000-4000-8000-000000000001','staff_invitation','12520000-0000-4000-8000-000000000003','staff_invitation.created','server');
select is((select count(*) from public.list_staff_invitations('current',50)),1::bigint,'default invitation read filters before its bound to current pending/active records');
select throws_ok($$select public.remove_staff_invitation('12520000-0000-4000-8000-000000000004',(select updated_at from public.staff_invitations where id='12520000-0000-4000-8000-000000000004'),'REMOVE')$$,'55000',null,'live invitation must be revoked first');
select throws_ok($$select public.remove_staff_invitation('12520000-0000-4000-8000-000000000005',(select updated_at from public.staff_invitations where id='12520000-0000-4000-8000-000000000005'),'REMOVE')$$,'55000',null,'accepted invitation is not a Staff deletion backdoor');
select throws_ok($$select public.remove_staff_invitation('12520000-0000-4000-8000-000000000001',now(),'YES')$$,'22023',null,'invitation cleanup requires deliberate confirmation');
select throws_ok($$select public.remove_staff_invitation('12520000-0000-4000-8000-000000000001','2000-01-01','REMOVE')$$,'55000',null,'stale invitation cannot be deleted');
select lives_ok($$select public.remove_staff_invitation('12520000-0000-4000-8000-000000000001',(select updated_at from public.staff_invitations where id='12520000-0000-4000-8000-000000000001'),'REMOVE')$$,'dependency-free revoked invitation can be purged');
select is((select count(*) from public.staff_invitations where id='12520000-0000-4000-8000-000000000001'),0::bigint,'physical invitation purge actually removes the row');
select lives_ok($$select public.remove_staff_invitation('12520000-0000-4000-8000-000000000002',(select updated_at from public.staff_invitations where id='12520000-0000-4000-8000-000000000002'),'REMOVE')$$,'expired invitation can be removed');
select lives_ok($$select public.remove_staff_invitation('12520000-0000-4000-8000-000000000003',(select updated_at from public.staff_invitations where id='12520000-0000-4000-8000-000000000003'),'REMOVE')$$,'historical failed invitation can leave the list');
select ok((select removed_at is not null from public.staff_invitations where id='12520000-0000-4000-8000-000000000003'),'historical invitation row is retained internally');
select lives_ok($$select public.remove_staff_invitation('12520000-0000-4000-8000-000000000006',(select updated_at from public.staff_invitations where id='12520000-0000-4000-8000-000000000006'),'REMOVE')$$,'invitation chain root can be hidden safely');
select ok((select previous_invitation_id='12520000-0000-4000-8000-000000000006'::uuid from public.staff_invitations where id='12520000-0000-4000-8000-000000000007'),'history chain remains intact');
select is((select count(*) from public.list_staff_invitations(null,50) where invitation_id in ('12520000-0000-4000-8000-000000000003','12520000-0000-4000-8000-000000000006')),0::bigint,'All statuses does not resurface removed invitations');
select throws_ok($$update public.staff_invitations set status='pending_send' where id='12520000-0000-4000-8000-000000000006'$$,'55000',null,'removed invitation cannot be renewed in place');
select is((select count(*) from public.audit_events where action='staff_invitation.removed'),4::bigint,'every confirmed invitation cleanup is audited once');
create table public.admin2_invitation_dependency (invitation_id uuid references public.staff_invitations(id) on delete cascade);
insert into public.staff_invitations(id,email_normalized,full_name,status,expires_at,created_by_user_id,department_id,role_id,scope_type,request_key,revoked_at)
values('12520000-0000-4000-8000-000000000008','admin2.invite.8@example.test','ADMIN-2 Future FK','revoked',now(),'b2520000-0000-4000-8000-000000000001','d2520000-0000-4000-8000-000000000001','10000000-0000-0000-0000-000000000001','global',gen_random_uuid(),now());
insert into public.admin2_invitation_dependency values('12520000-0000-4000-8000-000000000008');
select lives_ok($$select public.remove_staff_invitation('12520000-0000-4000-8000-000000000008',(select updated_at from public.staff_invitations where id='12520000-0000-4000-8000-000000000008'),'REMOVE')$$,'unknown invitation FK can be hidden safely');
select is((select count(*) from public.admin2_invitation_dependency),1::bigint,'unknown ON DELETE CASCADE consumer remains intact');
select * from finish();
rollback;
