-- Timed GO questions. Older Training RPCs stay available for Academy and
-- Studio clients, but GO Practice must record each answer before its deadline.
begin;

alter table public.training_questions
  add column time_limit_seconds integer not null default 30
  constraint training_questions_time_limit_valid
  check (time_limit_seconds in (10,20,30,60));

create function public.get_training_content_authoring_details_v2(requested_content_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog
as $function$
declare
  details jsonb := public.get_training_content_authoring_details(requested_content_id);
  questions jsonb;
begin
  select coalesce(jsonb_agg(item.value || jsonb_build_object(
    'time_limit_seconds', question.time_limit_seconds
  ) order by item.ordinality), '[]'::jsonb) into questions
  from jsonb_array_elements(details->'questions') with ordinality item(value, ordinality)
  join public.training_questions question on question.id=(item.value->>'id')::uuid;
  return jsonb_set(details, '{questions}', questions);
end
$function$;

create function public.replace_training_questions_v2(
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
  item jsonb;
  saved record;
begin
  if jsonb_typeof(requested_questions) is distinct from 'array'
    or jsonb_array_length(requested_questions) not between 1 and 100 then
    raise exception 'questions must be a bounded array' using errcode='22023';
  end if;
  for item in select value from jsonb_array_elements(requested_questions) loop
    if jsonb_typeof(item) is distinct from 'object'
      or (item ? 'time_limit_seconds' and (
        jsonb_typeof(item->'time_limit_seconds') is distinct from 'number'
        or (item->>'time_limit_seconds') not in ('10','20','30','60')
      )) then
      raise exception 'invalid question time limit' using errcode='22023';
    end if;
  end loop;

  -- The existing RPC performs all draft/permission/topic/answer validation.
  -- Both calls are in this transaction, so a failure rolls back the replace.
  select * into saved from public.replace_training_questions(
    requested_content_id, requested_questions, expected_updated_at
  );
  update public.training_questions question
  set time_limit_seconds=coalesce((item.value->>'time_limit_seconds')::integer,30)
  from jsonb_array_elements(requested_questions) with ordinality item(value, ordinality)
  where question.content_id=requested_content_id
    and question.position=item.ordinality;
  return query select saved.content_id, saved.question_count, saved.updated_at;
end
$function$;

create function public.get_go_practice_content_v2(requested_content_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog
as $function$
declare
  content jsonb := public.get_go_practice_content(requested_content_id);
  questions jsonb;
begin
  select coalesce(jsonb_agg(item.value || jsonb_build_object(
    'time_limit_seconds', question.time_limit_seconds
  ) order by item.ordinality), '[]'::jsonb) into questions
  from jsonb_array_elements(content->'questions') with ordinality item(value, ordinality)
  join public.training_questions question on question.id=(item.value->>'id')::uuid;
  return jsonb_set(content, '{questions}', questions);
end
$function$;

alter function public.get_training_content_authoring_details_v2(uuid) owner to postgres;
alter function public.replace_training_questions_v2(uuid,jsonb,timestamptz) owner to postgres;
alter function public.get_go_practice_content_v2(uuid) owner to postgres;
revoke all on function public.get_training_content_authoring_details_v2(uuid) from public,anon,service_role;
revoke all on function public.replace_training_questions_v2(uuid,jsonb,timestamptz) from public,anon,service_role;
revoke all on function public.get_go_practice_content_v2(uuid) from public,anon,service_role;
grant execute on function public.get_training_content_authoring_details_v2(uuid) to authenticated;
grant execute on function public.replace_training_questions_v2(uuid,jsonb,timestamptz) to authenticated;
grant execute on function public.get_go_practice_content_v2(uuid) to authenticated;

commit;
