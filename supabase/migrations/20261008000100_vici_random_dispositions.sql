-- Additive blind audio practice. Existing publications, identities and results stay intact.
begin;
alter table public.training_vici_challenges drop constraint training_vici_challenges_scenario_check;
alter table public.training_vici_challenges add constraint training_vici_challenges_scenario_check check(scenario in ('login','callback','english','spxfer','asia','dead_air','answering','mailbox_full','mock','random'));
alter table public.training_vici_challenges drop constraint training_vici_challenges_workflow_version_check;
alter table public.training_vici_challenges add constraint training_vici_challenges_workflow_version_check check(workflow_version in (1,2,3,4) and (workflow_version=4)=(scenario='random'));
create table public.training_vici_random_cases(
 content_id uuid primary key references public.training_content(id) on delete restrict,
 disposition text not null check(disposition in ('A','DAIR','DNC','NI','CALLBK','SPANIS')),
 explanation text not null check(length(btrim(explanation)) between 2 and 1000)
);
alter table public.training_vici_random_cases enable row level security;
revoke all on public.training_vici_random_cases from public,anon,authenticated,service_role;
create function pulse_private.guard_vici_random_case() returns trigger language plpgsql security definer set search_path=pg_catalog as $fn$
begin
 if not exists(select 1 from public.training_content where id=coalesce(new.content_id,old.content_id) and content_type='simulation' and status='draft') then raise exception 'editable simulation draft required' using errcode='55000'; end if;
 if tg_op='UPDATE' and new.content_id<>old.content_id then raise exception 'case identity immutable' using errcode='55000'; end if;
 return coalesce(new,old);
end $fn$;
create trigger vici_random_case_draft_guard before insert or update or delete on public.training_vici_random_cases for each row execute function pulse_private.guard_vici_random_case();
create function public.configure_vici_random_case(requested_content_id uuid,requested_disposition text,requested_explanation text,expected_updated_at timestamptz)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $fn$
declare item public.training_content%rowtype; actor uuid;
begin
 select * into item from public.training_content where id=requested_content_id for update;
 actor:=pulse_private.require_training_content_permission('studio.create',requested_content_id);
 if item.status is distinct from 'draft' or item.content_type is distinct from 'simulation' then raise exception 'simulation draft required' using errcode='55000'; end if;
 if item.created_by_user_id<>actor and not pulse_private.has_training_content_permission('academy.manage',item.id) then raise exception 'draft owner or manager required' using errcode='42501'; end if;
 if expected_updated_at is null or item.updated_at is distinct from expected_updated_at then raise exception 'draft changed' using errcode='40001'; end if;
 if requested_disposition is null or requested_disposition not in ('A','DAIR','DNC','NI','CALLBK','SPANIS') or requested_explanation is null or length(btrim(requested_explanation)) not between 2 and 1000 then raise exception 'reviewed disposition and explanation required' using errcode='22023'; end if;
 insert into public.training_vici_challenges(content_id,scenario,workflow_version) values(item.id,'random',4) on conflict(content_id) do update set scenario='random',workflow_version=4;
 insert into public.training_vici_random_cases values(item.id,requested_disposition,btrim(requested_explanation)) on conflict(content_id) do update set disposition=excluded.disposition,explanation=excluded.explanation;
 update public.training_content set title='Random Dispositions',description=null,updated_at=clock_timestamp() where id=item.id returning * into item;
 insert into public.audit_events(actor_user_id,target_type,target_id,action,source,metadata) values(actor,'training_content',item.id,'training.vici_random_configured','database',jsonb_build_object('workflow_version',4));
 return jsonb_build_object('id',item.id,'updated_at',item.updated_at);
