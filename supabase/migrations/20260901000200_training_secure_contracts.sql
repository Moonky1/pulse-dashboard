-- Pulse Training TRAIN-1B: secure contracts and Staff/Agent boundary.
-- Local and isolated only. No legacy Training tables are removed or modified.

-- Retire the ambiguous Staff RBAC role without deleting historical identity.
delete from public.role_grant_rules rule
using public.roles role
where rule.grantable_role_id = role.id and role.key = 'agent';

delete from public.role_permissions role_permission
using public.roles role, public.permissions permission
where role_permission.role_id = role.id
  and role_permission.permission_id = permission.id
  and role.key = 'agent'
  and permission.key in ('go.play', 'academy.view');

update public.roles
set
  name = 'Legacy Agent Staff Role (Deprecated)',
  description = 'Deprecated Staff RBAC compatibility role. Real operational Agents use the separate future Agent Identity domain.',
  is_active = false,
  updated_at = now()
where key = 'agent';

-- Exact question-to-Topic attribution supports server-calculated Topic results.
create table public.training_question_topics (
  question_id uuid not null,
  topic_id uuid not null,
  primary key (question_id, topic_id),
  constraint training_question_topics_question_fk foreign key (question_id)
    references public.training_questions(id) on update restrict on delete restrict,
  constraint training_question_topics_topic_fk foreign key (topic_id)
    references public.training_topics(id) on update restrict on delete restrict
);

create index training_question_topics_topic_idx
  on public.training_question_topics(topic_id, question_id);

alter table public.training_question_topics enable row level security;
revoke all on table public.training_question_topics from public, anon, authenticated;
grant all on table public.training_question_topics to service_role;

-- Answers are accepted once, scored by the database, and retained as immutable
-- Training history. The browser never supplies trusted correctness or score.
create table public.training_attempt_answers (
  attempt_id uuid not null,
  question_id uuid not null,
  submitted_answer jsonb not null,
  is_correct boolean not null,
  recorded_at timestamptz not null default now(),
  primary key (attempt_id, question_id),
  constraint training_attempt_answers_attempt_fk foreign key (attempt_id)
    references public.training_attempts(id) on update restrict on delete restrict,
  constraint training_attempt_answers_question_fk foreign key (question_id)
    references public.training_questions(id) on update restrict on delete restrict
);

create index training_attempt_answers_question_idx
  on public.training_attempt_answers(question_id, attempt_id);

alter table public.training_attempt_answers enable row level security;
revoke all on table public.training_attempt_answers from public, anon, authenticated;
grant all on table public.training_attempt_answers to service_role;

create function pulse_private.current_training_staff_user_id()
returns uuid
language plpgsql
stable
security definer
set search_path = pg_catalog
as $function$
declare
  actor_id uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  select staff.id into actor_id
  from public.users staff
  where staff.auth_user_id = auth.uid() and staff.status = 'active';

  if actor_id is null then
    raise exception 'active Staff identity required' using errcode = '42501';
  end if;
  return actor_id;
end
$function$;

create function pulse_private.has_any_training_permission(requested_permissions text[])
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $function$
  select exists (
    select 1
    from public.users staff
    join public.user_roles assignment on assignment.user_id = staff.id
    join public.roles role on role.id = assignment.role_id and role.is_active
    join public.role_permissions role_permission on role_permission.role_id = role.id
    join public.permissions permission
      on permission.id = role_permission.permission_id and permission.is_active
    where staff.auth_user_id = auth.uid()
      and staff.status = 'active'
      and permission.key = any(requested_permissions)
      and (
        assignment.scope_type = 'global'
        or (assignment.scope_type = 'department' and exists (
          select 1 from public.departments department
          where department.id = assignment.department_id and department.is_active
        ))
        or (assignment.scope_type = 'campaign' and exists (
          select 1 from public.campaigns campaign
          where campaign.id = assignment.campaign_id and campaign.is_active
        ))
        or (assignment.scope_type = 'team' and exists (
          select 1 from public.teams team
          where team.id = assignment.team_id and team.is_active
        ))
      )
  )
$function$;

