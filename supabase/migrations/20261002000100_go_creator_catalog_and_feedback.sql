-- Published creator games remain discoverable before their bank reaches ten.
-- The round-start contracts still enforce the ten-question minimum.
begin;

create function public.list_go_practice_catalog_v3(
  requested_language text default null,
  requested_topic_id uuid default null,
  requested_limit integer default 100,
  requested_offset integer default 0
)
returns table (
  id uuid, content_type text, title text, description text, language text,
  topics jsonb, published_at timestamptz, creator_display text,
  question_count integer
)
language sql stable security definer set search_path = pg_catalog
as $function$
  select item.id, item.content_type, item.title, item.description,
    item.language, item.topics, item.published_at,
    coalesce(nullif(btrim(creator.display_name), ''), creator.full_name),
    (select count(*)::integer from public.training_questions question
      where question.content_id = item.id)
  from public.list_go_practice_catalog(
    requested_language, requested_topic_id, requested_limit, requested_offset
  ) item
  join public.training_content content on content.id = item.id
  join public.users creator on creator.id = content.created_by_user_id
$function$;

create function public.list_go_host_catalog_v3(
  requested_language text default null,
  requested_limit integer default 100,
  requested_offset integer default 0
)
returns table (
  id uuid, content_type text, title text, description text, language text,
  question_count integer, topics jsonb, published_at timestamptz,
  creator_display text
)
language sql stable security definer set search_path = pg_catalog
as $function$
  select item.id, item.content_type, item.title, item.description,
    item.language, item.question_count, item.topics, item.published_at,
    coalesce(nullif(btrim(creator.display_name), ''), creator.full_name)
  from public.list_go_host_catalog(
    requested_language, requested_limit, requested_offset
  ) item
  join public.training_content content on content.id = item.id
  join public.users creator on creator.id = content.created_by_user_id
$function$;

-- Reuse the server-scored, deadline-checked submission. Only return the
-- submitting learner's own verdict; Certification never returns a verdict.
create function public.submit_go_practice_answer_with_feedback(
  requested_attempt_id uuid,
  requested_question_id uuid,
  requested_answer jsonb
)
returns jsonb language plpgsql volatile security definer set search_path = pg_catalog
as $function$
declare
  outcome jsonb;
  verdict boolean;
  certification_mode boolean;
begin
  outcome := public.submit_go_practice_answer(
    requested_attempt_id, requested_question_id, requested_answer
  );
  select answer.is_correct,
    exists (select 1 from public.go_question_bank_groups bank
      join public.training_attempts attempt on attempt.content_id = bank.content_id
      where attempt.id = requested_attempt_id and bank.game_mode = 'certification')
  into verdict, certification_mode
  from public.training_attempt_answers answer
  where answer.attempt_id = requested_attempt_id
    and answer.question_id = requested_question_id;
  if not found then raise exception 'GO Practice answer unavailable' using errcode = 'P0002'; end if;
  if certification_mode then return outcome; end if;
  return outcome || jsonb_build_object(
    'answer_feedback', case when verdict then 'correct' else 'incorrect' end
  );
end
$function$;

alter function public.list_go_practice_catalog_v3(text,uuid,integer,integer) owner to postgres;
alter function public.list_go_host_catalog_v3(text,integer,integer) owner to postgres;
alter function public.submit_go_practice_answer_with_feedback(uuid,uuid,jsonb) owner to postgres;
revoke all on function public.list_go_practice_catalog_v3(text,uuid,integer,integer) from public,anon,service_role;
revoke all on function public.list_go_host_catalog_v3(text,integer,integer) from public,anon,service_role;
revoke all on function public.submit_go_practice_answer_with_feedback(uuid,uuid,jsonb) from public,anon,service_role;
grant execute on function public.list_go_practice_catalog_v3(text,uuid,integer,integer) to authenticated;
grant execute on function public.list_go_host_catalog_v3(text,integer,integer) to authenticated;
grant execute on function public.submit_go_practice_answer_with_feedback(uuid,uuid,jsonb) to authenticated;

commit;