end $fn$;
create function pulse_private.validate_vici_random(content uuid) returns void language plpgsql security definer set search_path=pg_catalog as $fn$
declare golden text; actual text[]; kinds text[];
begin
 select disposition into golden from public.training_vici_random_cases where content_id=content;
 if golden is null or not exists(select 1 from public.training_content where id=content and title='Random Dispositions' and description is null)
 or not exists(select 1 from public.training_vici_audio where content_id=content and cue='customer') or exists(select 1 from public.training_vici_audio where content_id=content and cue<>'customer') then raise exception 'generic title and private customer clip required' using errcode='23514'; end if;
 if exists(select 1 from public.training_content_position_targets where content_id=content) or not exists(select 1 from public.training_content_audiences where content_id=content)
 or exists(select 1 from public.training_content_audiences a left join public.teams t on t.id=a.team_id left join public.operating_units u on u.id=t.operating_unit_id left join public.campaigns c on c.id=t.campaign_id where a.content_id=content and
 (a.scope_type<>'team' or t.id is null or u.id is null or c.id is null or not t.is_active or not u.is_active or not c.is_active or u.code<>'openers' or u.campaign_id<>c.id or t.code not in ('asia_team_a','asia_team_b','philippines','mexico_team_group_a','mexico_team_group_b','colombia','central_america','venezuela') or golden='SPANIS' and t.code not in ('asia_team_a','asia_team_b','philippines','mexico_team_group_a','mexico_team_group_b'))) then raise exception 'matching active Opener teams required' using errcode='23514'; end if;
 select array_agg(expected_value order by position),array_agg(interaction order by position) into actual,kinds from public.training_simulation_steps where content_id=content;
 if actual is distinct from array[null,golden,'submit']::text[] or kinds is distinct from array['info','select','click']::text[] or exists(select 1 from public.training_simulation_steps where content_id=content and branches<>'{}'::jsonb) then raise exception 'reviewed random workflow required' using errcode='23514'; end if;
end $fn$;
do $publication$
declare source text;
begin
 source:=pg_get_functiondef('pulse_private.validate_vici_publication()'::regprocedure);
 if position('if protocol=3 then' in source)=0 then raise exception 'review existing publication contract' using errcode='55000'; end if;
 execute replace(source,'if protocol=3 then','if protocol=4 then perform pulse_private.validate_vici_random(new.id); return new; end if; if protocol=3 then');
 source:=pg_get_functiondef('pulse_private.guard_vici_audio()'::regprocedure);
 execute replace(source,'workflow_version=3','workflow_version in (3,4)');
end $publication$;
create function pulse_private.clone_vici_random_case() returns trigger language plpgsql security definer set search_path=pg_catalog as $fn$
begin
 if new.content_type='simulation' and new.version_number>1 then insert into public.training_vici_random_cases select new.id,r.disposition,r.explanation from public.training_vici_random_cases r join public.training_content c on c.id=r.content_id where c.game_id=new.game_id and c.is_current and c.status='published'; end if;
 return new;
end $fn$;
create trigger vici_z_random_revision_clone after insert on public.training_content for each row execute function pulse_private.clone_vici_random_case();
-- Display-only correction: keep the original form fields blank, never fabricate vehicle details.
do $customer$
declare source text;
begin
 source:=pg_get_functiondef('pulse_private.vici_customer(integer)'::regprocedure);
 execute replace(source,'pulse_private.vici_customer(','pulse_private.vici_customer_prior(');
end $customer$;
create or replace function pulse_private.vici_customer(customer_index integer) returns jsonb language sql immutable set search_path=pg_catalog as $fn$
 select pulse_private.vici_customer_prior(customer_index)||jsonb_build_object('year','','make','','model','','odometer','') $fn$;
do $clones$
declare signature text; source text;
begin
 foreach signature in array array['pulse_private.simulation_snapshot(uuid,uuid)','public.agent_submit_vici_command(uuid,uuid,integer,uuid,text,text)','pulse_private.can_read_vici_audio(uuid,uuid,uuid,uuid)','public.get_simulation_authoring(uuid)'] loop
 source:=pg_get_functiondef(signature::regprocedure); execute replace(source,split_part(signature,'(',1)||'(',split_part(signature,'(',1)||'_before_random(');
 end loop;
