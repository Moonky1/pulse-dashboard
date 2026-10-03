-- GO-4: the normal Studio library is for active drafts and current games.
-- Archived items remain available in the explicit Archived tab for audit.
begin;

create or replace function public.list_studio_content(
  requested_status text default null,
  requested_language text default null,
  requested_topic_id uuid default null,
  requested_search text default null,
  requested_limit integer default 50,
  requested_offset integer default 0
)
returns table (id uuid,content_type text,title text,description text,
  language text,status text,topics jsonb,audience jsonb,
  position_targets jsonb,creator_display text,published_at timestamptz,
  updated_at timestamptz,can_open boolean)
language plpgsql stable security definer set search_path = pg_catalog as $function$
declare actor_id uuid := pulse_private.require_any_training_permission(array['studio.view']);
  normalized_search text := nullif(btrim(coalesce(requested_search,'')), '');
  can_manage boolean := pulse_private.has_any_training_permission(array['studio.publish','academy.manage']);
begin
  if requested_status is not null and requested_status not in ('draft','published','archived') then
    raise exception 'invalid Training catalog view' using errcode = '22023';
  end if;
  if requested_language is not null and requested_language not in ('en','es') then
    raise exception 'invalid Training language' using errcode = '22023';
  end if;
  if requested_limit is null or requested_limit not between 1 and 100 or
     requested_offset is null or requested_offset < 0 then
    raise exception 'invalid Training pagination' using errcode = '22023';
  end if;
  return query
  select content.id,content.content_type,content.title,content.description,
    content.language,content.status,
    coalesce((select jsonb_agg(jsonb_build_object('id',topic.id,'code',topic.code,
      'name',topic.name) order by topic.name,topic.id)
      from public.training_content_topics ct
      join public.training_topics topic on topic.id=ct.topic_id
      where ct.content_id=content.id),'[]'::jsonb),
    jsonb_build_object('scope_type',audience.scope_type,'campaign_id',campaign.id,
      'campaign_code',campaign.code,'campaign_name',campaign.name,'team_id',team.id,
      'team_code',team.code,'team_name',team.name),
    coalesce((select jsonb_agg(jsonb_build_object('id',position.id,'code',position.code,
      'name',position.name) order by position.name,position.id)
      from public.training_content_position_targets target
      join public.positions position on position.id=target.position_id
      where target.content_id=content.id),'[]'::jsonb),
    coalesce(nullif(btrim(creator.display_name),''),creator.full_name),
    content.published_at,content.updated_at,
    pulse_private.can_read_training_authoring(content.id)
  from public.training_content content
  join public.training_content_audiences audience on audience.content_id=content.id
  join public.users creator on creator.id=content.created_by_user_id
  left join public.campaigns campaign on campaign.id=audience.campaign_id
  left join public.teams team on team.id=audience.team_id
  where (requested_status is null or content.status=requested_status)
    and (requested_status is not null or content.status <> 'archived')
    and (requested_language is null or content.language=requested_language)
    and (requested_topic_id is null or exists(select 1 from public.training_content_topics t
      where t.content_id=content.id and t.topic_id=requested_topic_id))
    and (normalized_search is null or content.title ilike '%'||normalized_search||'%' or
      coalesce(content.description,'') ilike '%'||normalized_search||'%')
    and (pulse_private.can_read_training_authoring(content.id) or
      (can_manage and pulse_private.has_training_content_permission('studio.publish',content.id)) or
      (content.status='published' and pulse_private.has_training_content_permission('studio.view',content.id)))
    and (content.status <> 'published' or content.is_current)
    and (requested_status is not null or content.status <> 'published' or not exists (
      select 1 from public.training_content update_draft
      where update_draft.game_id=content.game_id and update_draft.status='draft'
        and update_draft.version_number > 1
    ))
  order by content.updated_at desc,content.id
  limit requested_limit offset requested_offset;
end $function$;

commit;
