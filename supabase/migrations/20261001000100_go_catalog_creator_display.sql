-- GO catalog credit comes from the immutable Training creator relationship.
-- Keep the original catalog RPCs available to older clients during rollout.
begin;

create function public.list_go_practice_catalog_v2(
  requested_language text default null,
  requested_topic_id uuid default null,
  requested_limit integer default 100,
  requested_offset integer default 0
)
returns table (
  id uuid,
  content_type text,
  title text,
  description text,
  language text,
  topics jsonb,
  published_at timestamptz,
  creator_display text
)
language sql
stable
security definer
set search_path = pg_catalog
as $function$
  select item.id, item.content_type, item.title, item.description,
    item.language, item.topics, item.published_at,
    coalesce(nullif(btrim(creator.display_name), ''), creator.full_name)
  from public.list_go_practice_catalog(
    requested_language, requested_topic_id, requested_limit, requested_offset
  ) item
  join public.training_content content on content.id = item.id
  join public.users creator on creator.id = content.created_by_user_id
  where (select count(*) from public.training_questions question
    where question.content_id=item.id) >= 10
$function$;

create function public.list_go_host_catalog_v2(
  requested_language text default null,
  requested_limit integer default 100,
  requested_offset integer default 0
)
returns table (
  id uuid,
  content_type text,
  title text,
  description text,
  language text,
  question_count integer,
  topics jsonb,
  published_at timestamptz,
  creator_display text
)
language sql
stable
security definer
set search_path = pg_catalog
as $function$
  select item.id, item.content_type, item.title, item.description,
    item.language, item.question_count, item.topics, item.published_at,
    coalesce(nullif(btrim(creator.display_name), ''), creator.full_name)
  from public.list_go_host_catalog(requested_language, requested_limit, requested_offset) item
  join public.training_content content on content.id = item.id
  join public.users creator on creator.id = content.created_by_user_id
  where item.question_count >= 10
$function$;

alter function public.list_go_practice_catalog_v2(text,uuid,integer,integer) owner to postgres;
alter function public.list_go_host_catalog_v2(text,integer,integer) owner to postgres;
revoke all on function public.list_go_practice_catalog_v2(text,uuid,integer,integer) from public,anon,service_role;
revoke all on function public.list_go_host_catalog_v2(text,integer,integer) from public,anon,service_role;
grant execute on function public.list_go_practice_catalog_v2(text,uuid,integer,integer) to authenticated;
grant execute on function public.list_go_host_catalog_v2(text,integer,integer) to authenticated;

commit;