end $clones$;
create or replace function pulse_private.simulation_snapshot(requested_attempt_id uuid,requested_agent_id uuid)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $fn$
declare snap jsonb; session public.training_vici_sessions%rowtype; content uuid; protocol integer;
begin
 -- The foundation still enforces ownership, current eligibility, and immutable result reads.
 snap:=pulse_private.simulation_snapshot_foundation(requested_attempt_id,requested_agent_id); content:=(snap->>'content_id')::uuid;
 select workflow_version into protocol from public.training_vici_challenges where content_id=content;
 if protocol is distinct from 4 then return pulse_private.simulation_snapshot_before_random(requested_attempt_id,requested_agent_id); end if;
 select * into session from public.training_vici_sessions where attempt_id=requested_attempt_id;
 return (snap-'step'-'position'-'hint')||jsonb_build_object('title','Random Dispositions','situation',null,
 'challenge',jsonb_build_object('scenario','random','workflow_version',4),
 'dialer',jsonb_build_object('phase','call_disposition','is_paused',false,'pause_menu',false,'call_disposition',session.call_disposition,'customer',pulse_private.vici_customer(coalesce(session.customer_index,0))),
 'audio',case when snap->>'status'='started' then coalesce((select jsonb_agg(jsonb_build_object('cue','customer','media_id',media_id)) from public.training_vici_audio where content_id=content and cue='customer'),'[]') else '[]'::jsonb end);
end $fn$;
create or replace function public.agent_submit_vici_command(requested_agent_id uuid,requested_attempt_id uuid,expected_state_version integer,requested_request_id uuid,requested_command text,requested_value text default null)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $fn$
declare snap jsonb; state public.training_simulation_attempts%rowtype; session public.training_vici_sessions%rowtype; step public.training_simulation_steps%rowtype; result jsonb; golden text; explanation text;
begin
 if not coalesce(pulse_private.active_simulation_opener(requested_agent_id),false) then raise exception 'active Opener required' using errcode='42501'; end if;
 perform 1 from public.training_attempts where id=requested_attempt_id for update;
 snap:=pulse_private.simulation_snapshot(requested_attempt_id,requested_agent_id);
 if snap->'challenge'->>'workflow_version' is distinct from '4' then return public.agent_submit_vici_command_before_random(requested_agent_id,requested_attempt_id,expected_state_version,requested_request_id,requested_command,requested_value); end if;
 if requested_request_id is null or expected_state_version is null or requested_command is null or requested_command not in ('callDisposition','submit') or length(coalesce(requested_value,''))>100 then raise exception 'bounded disposition command required' using errcode='22023'; end if;
 if exists(select 1 from public.training_simulation_events where attempt_id=requested_attempt_id and request_id=requested_request_id) or exists(select 1 from public.training_vici_control_events where attempt_id=requested_attempt_id and request_id=requested_request_id) then return snap||jsonb_build_object('duplicate',true); end if;
 select * into state from public.training_simulation_attempts where attempt_id=requested_attempt_id;
 if state.state_version<>expected_state_version then raise exception 'saved state changed' using errcode='40001'; end if;
 if snap->>'status'<>'started' or state.state_version>=20000 then raise exception 'restart this practice' using errcode='55000'; end if;
 insert into public.training_vici_sessions(attempt_id,is_paused) values(requested_attempt_id,false) on conflict do nothing;
 select * into session from public.training_vici_sessions where attempt_id=requested_attempt_id;
 if requested_command='callDisposition' then
 if requested_value is null or requested_value not in ('A','B','BLANK','CALLBK','Custo','DAIR','DC','DEC','DNC','Flip','N','NI','NP','PDSALE','SALE','SPXFER','WN','WRNGVE','XFER','SPANIS','LANG','WRGNUM','WRGVEH') then raise exception 'known disposition required' using errcode='22023'; end if;
 update public.training_vici_sessions set call_disposition=requested_value where attempt_id=requested_attempt_id;
 update public.training_simulation_attempts set state_version=state_version+1 where attempt_id=requested_attempt_id;
 insert into public.training_vici_control_events(attempt_id,request_id,command) values(requested_attempt_id,requested_request_id,'callDisposition');
 return pulse_private.simulation_snapshot(requested_attempt_id,requested_agent_id);
 end if;
 if session.call_disposition is null or requested_value is null or requested_value not in ('active','paused') then raise exception 'choose a disposition before Submit' using errcode='22023'; end if;
 select r.disposition,r.explanation into golden,explanation from public.training_vici_random_cases r where content_id=(snap->>'content_id')::uuid;
 select * into step from public.training_simulation_steps where content_id=(snap->>'content_id')::uuid and position=state.current_position;
 result:=pulse_private.simulation_action_foundation(requested_attempt_id,requested_agent_id,step.id,state.state_version,requested_request_id,'answer',to_jsonb(session.call_disposition));
 if result->>'correct'='true' then
 select * into step from public.training_simulation_steps where content_id=(snap->>'content_id')::uuid and position=3;
 result:=pulse_private.simulation_action_foundation(requested_attempt_id,requested_agent_id,step.id,(result->>'state_version')::integer,md5(requested_request_id::text||':random-submit')::uuid,'answer','"submit"'::jsonb);
 update public.training_vici_sessions set is_paused=requested_value='paused' where attempt_id=requested_attempt_id;
 end if;
 return result-'feedback'||jsonb_build_object('feedback',case when result->>'correct'='true' then 'Correct. ' else 'Not correct. ' end||explanation,'review',jsonb_build_object('disposition',golden,'explanation',explanation));
