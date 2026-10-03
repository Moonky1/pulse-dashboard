-- GO-4: reuse the established revision contract and preserve question timing
-- when cloning a published version. Historical versions remain untouched.
begin;

create function public.create_training_content_revision_v2(requested_content_id uuid)
returns table (id uuid, game_id uuid, version_number integer, created boolean)
language plpgsql volatile security definer set search_path = pg_catalog as $function$
declare cloned record;
begin
  select * into cloned from public.create_training_content_revision(requested_content_id);
  if cloned.created then
    update public.training_questions question
      set time_limit_seconds = source_question.time_limit_seconds
    from public.training_questions source_question
    where question.content_id = cloned.id
      and source_question.content_id = requested_content_id
      and source_question.position = question.position;
  end if;
  return query select cloned.id, cloned.game_id, cloned.version_number, cloned.created;
end $function$;

alter function public.create_training_content_revision_v2(uuid) owner to postgres;
revoke all on function public.create_training_content_revision_v2(uuid) from public, anon, service_role;
grant execute on function public.create_training_content_revision_v2(uuid) to authenticated;

commit;
