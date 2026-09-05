-- Pulse Studio STUDIO-1B.1: protected, audit-neutral authoring read contract.
--
-- This RPC is intentionally the only authenticated browser path that returns
-- Training answer keys. Canonical Training tables remain deny-by-default.

create function public.get_training_content_authoring_details(
  requested_content_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog
as $function$
declare
  actor_id uuid := pulse_private.current_training_staff_user_id();
  content_row public.training_content%rowtype;
  can_read boolean := false;
  response jsonb;
begin
  select content.*
  into content_row
  from public.training_content content
  where content.id = requested_content_id;

  if found then
    can_read := (
      content_row.status = 'draft'
      and pulse_private.has_training_content_permission('studio.create', content_row.id)
      and (
        content_row.created_by_user_id = actor_id
        or pulse_private.has_any_training_permission(array['academy.manage'])
      )
    ) or pulse_private.has_training_content_permission('studio.publish', content_row.id);
  end if;

  -- Missing and inaccessible content intentionally share one response so the
  -- contract does not disclose whether a guessed identifier exists.
  if not found or not can_read then
    raise exception 'Studio content unavailable' using errcode = 'P0002';
  end if;

  select jsonb_build_object(
    'content', jsonb_build_object(
      'id', content.id,
      'title', content.title,
      'description', content.description,
      'content_type', content.content_type,
      'language', content.language,
      'status', content.status,
      'creator', jsonb_build_object(
        'display_name', coalesce(nullif(btrim(creator.display_name), ''), creator.full_name)
      ),
      'created_at', content.created_at,
      'updated_at', content.updated_at,
      'published_at', content.published_at,
      'archived_at', content.archived_at
    ),
    'topics', coalesce((
      select jsonb_agg(
        jsonb_build_object('id', topic.id, 'code', topic.code, 'name', topic.name)
        order by topic.name, topic.id
      )
      from public.training_content_topics content_topic
      join public.training_topics topic on topic.id = content_topic.topic_id
      where content_topic.content_id = content.id
    ), '[]'::jsonb),
    'audience', jsonb_build_object(
      'scope_type', audience.scope_type,
      'campaign_id', campaign.id,
      'campaign_code', campaign.code,
      'campaign_name', campaign.name,
      'team_id', team.id,
      'team_code', team.code,
      'team_name', team.name
    ),
    'position_targets', coalesce((
      select jsonb_agg(
        jsonb_build_object('id', position.id, 'code', position.code, 'name', position.name)
        order by position.name, position.id
      )
      from public.training_content_position_targets target
      join public.positions position on position.id = target.position_id
      where target.content_id = content.id
    ), '[]'::jsonb),
    'questions', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', question.id,
          'position', question.position,
          'question_type', question.question_type,
          'prompt', question.prompt,
          'answer_options', question.answer_options,
          'correct_answer', question.correct_answer,
          'explanation', question.explanation,
          'media_id', question.media_id,
          'media', case when media.id is null then null else jsonb_build_object(
            'id', media.id,
            'media_type', media.media_type,
            'mime_type', media.mime_type,
            'alt_text', media.alt_text
          ) end,
          'topic_ids', coalesce((
            select jsonb_agg(question_topic.topic_id order by question_topic.topic_id)
            from public.training_question_topics question_topic
            where question_topic.question_id = question.id
          ), '[]'::jsonb),
          'topics', coalesce((
            select jsonb_agg(
              jsonb_build_object('id', topic.id, 'code', topic.code, 'name', topic.name)
              order by topic.name, topic.id
            )
            from public.training_question_topics question_topic
            join public.training_topics topic on topic.id = question_topic.topic_id
            where question_topic.question_id = question.id
          ), '[]'::jsonb)
        )
        order by question.position, question.id
      )
      from public.training_questions question
      left join public.training_media media on media.id = question.media_id
      where question.content_id = content.id
    ), '[]'::jsonb)
  )
  into response
  from public.training_content content
  join public.users creator on creator.id = content.created_by_user_id
  join public.training_content_audiences audience on audience.content_id = content.id
  left join public.campaigns campaign on campaign.id = audience.campaign_id
  left join public.teams team on team.id = audience.team_id
  where content.id = content_row.id;

  return response;
end
$function$;

alter function public.get_training_content_authoring_details(uuid) owner to postgres;

revoke all on function public.get_training_content_authoring_details(uuid)
  from public, anon, service_role;
grant execute on function public.get_training_content_authoring_details(uuid)
  to authenticated;

comment on function public.get_training_content_authoring_details(uuid) is
  'Returns one complete, scope-authorized Studio authoring payload including answer keys without direct table access or audit side effects.';