end $fn$;
create function public.agent_assign_vici_random(requested_agent_id uuid) returns jsonb language plpgsql security definer set search_path=pg_catalog as $fn$
declare item uuid; snap jsonb;
begin
 if not coalesce(pulse_private.active_simulation_opener(requested_agent_id),false) then raise exception 'active Opener required' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended('vici-random:'||requested_agent_id::text,0));
 select c.id into item from public.training_content c join public.training_vici_challenges v on v.content_id=c.id and v.workflow_version=4 join public.training_content_audiences audience on audience.content_id=c.id and audience.scope_type='team' join public.agents a on a.id=requested_agent_id and a.team_id=audience.team_id where c.status='published' and c.is_current and c.content_type='simulation'
 order by (c.id=(select t.content_id from public.training_attempts t join public.training_agent_learner_links l on l.learner_id=t.learner_id where l.agent_id=requested_agent_id and t.source_mode='simulation' order by t.started_at desc limit 1)) asc nulls first,random() limit 1;
 if item is null then raise exception 'no published random clips for this team' using errcode='P0002'; end if;
 -- Next call closes only this Opener's unfinished Random attempts, never manual practices.
 update public.training_attempts attempt set status='abandoned',completed_at=clock_timestamp(),duration_seconds=greatest(0,floor(extract(epoch from clock_timestamp()-attempt.started_at))::integer)
 from public.training_agent_learner_links link,public.training_vici_challenges challenge
 where attempt.learner_id=link.learner_id and link.agent_id=requested_agent_id and attempt.content_id=challenge.content_id and challenge.workflow_version=4 and attempt.source_mode='simulation' and attempt.status='started';
 snap:=pulse_private.start_simulation(item,requested_agent_id,true);
 update public.training_simulation_attempts set selection_mode='assigned' where attempt_id=(snap->>'attempt_id')::uuid;
 return pulse_private.simulation_snapshot((snap->>'attempt_id')::uuid,requested_agent_id);
end $fn$;
-- Random learners may request the next case, never choose a known case ID.
do $start_clone$
declare source text;
begin
 source:=pg_get_functiondef('public.agent_start_simulation(uuid,uuid,boolean)'::regprocedure);
 execute replace(source,'public.agent_start_simulation(','public.agent_start_simulation_before_random(');