create function pulse_private.has_training_target_permission(
  requested_permission text,
  requested_scope_type text,
  requested_campaign_id uuid,
  requested_team_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $function$
  select case
    when requested_scope_type = 'global'
      and requested_campaign_id is null and requested_team_id is null then exists (
        select 1
        from public.users staff
        join public.user_roles assignment on assignment.user_id = staff.id and assignment.scope_type = 'global'
        join public.roles role on role.id = assignment.role_id and role.is_active
        join public.role_permissions role_permission on role_permission.role_id = role.id
        join public.permissions permission on permission.id = role_permission.permission_id and permission.is_active
        where staff.auth_user_id = auth.uid() and staff.status = 'active'
          and permission.key = requested_permission
      )
    when requested_scope_type = 'campaign'
      and requested_campaign_id is not null and requested_team_id is null
      then pulse_private.has_permission(requested_permission,null,requested_campaign_id,null)
    when requested_scope_type = 'team'
      and requested_campaign_id is null and requested_team_id is not null
      then pulse_private.has_permission(requested_permission,null,null,requested_team_id)
    else false
  end
$function$;

create function pulse_private.require_any_training_permission(requested_permissions text[])
returns uuid
language plpgsql
stable
security definer
set search_path = pg_catalog
as $function$
declare
  actor_id uuid := pulse_private.current_training_staff_user_id();
begin
  if not pulse_private.has_any_training_permission(requested_permissions) then
    raise exception 'required Training permission is missing' using errcode = '42501';
  end if;
  return actor_id;
end
$function$;

create function pulse_private.require_training_target_permission(
  requested_permission text,
  requested_scope_type text,
  requested_campaign_id uuid,
  requested_team_id uuid
)
returns uuid
language plpgsql
stable
security definer
set search_path = pg_catalog
as $function$
declare
  actor_id uuid := pulse_private.current_training_staff_user_id();
begin
  if requested_scope_type not in ('global','campaign','team') then
    raise exception 'invalid Training target scope' using errcode = '22023';
  end if;
  if not pulse_private.has_training_target_permission(
    requested_permission,requested_scope_type,requested_campaign_id,requested_team_id
  ) then
    raise exception 'exact Training target permission required' using errcode = '42501';
  end if;
  return actor_id;
end
$function$;

create function pulse_private.has_training_content_permission(
  requested_permission text,
  requested_content_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $function$
  select coalesce((
    select pulse_private.has_training_target_permission(
      requested_permission,audience.scope_type,audience.campaign_id,audience.team_id
    )
    from public.training_content_audiences audience
    where audience.content_id = requested_content_id
  ),false)
$function$;

create function pulse_private.require_training_content_permission(
  requested_permission text,
  requested_content_id uuid
)
returns uuid
language plpgsql
stable
security definer
set search_path = pg_catalog
as $function$
declare
  audience public.training_content_audiences%rowtype;
begin
  select target.* into audience
  from public.training_content_audiences target
  where target.content_id = requested_content_id;
  if not found then
    raise exception 'training content audience not found' using errcode = 'P0002';
  end if;
  return pulse_private.require_training_target_permission(
    requested_permission,
    audience.scope_type,
    audience.campaign_id,
    audience.team_id
  );
end
$function$;

create function pulse_private.training_content_is_eligible(
  requested_content_id uuid,
  requested_staff_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $function$
  select exists (
    select 1
    from public.training_content content
    join public.training_content_audiences audience on audience.content_id = content.id
    join public.users staff on staff.id = requested_staff_user_id and staff.status = 'active'
    left join public.campaigns campaign on campaign.id = audience.campaign_id
    left join public.teams target_team on target_team.id = audience.team_id
    where content.id = requested_content_id
      and content.status = 'published'
      and (
        audience.scope_type = 'global'
        or (
          audience.scope_type = 'campaign' and campaign.is_active and (
            exists (
              select 1 from public.teams employment_team
              where employment_team.id = staff.team_id
                and employment_team.is_active
                and employment_team.campaign_id = campaign.id
            )
            or exists (
              select 1 from public.user_operational_assignments assignment
              where assignment.user_id = staff.id
                and assignment.campaign_id = campaign.id
                and assignment.ended_at is null
            )
          )
        )
        or (
          audience.scope_type = 'team' and target_team.is_active and (
            staff.team_id = target_team.id
            or exists (
              select 1 from public.user_operational_assignments assignment
              where assignment.user_id = staff.id
                and assignment.team_id = target_team.id
                and assignment.ended_at is null
            )
          )
        )
      )
      and (
        not exists (
          select 1 from public.training_content_position_targets target
          where target.content_id = content.id
        )
        or exists (
          select 1
          from public.training_content_position_targets target
          join public.positions position on position.id = target.position_id and position.is_active
          where target.content_id = content.id
            and (
              staff.position_id = position.id
              or exists (
                select 1 from public.user_operational_assignments assignment
                where assignment.user_id = staff.id
                  and assignment.position_id = position.id
                  and assignment.ended_at is null
              )
            )
        )
      )
  )
$function$;

create function pulse_private.has_training_learner_content_permission(
  requested_permission text,
  requested_content_id uuid,
  requested_staff_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $function$
  select pulse_private.training_content_is_eligible(requested_content_id,requested_staff_user_id)
    and coalesce((
      select case audience.scope_type
        when 'global' then pulse_private.has_any_training_permission(array[requested_permission])
        when 'campaign' then
          pulse_private.has_permission(requested_permission,null,audience.campaign_id,null)
          or exists (
            select 1
            from public.teams team
            where team.is_active and team.campaign_id = audience.campaign_id
              and (
                team.id = staff.team_id
                or exists (
                  select 1 from public.user_operational_assignments assignment
                  where assignment.user_id = staff.id and assignment.team_id = team.id
                    and assignment.ended_at is null
                )
              )
              and pulse_private.has_permission(
                requested_permission,team.department_id,team.campaign_id,team.id
              )
          )
        when 'team' then pulse_private.has_permission(
          requested_permission,target_team.department_id,target_team.campaign_id,target_team.id
        )
        else false
      end
      from public.training_content_audiences audience
      join public.users staff on staff.id = requested_staff_user_id and staff.status = 'active'
      left join public.teams target_team on target_team.id = audience.team_id
      where audience.content_id = requested_content_id
    ),false)
$function$;

alter function pulse_private.current_training_staff_user_id() owner to postgres;
alter function pulse_private.has_any_training_permission(text[]) owner to postgres;
alter function pulse_private.has_training_target_permission(text,text,uuid,uuid) owner to postgres;
alter function pulse_private.require_any_training_permission(text[]) owner to postgres;
alter function pulse_private.require_training_target_permission(text,text,uuid,uuid) owner to postgres;
alter function pulse_private.has_training_content_permission(text,uuid) owner to postgres;
alter function pulse_private.require_training_content_permission(text,uuid) owner to postgres;
alter function pulse_private.training_content_is_eligible(uuid,uuid) owner to postgres;
alter function pulse_private.has_training_learner_content_permission(text,uuid,uuid) owner to postgres;

revoke all on function pulse_private.current_training_staff_user_id() from public,anon,authenticated,service_role;
revoke all on function pulse_private.has_any_training_permission(text[]) from public,anon,authenticated,service_role;
revoke all on function pulse_private.has_training_target_permission(text,text,uuid,uuid) from public,anon,authenticated,service_role;
revoke all on function pulse_private.require_any_training_permission(text[]) from public,anon,authenticated,service_role;
revoke all on function pulse_private.require_training_target_permission(text,text,uuid,uuid) from public,anon,authenticated,service_role;
revoke all on function pulse_private.has_training_content_permission(text,uuid) from public,anon,authenticated,service_role;
revoke all on function pulse_private.require_training_content_permission(text,uuid) from public,anon,authenticated,service_role;
revoke all on function pulse_private.training_content_is_eligible(uuid,uuid) from public,anon,authenticated,service_role;
revoke all on function pulse_private.has_training_learner_content_permission(text,uuid,uuid) from public,anon,authenticated,service_role;

create function public.list_training_catalog(
  requested_view text default 'learner',
  requested_language text default null,
  requested_topic_id uuid default null,
  requested_search text default null,
  requested_limit integer default 50,
  requested_offset integer default 0
)
returns table (
  id uuid,
  content_type text,
  title text,
  description text,
  language text,
  status text,
  topics jsonb,
  audience jsonb,
  position_targets jsonb,
  creator_display text,
  published_at timestamptz,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = pg_catalog
as $function$
declare
  actor_id uuid;
  can_manage boolean;
  normalized_search text := nullif(btrim(coalesce(requested_search,'')), '');
begin
  if requested_view not in ('learner','studio') then
    raise exception 'invalid Training catalog view' using errcode = '22023';
  end if;
  if requested_language is not null and requested_language not in ('en','es') then
    raise exception 'invalid Training language' using errcode = '22023';
  end if;
  if requested_limit not between 1 and 100 or requested_offset < 0 then
    raise exception 'invalid Training pagination' using errcode = '22023';
  end if;

  if requested_view = 'learner' then
    actor_id := pulse_private.require_any_training_permission(array['go.play','academy.view','studio.view']);
    can_manage := false;
  else
    actor_id := pulse_private.require_any_training_permission(array['studio.view']);
    can_manage := pulse_private.has_any_training_permission(array['studio.publish','academy.manage']);
  end if;

  return query
  select
    content.id,
    content.content_type,
    content.title,
    content.description,
    content.language,
    content.status,
    coalesce((
      select jsonb_agg(jsonb_build_object('id',topic.id,'code',topic.code,'name',topic.name) order by topic.name,topic.id)
      from public.training_content_topics content_topic
      join public.training_topics topic on topic.id = content_topic.topic_id
      where content_topic.content_id = content.id
    ), '[]'::jsonb),
    jsonb_build_object(
      'scope_type', audience.scope_type,
      'campaign_id', campaign.id,
      'campaign_code', campaign.code,
      'campaign_name', campaign.name,
      'team_id', team.id,
      'team_code', team.code,
      'team_name', team.name
    ),
    coalesce((
      select jsonb_agg(jsonb_build_object('id',position.id,'code',position.code,'name',position.name) order by position.name,position.id)
      from public.training_content_position_targets target
      join public.positions position on position.id = target.position_id
      where target.content_id = content.id
    ), '[]'::jsonb),
    coalesce(nullif(btrim(creator.display_name),''), creator.full_name),
    content.published_at,
    content.updated_at
  from public.training_content content
  join public.training_content_audiences audience on audience.content_id = content.id
  join public.users creator on creator.id = content.created_by_user_id
  left join public.campaigns campaign on campaign.id = audience.campaign_id
  left join public.teams team on team.id = audience.team_id
  where (requested_language is null or content.language = requested_language)
    and (requested_topic_id is null or exists (
      select 1 from public.training_content_topics filter_topic
      where filter_topic.content_id = content.id and filter_topic.topic_id = requested_topic_id
    ))
    and (normalized_search is null
      or content.title ilike '%' || normalized_search || '%'
      or coalesce(content.description,'') ilike '%' || normalized_search || '%')
    and (
      (requested_view = 'learner' and (
        pulse_private.has_training_learner_content_permission('go.play',content.id,actor_id)
        or pulse_private.has_training_learner_content_permission('academy.view',content.id,actor_id)
        or pulse_private.has_training_learner_content_permission('studio.view',content.id,actor_id)
      ))
      or (requested_view = 'studio' and (
        (content.created_by_user_id = actor_id
          and pulse_private.has_training_content_permission('studio.create',content.id))
        or (can_manage
          and pulse_private.has_training_content_permission('studio.publish',content.id))
        or (content.status = 'published'
          and pulse_private.has_training_content_permission('studio.view',content.id))
      ))
    )
  order by content.updated_at desc, content.id
  limit requested_limit offset requested_offset;
end
$function$;

create function public.get_training_filter_options(requested_context text default 'learner')
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog
as $function$
declare
  actor_id uuid;
  can_create boolean;
begin
  if requested_context = 'learner' then
    actor_id := pulse_private.require_any_training_permission(array['go.play','academy.view','studio.view']);
    can_create := false;
  elsif requested_context = 'studio' then
    actor_id := pulse_private.require_any_training_permission(array['studio.view','studio.create']);
    can_create := pulse_private.has_any_training_permission(array['studio.create']);
  else
    raise exception 'invalid Training filter context' using errcode = '22023';
  end if;

  return jsonb_build_object(
    'languages', jsonb_build_array(
      jsonb_build_object('id','en','label','English'),
      jsonb_build_object('id','es','label','Español')
    ),
    'topics', coalesce((
      select jsonb_agg(jsonb_build_object('id',topic.id,'code',topic.code,'name',topic.name) order by topic.name,topic.id)
      from public.training_topics topic
      where topic.is_active and (
        requested_context = 'studio'
        or exists (
          select 1 from public.training_content_topics content_topic
          where content_topic.topic_id = topic.id
            and pulse_private.training_content_is_eligible(content_topic.content_id, actor_id)
        )
      )
    ),'[]'::jsonb),
    'campaigns', case when can_create then coalesce((
      select jsonb_agg(jsonb_build_object('id',campaign.id,'code',campaign.code,'name',campaign.name) order by campaign.name,campaign.id)
      from public.campaigns campaign
      where campaign.is_active
        and pulse_private.has_permission('studio.create',null,campaign.id,null)
    ),'[]'::jsonb) else '[]'::jsonb end,
    'teams', case when can_create then coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',team.id,'code',team.code,'name',team.name,
        'department_id',team.department_id,'campaign_id',team.campaign_id
      ) order by team.name,team.id)
      from public.teams team
      where team.is_active and team.campaign_id is not null
        and pulse_private.has_permission('studio.create',team.department_id,team.campaign_id,team.id)
    ),'[]'::jsonb) else '[]'::jsonb end,
    'positions', case when can_create then coalesce((
      select jsonb_agg(jsonb_build_object('id',position.id,'code',position.code,'name',position.name) order by position.name,position.id)
      from public.positions position where position.is_active
    ),'[]'::jsonb) else '[]'::jsonb end
  );
end
$function$;

create function public.list_academy_modules(requested_language text default null)
returns table (
  id uuid,
  title text,
  description text,
  language text,
  items jsonb,
  published_at timestamptz
)
language plpgsql
stable
security definer
set search_path = pg_catalog
as $function$
declare
  actor_id uuid := pulse_private.require_any_training_permission(array['academy.view']);
begin
  if requested_language is not null and requested_language not in ('en','es') then
    raise exception 'invalid Academy language' using errcode = '22023';
  end if;
  return query
  select module.id,module.title,module.description,module.language,
    jsonb_agg(jsonb_build_object(
      'content_id',content.id,'position',item.position,'is_required',item.is_required,
      'title',content.title,'content_type',content.content_type,
      'latest_result',(
        select jsonb_build_object(
          'score_percent',result.score_percent,
          'correct_answers',result.correct_answers,
          'total_questions',result.total_questions,
          'completed_at',attempt.completed_at
        )
        from public.training_staff_learner_links link
        join public.training_attempts attempt on attempt.learner_id = link.learner_id
          and attempt.content_id = content.id and attempt.source_mode = 'academy'
        join public.training_results result on result.attempt_id = attempt.id
        where link.staff_user_id = actor_id
        order by attempt.completed_at desc,attempt.id
        limit 1
      )
    ) order by item.position,content.id),
    module.published_at
  from public.training_modules module
  join public.training_module_items item on item.module_id = module.id
  join public.training_content content on content.id = item.content_id
  where module.status = 'published'
    and content.status = 'published'
    and (requested_language is null or module.language = requested_language)
    and pulse_private.has_training_learner_content_permission('academy.view',content.id,actor_id)
  group by module.id,module.title,module.description,module.language,module.published_at
  order by module.title,module.id;
end
$function$;

create function public.create_training_content_draft(
  requested_content_type text,
  requested_title text,
  requested_description text,
  requested_language text,
  requested_topic_ids uuid[],
  requested_scope_type text,
  requested_campaign_id uuid default null,
  requested_team_id uuid default null,
  requested_position_ids uuid[] default '{}'::uuid[]
)
returns table (id uuid, status text, updated_at timestamptz)
language plpgsql
volatile
security definer
set search_path = pg_catalog
as $function$
declare
  actor_id uuid;
  created public.training_content%rowtype;
  normalized_title text := btrim(coalesce(requested_title,''));
  normalized_description text := nullif(btrim(coalesce(requested_description,'')), '');
begin
  actor_id := pulse_private.require_training_target_permission(
    'studio.create',requested_scope_type,requested_campaign_id,requested_team_id
  );
  if requested_content_type not in ('lesson','quiz','assessment')
     or requested_language not in ('en','es')
     or length(normalized_title) not between 2 and 180
     or length(coalesce(normalized_description,'')) > 2000 then
    raise exception 'invalid Training draft fields' using errcode = '22023';
  end if;
  if coalesce(array_length(requested_topic_ids,1),0) < 1
     or exists (
       select 1 from unnest(requested_topic_ids) topic_id
       where not exists (
         select 1 from public.training_topics topic where topic.id = topic_id and topic.is_active
       )
     ) then
    raise exception 'active authoritative Topics are required' using errcode = '22023';
  end if;
  if requested_scope_type = 'campaign' and not exists (
    select 1 from public.campaigns campaign where campaign.id = requested_campaign_id and campaign.is_active
  ) then raise exception 'active Campaign target required' using errcode = '22023'; end if;
  if requested_scope_type = 'team' and not exists (
    select 1 from public.teams team where team.id = requested_team_id and team.is_active and team.campaign_id is not null
  ) then raise exception 'active Campaign-linked Team target required' using errcode = '22023'; end if;
  if exists (
    select 1 from unnest(coalesce(requested_position_ids,'{}'::uuid[])) position_id
    where not exists (
      select 1 from public.positions position where position.id = position_id and position.is_active
    )
  ) then raise exception 'active authoritative Position targets required' using errcode = '22023'; end if;

  insert into public.training_content(
    content_type,title,description,language,created_by_user_id
  ) values (
    requested_content_type,normalized_title,normalized_description,requested_language,actor_id
  ) returning * into created;

  insert into public.training_content_topics(content_id,topic_id)
  select created.id, topic_id from (select distinct unnest(requested_topic_ids) topic_id) topics;
  insert into public.training_content_audiences(content_id,scope_type,campaign_id,team_id)
  values (created.id,requested_scope_type,requested_campaign_id,requested_team_id);
  insert into public.training_content_position_targets(content_id,position_id)
  select created.id, position_id
  from (select distinct unnest(coalesce(requested_position_ids,'{}'::uuid[])) position_id) positions;

  insert into public.audit_events(actor_user_id,target_type,target_id,action,source,metadata)
  values (actor_id,'training_content',created.id,'training.content_created','database',
    jsonb_build_object('content_type',created.content_type,'language',created.language,'scope_type',requested_scope_type));

  return query select created.id,created.status,created.updated_at;
end
$function$;

create function public.update_training_content_draft(
  requested_content_id uuid,
  requested_title text,
  requested_description text,
  requested_language text,
  requested_topic_ids uuid[],
  requested_scope_type text,
  requested_campaign_id uuid,
  requested_team_id uuid,
  requested_position_ids uuid[],
  expected_updated_at timestamptz
)
returns table (id uuid, status text, updated_at timestamptz)
language plpgsql
volatile
security definer
set search_path = pg_catalog
as $function$
declare
  actor_id uuid;
  existing public.training_content%rowtype;
  changed public.training_content%rowtype;
begin
  select * into existing from public.training_content where training_content.id = requested_content_id for update;
  if not found then raise exception 'training content not found' using errcode = 'P0002'; end if;
  actor_id := pulse_private.require_training_target_permission(
    'studio.create',requested_scope_type,requested_campaign_id,requested_team_id
  );
  if existing.status <> 'draft' then raise exception 'only draft content may be edited' using errcode = '55000'; end if;
  if existing.created_by_user_id <> actor_id
     and not pulse_private.has_any_training_permission(array['academy.manage']) then
    raise exception 'draft owner or Academy manager required' using errcode = '42501';
  end if;
  if expected_updated_at is null or existing.updated_at <> expected_updated_at then
    raise exception 'training draft changed; refresh before saving' using errcode = '40001';
  end if;
  if requested_language not in ('en','es')
     or length(btrim(coalesce(requested_title,''))) not between 2 and 180
     or length(btrim(coalesce(requested_description,''))) > 2000 then
    raise exception 'invalid Training draft fields' using errcode = '22023';
  end if;
  if coalesce(array_length(requested_topic_ids,1),0) < 1
     or exists (
       select 1 from unnest(requested_topic_ids) topic_id
       where not exists (select 1 from public.training_topics topic where topic.id=topic_id and topic.is_active)
     ) then raise exception 'active authoritative Topics are required' using errcode = '22023'; end if;
  if requested_scope_type='campaign' and not exists(select 1 from public.campaigns c where c.id=requested_campaign_id and c.is_active)
    then raise exception 'active Campaign target required' using errcode='22023'; end if;
  if requested_scope_type='team' and not exists(select 1 from public.teams t where t.id=requested_team_id and t.is_active and t.campaign_id is not null)
    then raise exception 'active Campaign-linked Team target required' using errcode='22023'; end if;
  if exists (
    select 1 from unnest(coalesce(requested_position_ids,'{}'::uuid[])) position_id
    where not exists(select 1 from public.positions p where p.id=position_id and p.is_active)
  ) then raise exception 'active authoritative Position targets required' using errcode='22023'; end if;

  delete from public.training_content_position_targets where content_id=requested_content_id;
  delete from public.training_content_topics where content_id=requested_content_id;
  delete from public.training_content_audiences where content_id=requested_content_id;
  insert into public.training_content_topics(content_id,topic_id)
    select requested_content_id,topic_id from (select distinct unnest(requested_topic_ids) topic_id) topics;
  insert into public.training_content_audiences(content_id,scope_type,campaign_id,team_id)
    values(requested_content_id,requested_scope_type,requested_campaign_id,requested_team_id);
  insert into public.training_content_position_targets(content_id,position_id)
    select requested_content_id,position_id
    from (select distinct unnest(coalesce(requested_position_ids,'{}'::uuid[])) position_id) positions;
  update public.training_content
  set title=btrim(requested_title),description=nullif(btrim(coalesce(requested_description,'')),''),language=requested_language
  where training_content.id=requested_content_id returning * into changed;

  insert into public.audit_events(actor_user_id,target_type,target_id,action,source,metadata)
  values(actor_id,'training_content',changed.id,'training.content_updated','database',jsonb_build_object('scope_type',requested_scope_type));
  return query select changed.id,changed.status,changed.updated_at;
end
$function$;

create function public.replace_training_questions(
  requested_content_id uuid,
  requested_questions jsonb,
  expected_updated_at timestamptz
)
returns table (content_id uuid, question_count integer, updated_at timestamptz)
language plpgsql
volatile
security definer
set search_path = pg_catalog
as $function$
declare
  actor_id uuid;
  existing public.training_content%rowtype;
  question jsonb;
  created_question_id uuid;
  question_topic_ids uuid[];
  count_questions integer;
  changed_at timestamptz;
begin
  select content.* into existing
  from public.training_content content
  where content.id=requested_content_id
  for update;
  if not found then raise exception 'training content not found' using errcode='P0002'; end if;
  actor_id := pulse_private.require_training_content_permission('studio.create',requested_content_id);
  if existing.status <> 'draft' then raise exception 'questions may be replaced only for draft content' using errcode='55000'; end if;
  if existing.created_by_user_id <> actor_id
     and not pulse_private.has_any_training_permission(array['academy.manage']) then
    raise exception 'draft owner or Academy manager required' using errcode='42501';
  end if;
  if expected_updated_at is null or existing.updated_at <> expected_updated_at then
    raise exception 'training draft changed; refresh before saving' using errcode='40001';
  end if;
  if jsonb_typeof(requested_questions)<>'array'
     or jsonb_array_length(requested_questions) not between 1 and 100 then
    raise exception 'questions must be a bounded array' using errcode='22023';
  end if;

  delete from public.training_question_topics question_topic
    where question_topic.question_id in (
      select question.id from public.training_questions question
      where question.content_id=requested_content_id
    );
  delete from public.training_questions question
  where question.content_id=requested_content_id;

  for question in select value from jsonb_array_elements(requested_questions)
  loop
    if jsonb_typeof(question)<>'object' or jsonb_typeof(question->'topic_ids')<>'array' then
      raise exception 'each question requires structured Topic IDs' using errcode='22023';
    end if;
    if (question->>'question_type') not in ('multiple_choice','true_false','text')
       or length(btrim(coalesce(question->>'prompt',''))) not between 2 and 2000
       or jsonb_typeof(coalesce(question->'answer_options','null'::jsonb)) <> 'array'
       or not (question ? 'correct_answer') then
      raise exception 'invalid structured question fields' using errcode='22023';
    end if;
    if question->>'question_type' = 'multiple_choice' and (
      jsonb_array_length(question->'answer_options') not between 2 and 8
      or jsonb_typeof(question->'correct_answer') <> 'number'
      or (question->>'correct_answer') !~ '^[0-9]+$'
      or (question->>'correct_answer')::integer >= jsonb_array_length(question->'answer_options')
    ) then
      raise exception 'invalid multiple-choice question' using errcode='22023';
    elsif question->>'question_type' = 'true_false' and (
      jsonb_array_length(question->'answer_options') <> 0
      or jsonb_typeof(question->'correct_answer') <> 'boolean'
    ) then
      raise exception 'invalid true/false question' using errcode='22023';
    elsif question->>'question_type' = 'text' and (
      jsonb_array_length(question->'answer_options') <> 0
      or jsonb_typeof(question->'correct_answer') <> 'array'
      or jsonb_array_length(question->'correct_answer') < 1
      or exists (
        select 1 from jsonb_array_elements(question->'correct_answer') accepted
        where jsonb_typeof(accepted) <> 'string'
          or length(btrim(accepted #>> '{}')) not between 1 and 1000
      )
    ) then
      raise exception 'invalid text question' using errcode='22023';
    end if;
    select array_agg(value::uuid) into question_topic_ids
    from jsonb_array_elements_text(question->'topic_ids');
    if coalesce(array_length(question_topic_ids,1),0)<1 or exists(
      select 1 from unnest(question_topic_ids) topic_id
      where not exists(
        select 1 from public.training_content_topics ct
        join public.training_topics t on t.id=ct.topic_id and t.is_active
        where ct.content_id=requested_content_id and ct.topic_id=topic_id
      )
    ) then raise exception 'question Topics must be active content Topics' using errcode='22023'; end if;

    insert into public.training_questions(
      content_id,position,question_type,prompt,answer_options,correct_answer,explanation,media_id
    ) values (
      requested_content_id,(question->>'position')::integer,question->>'question_type',question->>'prompt',
      coalesce(question->'answer_options','[]'::jsonb),question->'correct_answer',
      nullif(btrim(coalesce(question->>'explanation','')),''),
      nullif(question->>'media_id','')::uuid
    ) returning id into created_question_id;
    insert into public.training_question_topics(question_id,topic_id)
      select created_question_id,topic_id from (select distinct unnest(question_topic_ids) topic_id) topics;
  end loop;

  update public.training_content content
  set updated_at=now()
  where content.id=requested_content_id
  returning content.updated_at into changed_at;
  select count(*)::integer into count_questions
  from public.training_questions question
  where question.content_id=requested_content_id;
  insert into public.audit_events(actor_user_id,target_type,target_id,action,source,metadata)
  values(actor_id,'training_content',requested_content_id,'training.content_updated','database',jsonb_build_object('question_count',count_questions));
  return query select requested_content_id,count_questions,changed_at;
end
$function$;

create function public.publish_training_content(requested_content_id uuid)
returns table (id uuid, status text, published_at timestamptz, updated_at timestamptz)
language plpgsql
volatile
security definer
set search_path = pg_catalog
as $function$
declare
  actor_id uuid;
  existing public.training_content%rowtype;
  changed public.training_content%rowtype;
begin
  select * into existing
  from public.training_content content
  where content.id = requested_content_id
  for update;
  if not found then raise exception 'training content not found' using errcode='P0002'; end if;
  actor_id := pulse_private.require_training_content_permission('studio.publish',requested_content_id);
  if existing.status <> 'draft' then
    raise exception 'only draft training content may be published' using errcode='55000';
  end if;
  if existing.content_type in ('quiz','assessment') and (
    not exists (
      select 1 from public.training_questions question
      where question.content_id = requested_content_id
    )
    or exists (
      select 1
      from public.training_questions question
      where question.content_id = requested_content_id
        and not exists (
          select 1 from public.training_question_topics question_topic
          where question_topic.question_id = question.id
        )
    )
    or exists (
      select 1
      from public.training_question_topics question_topic
      join public.training_questions question on question.id = question_topic.question_id
      where question.content_id = requested_content_id
        and not exists (
          select 1 from public.training_content_topics content_topic
          where content_topic.content_id = requested_content_id
            and content_topic.topic_id = question_topic.topic_id
        )
    )
  ) then
    raise exception 'publish requires Topic-attributed valid questions' using errcode='23514';
  end if;

  update public.training_content content
  set status = 'published'
  where content.id = requested_content_id
  returning * into changed;

  insert into public.audit_events(actor_user_id,target_type,target_id,action,source,metadata)
  values(actor_id,'training_content',changed.id,'training.content_published','database',
    jsonb_build_object('content_type',changed.content_type,'language',changed.language));
  return query select changed.id,changed.status,changed.published_at,changed.updated_at;
end
$function$;

create function public.archive_training_content(requested_content_id uuid)
returns table (id uuid, status text, archived_at timestamptz, updated_at timestamptz)
language plpgsql
volatile
security definer
set search_path = pg_catalog
as $function$
declare
  actor_id uuid;
  existing public.training_content%rowtype;
  changed public.training_content%rowtype;
begin
  select * into existing
  from public.training_content content
  where content.id = requested_content_id
  for update;
  if not found then raise exception 'training content not found' using errcode='P0002'; end if;
  actor_id := pulse_private.require_training_content_permission('studio.publish',requested_content_id);
  if existing.status <> 'published' then
    raise exception 'only published training content may be archived' using errcode='55000';
  end if;

  update public.training_content content
  set status = 'archived'
  where content.id = requested_content_id
  returning * into changed;

  insert into public.audit_events(actor_user_id,target_type,target_id,action,source,metadata)
  values(actor_id,'training_content',changed.id,'training.content_archived','database',
    jsonb_build_object('content_type',changed.content_type,'language',changed.language));
  return query select changed.id,changed.status,changed.archived_at,changed.updated_at;
end
$function$;

create function public.get_go_practice_content(requested_content_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog
as $function$
declare
  actor_id uuid := pulse_private.current_training_staff_user_id();
  response jsonb;
begin
  if not pulse_private.has_training_learner_content_permission('go.play',requested_content_id,actor_id) then
    raise exception 'eligible GO Practice permission required' using errcode='42501';
  end if;
  select jsonb_build_object(
    'id',content.id,
    'title',content.title,
    'description',content.description,
    'content_type',content.content_type,
    'language',content.language,
    'topics',coalesce((
      select jsonb_agg(jsonb_build_object('id',topic.id,'code',topic.code,'name',topic.name) order by topic.name,topic.id)
      from public.training_content_topics content_topic
      join public.training_topics topic on topic.id = content_topic.topic_id
      where content_topic.content_id = content.id
    ),'[]'::jsonb),
    'questions',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',question.id,
        'position',question.position,
        'question_type',question.question_type,
        'prompt',question.prompt,
        'answer_options',question.answer_options,
        'media_id',question.media_id,
        'topic_ids',coalesce((
          select jsonb_agg(question_topic.topic_id order by question_topic.topic_id)
          from public.training_question_topics question_topic
          where question_topic.question_id = question.id
        ),'[]'::jsonb)
      ) order by question.position,question.id)
      from public.training_questions question
      where question.content_id = content.id
    ),'[]'::jsonb)
  ) into response
  from public.training_content content
  where content.id = requested_content_id
    and content.status = 'published'
    and content.content_type in ('quiz','assessment');
  if response is null then
    raise exception 'published GO Practice content not found' using errcode='P0002';
  end if;
  return response;
