-- GO question bank classification only. No content is seeded by this migration.
begin;

create table public.go_question_bank_groups (
  content_id uuid primary key references public.training_content(id) on update restrict on delete restrict,
  source_group_key text not null unique,
  source_sha256 text not null,
  game_mode text not null,
  difficulty text,
  source_ids text[] not null,
  created_at timestamptz not null default now(),
  constraint go_question_bank_group_key_valid check (source_group_key ~ '^[a-z0-9-]{3,80}$'),
  constraint go_question_bank_hash_valid check (source_sha256 ~ '^[a-f0-9]{64}$'),
  constraint go_question_bank_mode_valid check (game_mode in (
    'classic','valid-invalid','disposition-trainer','eligible','objection-battle','certification'
  )),
  constraint go_question_bank_difficulty_valid check (
    (game_mode = 'classic' and difficulty in ('easy','medium','advanced')) or
    (game_mode <> 'classic' and difficulty is null)
  ),
  constraint go_question_bank_source_count check (cardinality(source_ids) = 40)
);

alter table public.go_question_bank_groups enable row level security;
revoke all on table public.go_question_bank_groups from public, anon, authenticated;
grant all on table public.go_question_bank_groups to service_role;

create function pulse_private.keep_go_question_bank_in_review()
returns trigger language plpgsql set search_path = pg_catalog as $function$
begin
  if tg_table_name = 'go_question_bank_groups' then
    if not exists (select 1 from public.training_content content
      where content.id = new.content_id and content.status = 'draft') then
      raise exception 'GO question bank group requires a draft' using errcode='55000';
    end if;
  elsif old.status = 'draft' and new.status <> 'draft' and exists (
    select 1 from public.go_question_bank_groups bank where bank.content_id = new.id
  ) then
    raise exception 'GO question bank requires a separate publication review' using errcode='55000';
  end if;
  return new;
end $function$;

create trigger go_question_bank_group_draft before insert or update on public.go_question_bank_groups
  for each row execute function pulse_private.keep_go_question_bank_in_review();
create trigger training_content_question_bank_review before update on public.training_content
  for each row execute function pulse_private.keep_go_question_bank_in_review();

-- No answer keys are returned here. Existing per-content Studio authoring
-- checks still control who can open the draft and see its questions.
create function public.get_go_question_bank_groups(requested_content_ids uuid[])
returns jsonb language plpgsql stable security definer set search_path = pg_catalog as $function$
declare actor uuid := pulse_private.require_any_training_permission(array['studio.view']);
begin
  if requested_content_ids is null or cardinality(requested_content_ids) > 100 then
    raise exception 'invalid GO question bank lookup' using errcode='22023';
  end if;
  return coalesce((select jsonb_agg(jsonb_build_object(
    'id',bank.content_id,'game_mode',bank.game_mode,'difficulty',bank.difficulty,
    'review_required',true
  ) order by bank.content_id)
    from public.go_question_bank_groups bank
    where bank.content_id = any(requested_content_ids)
      and pulse_private.can_read_training_authoring(bank.content_id)), '[]'::jsonb);
end $function$;

alter function pulse_private.keep_go_question_bank_in_review() owner to postgres;
alter function public.get_go_question_bank_groups(uuid[]) owner to postgres;
revoke all on function pulse_private.keep_go_question_bank_in_review() from public,anon,authenticated,service_role;
revoke all on function public.get_go_question_bank_groups(uuid[]) from public,anon,service_role;
grant execute on function public.get_go_question_bank_groups(uuid[]) to authenticated;

commit;