end $start_clone$;
create or replace function public.agent_start_simulation(requested_agent_id uuid,requested_content_id uuid,requested_restart boolean default false)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $fn$
begin
 if not coalesce(pulse_private.active_simulation_opener(requested_agent_id),false) then raise exception 'active Opener required' using errcode='42501'; end if;
 if exists(select 1 from public.training_vici_challenges where content_id=requested_content_id and workflow_version=4) then raise exception 'use server-selected Random Dispositions' using errcode='42501'; end if;
 return public.agent_start_simulation_before_random(requested_agent_id,requested_content_id,requested_restart);
end $fn$;
create or replace function pulse_private.can_read_vici_audio(requested_agent_id uuid,requested_media_id uuid,requested_content_id uuid,requested_attempt_id uuid)
returns boolean language plpgsql security definer set search_path=pg_catalog as $fn$
declare snap jsonb;
begin
 if requested_agent_id is null then return pulse_private.can_read_vici_audio_before_random(requested_agent_id,requested_media_id,requested_content_id,requested_attempt_id); end if;
 snap:=pulse_private.simulation_snapshot(requested_attempt_id,requested_agent_id);
 if snap->'challenge'->>'workflow_version' is distinct from '4' then return pulse_private.can_read_vici_audio_before_random(requested_agent_id,requested_media_id,requested_content_id,requested_attempt_id); end if;
 return snap->>'status'='started' and (snap->>'content_id')::uuid=requested_content_id and exists(select 1 from public.training_vici_audio v join public.training_media m on m.id=v.media_id where v.content_id=requested_content_id and v.media_id=requested_media_id and v.cue='customer' and m.status='ready' and m.media_kind='simulation_audio' and m.mime_type='audio/wav' and m.storage_bucket='training-media');
end $fn$;
-- Staff's scoped reference sessions never create learners, attempts or results.
create table pulse_private.vici_random_references(id uuid primary key default gen_random_uuid(),staff_id uuid not null references public.users(id),content_id uuid not null references public.training_content(id),expires_at timestamptz not null default clock_timestamp()+interval '1 hour',state_version integer not null default 1,review jsonb);
create table pulse_private.vici_random_reference_events(reference_id uuid not null references pulse_private.vici_random_references(id) on delete cascade,request_id uuid not null,primary key(reference_id,request_id));
alter table pulse_private.vici_random_references enable row level security;
alter table pulse_private.vici_random_reference_events enable row level security;
revoke all on pulse_private.vici_random_references,pulse_private.vici_random_reference_events from public,anon,authenticated,service_role;
create function pulse_private.vici_random_reference_snapshot(reference_id uuid) returns jsonb language plpgsql security definer set search_path=pg_catalog as $fn$
declare ref pulse_private.vici_random_references%rowtype;
begin
 select * into ref from pulse_private.vici_random_references where id=reference_id and staff_id=pulse_private.current_training_staff_user_id() and expires_at>clock_timestamp();
 if not found or not pulse_private.can_read_training_authoring(ref.content_id) then raise exception 'own active scoped reference required' using errcode='42501'; end if;
 return jsonb_build_object('reference_id',ref.id,'content_id',ref.content_id,'state_version',ref.state_version,'status',case when ref.review is null then 'started' else 'completed' end,
 'audio',coalesce((select jsonb_agg(jsonb_build_object('cue','customer','media_id',media_id)) from public.training_vici_audio where content_id=ref.content_id and cue='customer'),'[]'),
 'dialer',jsonb_build_object('phase','call_disposition','customer',pulse_private.vici_customer(0),'call_disposition',null),'review',ref.review);