end
$function$;

create function public.start_training_attempt(
  requested_content_id uuid,
  requested_source_mode text
)
returns table (
  attempt_id uuid,
  content_id uuid,
  source_mode text,
  attempt_number integer,
  language text,
  started_at timestamptz
)
language plpgsql
volatile
security definer
set search_path = pg_catalog
as $function$
declare
  actor_id uuid := pulse_private.current_training_staff_user_id();
  resolved_learner_id uuid;
  content public.training_content%rowtype;
  next_attempt integer;
  created public.training_attempts%rowtype;
  required_permission text;
begin
  if requested_source_mode = 'go_practice' then
    required_permission := 'go.play';
  elsif requested_source_mode = 'academy' then
    required_permission := 'academy.view';
  else
    raise exception 'unsupported TRAIN-1B attempt mode' using errcode='22023';
  end if;
  if not pulse_private.has_training_learner_content_permission(
    required_permission,requested_content_id,actor_id
  ) then
    raise exception 'eligible Training learner permission required' using errcode='42501';
  end if;
  select * into content
  from public.training_content candidate
  where candidate.id = requested_content_id
    and candidate.status = 'published'
    and candidate.content_type in ('quiz','assessment');
  if not found then raise exception 'published scored content not found' using errcode='P0002'; end if;

  perform pg_advisory_xact_lock(hashtextextended(actor_id::text,0));
  select link.learner_id into resolved_learner_id
  from public.training_staff_learner_links link
  where link.staff_user_id = actor_id;
  if resolved_learner_id is null then
    insert into public.training_learners(learner_kind) values('staff') returning id into resolved_learner_id;
    insert into public.training_staff_learner_links(learner_id,staff_user_id)
    values(resolved_learner_id,actor_id);
  end if;

  select coalesce(max(attempt.attempt_number),0) + 1 into next_attempt
  from public.training_attempts attempt
  where attempt.learner_id = resolved_learner_id
    and attempt.content_id = requested_content_id
    and attempt.source_mode = requested_source_mode;
  insert into public.training_attempts(
    learner_id,content_id,source_mode,attempt_number,language
  ) values (
    resolved_learner_id,requested_content_id,requested_source_mode,next_attempt,content.language
  ) returning * into created;
  return query select created.id,created.content_id,created.source_mode,
    created.attempt_number,created.language,created.started_at;
