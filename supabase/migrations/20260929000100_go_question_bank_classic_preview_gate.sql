-- A reviewed Classic bank can use the existing hosted quiz contract. Other
-- legacy modes remain draft-only until their own game rules are certified.
begin;

alter table public.go_question_bank_groups
  add column reviewed_at timestamptz,
  add column reviewed_content_updated_at timestamptz;

create or replace function pulse_private.keep_go_question_bank_in_review()
returns trigger language plpgsql set search_path = pg_catalog as $function$
declare bank public.go_question_bank_groups%rowtype;
begin
  if tg_table_name = 'go_question_bank_groups' then
    if not exists (select 1 from public.training_content content
      where content.id = new.content_id and content.status = 'draft') then
      raise exception 'GO question bank group requires a draft' using errcode='55000';
    end if;
  elsif old.status = 'draft' and new.status <> 'draft' then
    select * into bank from public.go_question_bank_groups
      where content_id = new.id;
    if found and (bank.game_mode <> 'classic' or bank.reviewed_at is null or
      bank.reviewed_content_updated_at is distinct from old.updated_at or
      (select count(*) from public.training_questions question
        where question.content_id = new.id) <> 40) then
      raise exception 'GO question bank requires reviewed Classic content'
        using errcode='55000';
    end if;
  end if;
  return new;
end $function$;

-- A changed answer or question invalidates the editorial gate. Published
-- versions are already immutable under the existing GO versioning contract.
create function pulse_private.invalidate_go_question_bank_review()
returns trigger language plpgsql set search_path = pg_catalog as $function$
declare target_id uuid := case when tg_op='DELETE' then old.content_id else new.content_id end;
begin
  update public.go_question_bank_groups bank
    set reviewed_at = null, reviewed_content_updated_at = null
    where bank.content_id = target_id and bank.reviewed_at is not null;
  return case when tg_op='DELETE' then old else new end;
end $function$;

create trigger training_questions_bank_review
  after insert or update or delete on public.training_questions
  for each row execute function pulse_private.invalidate_go_question_bank_review();

-- Expose classification, never answers, to an eligible Studio author, host,
-- or player. Direct table access remains denied to browser roles.
create or replace function public.get_go_question_bank_groups(requested_content_ids uuid[])
returns jsonb language plpgsql stable security definer set search_path = pg_catalog as $function$
declare actor uuid := pulse_private.require_any_training_permission(
  array['studio.view','go.host','go.play']);
begin
  if requested_content_ids is null or cardinality(requested_content_ids) > 100 then
    raise exception 'invalid GO question bank lookup' using errcode='22023';
  end if;
  return coalesce((select jsonb_agg(jsonb_build_object(
    'id',bank.content_id,'game_mode',bank.game_mode,'difficulty',bank.difficulty,
    'review_required',bank.reviewed_at is null
  ) order by bank.content_id)
    from public.go_question_bank_groups bank
    join public.training_content content on content.id=bank.content_id
    where bank.content_id = any(requested_content_ids)
      and (pulse_private.can_read_training_authoring(bank.content_id) or
        (content.status='published' and content.is_current and (
          pulse_private.go_staff_has_content_permission('go.host',content.id,actor) or
          pulse_private.has_training_learner_content_permission('go.play',content.id,actor)
        )))), '[]'::jsonb);
end $function$;

alter function pulse_private.keep_go_question_bank_in_review() owner to postgres;
alter function pulse_private.invalidate_go_question_bank_review() owner to postgres;
alter function public.get_go_question_bank_groups(uuid[]) owner to postgres;
revoke all on function pulse_private.invalidate_go_question_bank_review()
  from public,anon,authenticated,service_role;
revoke all on function public.get_go_question_bank_groups(uuid[])
  from public,anon,service_role;
grant execute on function public.get_go_question_bank_groups(uuid[]) to authenticated;

commit;