end $fn$;
create function public.start_vici_random_reference() returns jsonb language plpgsql security definer set search_path=pg_catalog as $fn$
declare actor uuid:=pulse_private.current_training_staff_user_id(); item uuid; reference uuid;
begin
 if actor is null then raise exception 'active Staff required' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended('vici-reference:'||actor::text,0));
 delete from pulse_private.vici_random_references where staff_id=actor and expires_at<=clock_timestamp();
 if (select count(*) from pulse_private.vici_random_references where staff_id=actor)>200 then raise exception 'reference limit; retry later' using errcode='22023'; end if;
 select c.id into item from public.training_content c join public.training_vici_challenges v on v.content_id=c.id and v.workflow_version=4 join public.training_vici_audio au on au.content_id=c.id and au.cue='customer' where c.status='published' and c.is_current and pulse_private.can_read_training_authoring(c.id)
 order by (c.id=(select content_id from pulse_private.vici_random_references where staff_id=actor order by expires_at desc limit 1)) asc nulls first,random() limit 1;
 if item is null then raise exception 'no published private random clips available' using errcode='P0002'; end if;
 insert into pulse_private.vici_random_references(staff_id,content_id) values(actor,item) returning id into reference;
 return pulse_private.vici_random_reference_snapshot(reference);
end $fn$;
create function public.submit_vici_random_reference(requested_reference_id uuid,expected_state_version integer,requested_request_id uuid,requested_disposition text) returns jsonb language plpgsql security definer set search_path=pg_catalog as $fn$
declare snap jsonb; ref pulse_private.vici_random_references%rowtype; golden public.training_vici_random_cases%rowtype;
begin
 perform 1 from pulse_private.vici_random_references where id=requested_reference_id for update;
 snap:=pulse_private.vici_random_reference_snapshot(requested_reference_id);
 if requested_request_id is null or expected_state_version is null or requested_disposition is null or length(requested_disposition)>100 then raise exception 'bounded reference Submit required' using errcode='22023'; end if;
 if exists(select 1 from pulse_private.vici_random_reference_events where reference_id=requested_reference_id and request_id=requested_request_id) then return snap||jsonb_build_object('duplicate',true); end if;
 select * into ref from pulse_private.vici_random_references where id=requested_reference_id;
 if ref.state_version<>expected_state_version then raise exception 'reference changed' using errcode='40001'; end if;
 if ref.review is not null then raise exception 'reference complete; choose next call' using errcode='55000'; end if;
 select * into golden from public.training_vici_random_cases where content_id=ref.content_id;
 update pulse_private.vici_random_references set state_version=state_version+1,review=jsonb_build_object('correct',requested_disposition=golden.disposition,'disposition',golden.disposition,'explanation',golden.explanation) where id=ref.id;
 insert into pulse_private.vici_random_reference_events values(ref.id,requested_request_id);
 return pulse_private.vici_random_reference_snapshot(ref.id);
end $fn$;
create or replace function public.get_simulation_authoring(requested_content_id uuid) returns jsonb language plpgsql stable security definer set search_path=pg_catalog as $fn$
begin
 return public.get_simulation_authoring_before_random(requested_content_id)||jsonb_build_object('random_case',(select jsonb_build_object('disposition',disposition,'explanation',explanation) from public.training_vici_random_cases where content_id=requested_content_id));
end $fn$;
-- Browser users cannot execute trusted Agent RPCs or inspect internal helpers.
do $grants$
declare f record;
begin
 for f in select p.oid::regprocedure signature,n.nspname,p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','pulse_private') and (p.proname like '%random%' or p.proname in ('vici_customer','vici_customer_prior','simulation_snapshot','agent_submit_vici_command','can_read_vici_audio')) loop
 execute 'alter function '||f.signature||' owner to postgres'; execute 'revoke all on function '||f.signature||' from public,anon,authenticated,service_role';
 if f.nspname='public' and f.proname in ('agent_assign_vici_random','agent_submit_vici_command') then execute 'grant execute on function '||f.signature||' to service_role';
 elsif f.nspname='public' and f.proname in ('configure_vici_random_case','start_vici_random_reference','submit_vici_random_reference','get_simulation_authoring') then execute 'grant execute on function '||f.signature||' to authenticated'; end if;
 end loop;
end $grants$;
-- Existing authenticated authoring RPC retains its permissions after replacement.
revoke all on function public.get_simulation_authoring(uuid) from public,anon,service_role;
grant execute on function public.get_simulation_authoring(uuid) to authenticated;
grant execute on function public.can_read_vici_audio(uuid,uuid) to authenticated;
notify pgrst,'reload schema';
commit;