end
$function$;

create function public.complete_training_attempt(
  requested_attempt_id uuid,
  requested_answers jsonb,
  requested_duration_seconds integer default null
)
returns table (
  result_id uuid,
  attempt_id uuid,
  total_questions integer,
  correct_answers integer,
  score_percent numeric,
  topic_breakdown jsonb,
  completed_at timestamptz
)
language plpgsql
volatile
security definer
set search_path = pg_catalog
as $function$
declare
  actor_id uuid := pulse_private.current_training_staff_user_id();
  attempt public.training_attempts%rowtype;
  question public.training_questions%rowtype;
  answer_item jsonb;
  submitted_answer jsonb;
  answer_is_correct boolean;
  question_total integer;
  correct_total integer := 0;
  created_result public.training_results%rowtype;
  finished_at timestamptz;
  topics jsonb;
begin
  if requested_duration_seconds is not null
     and requested_duration_seconds not between 0 and 86400 then
    raise exception 'invalid Training attempt duration' using errcode='22023';
  end if;
  select candidate.* into attempt
  from public.training_attempts candidate
  join public.training_staff_learner_links link on link.learner_id = candidate.learner_id
  where candidate.id = requested_attempt_id and link.staff_user_id = actor_id
  for update of candidate;
  if not found then raise exception 'owned Training attempt not found' using errcode='P0002'; end if;
  if attempt.status <> 'started' then
    raise exception 'Training attempt is already finalized' using errcode='55000';
  end if;
  if attempt.source_mode not in ('go_practice','academy') then
    raise exception 'unsupported TRAIN-1B attempt mode' using errcode='22023';
  end if;
  if jsonb_typeof(requested_answers) <> 'array' then
    raise exception 'answers must be a structured array' using errcode='22023';
  end if;

  select count(*)::integer into question_total
  from public.training_questions candidate
  where candidate.content_id = attempt.content_id;
  if question_total < 1 or jsonb_array_length(requested_answers) <> question_total then
    raise exception 'answers must exactly match the published question set' using errcode='22023';
  end if;
  if exists (
    select 1 from jsonb_array_elements(requested_answers) item
    where jsonb_typeof(item) <> 'object'
      or not (item ? 'question_id')
      or not (item ? 'answer')
  ) or (
    select count(distinct (item->>'question_id')::uuid)
    from jsonb_array_elements(requested_answers) item
  ) <> question_total or exists (
    select 1 from jsonb_array_elements(requested_answers) item
    where not exists (
      select 1 from public.training_questions candidate
      where candidate.id = (item->>'question_id')::uuid
        and candidate.content_id = attempt.content_id
    )
  ) then
    raise exception 'answer question identities are invalid or duplicated' using errcode='22023';
  end if;

  for question in
    select candidate.* from public.training_questions candidate
    where candidate.content_id = attempt.content_id
    order by candidate.position,candidate.id
  loop
    select item into answer_item
    from jsonb_array_elements(requested_answers) item
    where (item->>'question_id')::uuid = question.id;
    submitted_answer := answer_item->'answer';
    if question.question_type = 'multiple_choice' then
      if jsonb_typeof(submitted_answer) <> 'number'
         or (submitted_answer #>> '{}') !~ '^[0-9]+$'
         or (submitted_answer #>> '{}')::integer < 0
         or (submitted_answer #>> '{}')::integer >= jsonb_array_length(question.answer_options) then
        raise exception 'invalid multiple-choice answer' using errcode='22023';
      end if;
      answer_is_correct := (submitted_answer #>> '{}')::integer = (question.correct_answer #>> '{}')::integer;
    elsif question.question_type = 'true_false' then
      if jsonb_typeof(submitted_answer) <> 'boolean' then
        raise exception 'invalid true/false answer' using errcode='22023';
      end if;
      answer_is_correct := submitted_answer = question.correct_answer;
    elsif question.question_type = 'text' then
      if jsonb_typeof(submitted_answer) <> 'string'
         or length(btrim(submitted_answer #>> '{}')) not between 1 and 1000 then
        raise exception 'invalid text answer' using errcode='22023';
      end if;
      answer_is_correct := exists (
        select 1
        from jsonb_array_elements_text(question.correct_answer) accepted(answer)
        where lower(btrim(accepted.answer)) = lower(btrim(submitted_answer #>> '{}'))
      );
    else
      raise exception 'unsupported certified question type' using errcode='22023';
    end if;
    insert into public.training_attempt_answers(
      attempt_id,question_id,submitted_answer,is_correct
    ) values (
      attempt.id,question.id,submitted_answer,answer_is_correct
    );
    if answer_is_correct then correct_total := correct_total + 1; end if;
  end loop;

  update public.training_attempts candidate
  set status='completed',completed_at=now(),duration_seconds=requested_duration_seconds
  where candidate.id=attempt.id
  returning candidate.completed_at into finished_at;
  insert into public.training_results(
    attempt_id,total_questions,correct_answers,score_percent,completed
  ) values (
    attempt.id,question_total,correct_total,
    round((correct_total::numeric * 100) / question_total,2),true
  ) returning * into created_result;

  insert into public.training_result_topics(
    result_id,topic_id,total_questions,correct_answers
  )
  select created_result.id,question_topic.topic_id,count(*)::integer,
    count(*) filter (where answer.is_correct)::integer
  from public.training_attempt_answers answer
  join public.training_question_topics question_topic on question_topic.question_id = answer.question_id
  where answer.attempt_id = attempt.id
  group by question_topic.topic_id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'topic_id',result_topic.topic_id,
    'topic_code',topic.code,
    'topic_name',topic.name,
    'total_questions',result_topic.total_questions,
    'correct_answers',result_topic.correct_answers,
    'score_percent',round((result_topic.correct_answers::numeric * 100) / result_topic.total_questions,2)
  ) order by topic.name,topic.id),'[]'::jsonb)
  into topics
  from public.training_result_topics result_topic
  join public.training_topics topic on topic.id = result_topic.topic_id
  where result_topic.result_id = created_result.id;

  return query select created_result.id,attempt.id,created_result.total_questions,
    created_result.correct_answers,created_result.score_percent,topics,finished_at;
end
$function$;

create function public.list_my_training_results(requested_limit integer default 50)
returns table (
  result_id uuid,
  attempt_id uuid,
  content_id uuid,
  content_title text,
  source_mode text,
  attempt_number integer,
  score_percent numeric,
  correct_answers integer,
  total_questions integer,
  topic_breakdown jsonb,
  completed_at timestamptz
)
language plpgsql
stable
security definer
set search_path = pg_catalog
as $function$
declare
  actor_id uuid := pulse_private.current_training_staff_user_id();
begin
  if requested_limit not between 1 and 100 then
    raise exception 'invalid Training history limit' using errcode='22023';
  end if;
  return query
  select result.id,attempt.id,content.id,content.title,attempt.source_mode,
    attempt.attempt_number,result.score_percent,result.correct_answers,result.total_questions,
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'topic_id',result_topic.topic_id,
        'topic_code',topic.code,
        'topic_name',topic.name,
        'total_questions',result_topic.total_questions,
        'correct_answers',result_topic.correct_answers
      ) order by topic.name,topic.id)
      from public.training_result_topics result_topic
      join public.training_topics topic on topic.id = result_topic.topic_id
      where result_topic.result_id = result.id
    ),'[]'::jsonb),attempt.completed_at
  from public.training_results result
  join public.training_attempts attempt on attempt.id = result.attempt_id
  join public.training_content content on content.id = attempt.content_id
  join public.training_staff_learner_links link on link.learner_id = attempt.learner_id
  where link.staff_user_id = actor_id
  order by attempt.completed_at desc,attempt.id
  limit requested_limit;
end
$function$;

create function pulse_private.require_draft_training_question_topic()
returns trigger
language plpgsql
set search_path = pg_catalog
as $function$
declare
  target_question_id uuid := case when tg_op='DELETE' then old.question_id else new.question_id end;
begin
  if not exists (
    select 1
    from public.training_questions question
    join public.training_content content on content.id = question.content_id
    where question.id = target_question_id and content.status = 'draft'
  ) then
    raise exception 'question Topics may be changed only while content is draft';
  end if;
  return case when tg_op='DELETE' then old else new end;
end
$function$;

alter function pulse_private.require_draft_training_question_topic() owner to postgres;
revoke all on function pulse_private.require_draft_training_question_topic()
  from public,anon,authenticated,service_role;

create trigger training_question_topics_require_draft
before insert or update or delete on public.training_question_topics
for each row execute function pulse_private.require_draft_training_question_topic();

create trigger training_attempt_answers_prevent_update
before update on public.training_attempt_answers
for each row execute function pulse_private.prevent_training_result_mutation();
create trigger training_attempt_answers_prevent_delete
before delete on public.training_attempt_answers
for each row execute function pulse_private.prevent_training_result_mutation();

alter function public.list_training_catalog(text,text,uuid,text,integer,integer) owner to postgres;
alter function public.get_training_filter_options(text) owner to postgres;
alter function public.list_academy_modules(text) owner to postgres;
alter function public.create_training_content_draft(text,text,text,text,uuid[],text,uuid,uuid,uuid[]) owner to postgres;
alter function public.update_training_content_draft(uuid,text,text,text,uuid[],text,uuid,uuid,uuid[],timestamptz) owner to postgres;
alter function public.replace_training_questions(uuid,jsonb,timestamptz) owner to postgres;
alter function public.publish_training_content(uuid) owner to postgres;
alter function public.archive_training_content(uuid) owner to postgres;
alter function public.get_go_practice_content(uuid) owner to postgres;
alter function public.start_training_attempt(uuid,text) owner to postgres;
alter function public.complete_training_attempt(uuid,jsonb,integer) owner to postgres;
alter function public.list_my_training_results(integer) owner to postgres;

revoke all on function public.list_training_catalog(text,text,uuid,text,integer,integer) from public,anon,service_role;
revoke all on function public.get_training_filter_options(text) from public,anon,service_role;
revoke all on function public.list_academy_modules(text) from public,anon,service_role;
revoke all on function public.create_training_content_draft(text,text,text,text,uuid[],text,uuid,uuid,uuid[]) from public,anon,service_role;
revoke all on function public.update_training_content_draft(uuid,text,text,text,uuid[],text,uuid,uuid,uuid[],timestamptz) from public,anon,service_role;
revoke all on function public.replace_training_questions(uuid,jsonb,timestamptz) from public,anon,service_role;
revoke all on function public.publish_training_content(uuid) from public,anon,service_role;
revoke all on function public.archive_training_content(uuid) from public,anon,service_role;
revoke all on function public.get_go_practice_content(uuid) from public,anon,service_role;
revoke all on function public.start_training_attempt(uuid,text) from public,anon,service_role;
revoke all on function public.complete_training_attempt(uuid,jsonb,integer) from public,anon,service_role;
revoke all on function public.list_my_training_results(integer) from public,anon,service_role;

grant execute on function public.list_training_catalog(text,text,uuid,text,integer,integer) to authenticated;
grant execute on function public.get_training_filter_options(text) to authenticated;
grant execute on function public.list_academy_modules(text) to authenticated;
grant execute on function public.create_training_content_draft(text,text,text,text,uuid[],text,uuid,uuid,uuid[]) to authenticated;
grant execute on function public.update_training_content_draft(uuid,text,text,text,uuid[],text,uuid,uuid,uuid[],timestamptz) to authenticated;
grant execute on function public.replace_training_questions(uuid,jsonb,timestamptz) to authenticated;
grant execute on function public.publish_training_content(uuid) to authenticated;
grant execute on function public.archive_training_content(uuid) to authenticated;
grant execute on function public.get_go_practice_content(uuid) to authenticated;
grant execute on function public.start_training_attempt(uuid,text) to authenticated;
grant execute on function public.complete_training_attempt(uuid,jsonb,integer) to authenticated;
grant execute on function public.list_my_training_results(integer) to authenticated;

comment on table public.training_question_topics is
  'Exact authoritative Topic attribution per certified Training question.';
comment on table public.training_attempt_answers is
  'Append-only server-scored Staff answer history; never a trusted browser score source.';
comment on function public.list_training_catalog(text,text,uuid,text,integer,integer) is
  'Protected bounded catalog for learner and Studio views with independent RBAC and audience checks.';
comment on function public.complete_training_attempt(uuid,jsonb,integer) is
  'Finalizes one owned Staff attempt and calculates immutable score and Topic results server-side.';
