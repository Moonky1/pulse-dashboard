-- Pulse Training TRAIN-1A: shared Studio, Academy, and Pulse GO foundation.
--
-- Local and isolated only. This migration creates protected canonical data
-- primitives. It intentionally exposes no browser mutation RPC, creates no
-- learner/content fixtures, and does not alter legacy Studio/GO tables.

create table public.training_topics (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint training_topics_code_format check (
    code = lower(btrim(code)) and code ~ '^[a-z][a-z0-9_]{1,63}$'
  ),
  constraint training_topics_name_not_blank check (length(btrim(name)) between 2 and 120),
  constraint training_topics_description_length check (
    description is null or length(btrim(description)) <= 500
  )
);

create unique index training_topics_code_unique on public.training_topics(lower(code));
create index training_topics_active_idx on public.training_topics(is_active) where is_active;

create table public.training_media (
  id uuid primary key default gen_random_uuid(),
  media_type text not null,
  storage_bucket text not null,
  storage_path text not null,
  mime_type text not null,
  alt_text text,
  created_by_user_id uuid not null,
  created_at timestamptz not null default now(),
  constraint training_media_type_valid check (media_type in ('image', 'audio')),
  constraint training_media_bucket_format check (
    storage_bucket = lower(btrim(storage_bucket))
    and storage_bucket ~ '^[a-z][a-z0-9_-]{1,62}$'
  ),
  constraint training_media_path_safe check (
    length(btrim(storage_path)) between 3 and 512
    and storage_path !~ '(^|/)\.\.(/|$)'
    and storage_path !~ '^/'
  ),
  constraint training_media_mime_valid check (
    (media_type = 'image' and mime_type ~ '^image/[a-z0-9.+-]+$')
    or (media_type = 'audio' and mime_type ~ '^audio/[a-z0-9.+-]+$')
  ),
  constraint training_media_alt_length check (alt_text is null or length(btrim(alt_text)) <= 300),
  constraint training_media_creator_fk foreign key (created_by_user_id)
    references public.users(id) on update restrict on delete restrict,
  constraint training_media_storage_unique unique (storage_bucket, storage_path)
);

create index training_media_creator_idx on public.training_media(created_by_user_id, created_at desc);

create table public.training_content (
  id uuid primary key default gen_random_uuid(),
  content_type text not null,
  title text not null,
  description text,
  language text not null,
  status text not null default 'draft',
  created_by_user_id uuid not null,
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint training_content_type_valid check (content_type in ('lesson', 'quiz', 'assessment')),
  constraint training_content_title_not_blank check (length(btrim(title)) between 2 and 180),
  constraint training_content_description_length check (
    description is null or length(btrim(description)) <= 2000
  ),
  constraint training_content_language_valid check (language in ('en', 'es')),
  constraint training_content_status_valid check (status in ('draft', 'published', 'archived')),
  constraint training_content_creator_fk foreign key (created_by_user_id)
    references public.users(id) on update restrict on delete restrict,
  constraint training_content_lifecycle_timestamps check (
    (status = 'draft' and published_at is null and archived_at is null)
    or (status = 'published' and published_at is not null and archived_at is null)
    or (status = 'archived' and archived_at is not null)
  )
);

create index training_content_status_language_idx
  on public.training_content(status, language, updated_at desc);
create index training_content_creator_idx
  on public.training_content(created_by_user_id, updated_at desc);

create table public.training_content_topics (
  content_id uuid not null,
  topic_id uuid not null,
  primary key (content_id, topic_id),
  constraint training_content_topics_content_fk foreign key (content_id)
    references public.training_content(id) on update restrict on delete restrict,
  constraint training_content_topics_topic_fk foreign key (topic_id)
    references public.training_topics(id) on update restrict on delete restrict
);

create index training_content_topics_topic_idx on public.training_content_topics(topic_id, content_id);

-- Authorization scope and content audience are intentionally independent.
-- Each content item has one geographic audience. Optional Position rows below
-- form an additional AND-filter without encoding job-title strings.
create table public.training_content_audiences (
  content_id uuid primary key,
  scope_type text not null,
  campaign_id uuid,
  team_id uuid,
  constraint training_content_audiences_content_fk foreign key (content_id)
    references public.training_content(id) on update restrict on delete restrict,
  constraint training_content_audiences_campaign_fk foreign key (campaign_id)
    references public.campaigns(id) on update restrict on delete restrict,
  constraint training_content_audiences_team_fk foreign key (team_id)
    references public.teams(id) on update restrict on delete restrict,
  constraint training_content_audiences_scope_valid check (
    (scope_type = 'global' and campaign_id is null and team_id is null)
    or (scope_type = 'campaign' and campaign_id is not null and team_id is null)
    or (scope_type = 'team' and campaign_id is null and team_id is not null)
  )
);

create index training_content_audiences_campaign_idx
  on public.training_content_audiences(campaign_id) where campaign_id is not null;
create index training_content_audiences_team_idx
  on public.training_content_audiences(team_id) where team_id is not null;

create table public.training_content_position_targets (
  content_id uuid not null,
  position_id uuid not null,
  primary key (content_id, position_id),
  constraint training_content_position_targets_content_fk foreign key (content_id)
    references public.training_content(id) on update restrict on delete restrict,
  constraint training_content_position_targets_position_fk foreign key (position_id)
    references public.positions(id) on update restrict on delete restrict
);

create index training_content_position_targets_position_idx
  on public.training_content_position_targets(position_id, content_id);

create table public.training_questions (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null,
  position integer not null,
  question_type text not null,
  prompt text not null,
  answer_options jsonb not null default '[]'::jsonb,
  correct_answer jsonb not null,
  explanation text,
  media_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint training_questions_content_fk foreign key (content_id)
    references public.training_content(id) on update restrict on delete restrict,
  constraint training_questions_media_fk foreign key (media_id)
    references public.training_media(id) on update restrict on delete restrict,
  constraint training_questions_position_positive check (position between 1 and 1000),
  constraint training_questions_type_valid check (
    question_type in ('multiple_choice', 'true_false', 'text')
  ),
  constraint training_questions_prompt_not_blank check (length(btrim(prompt)) between 2 and 2000),
  constraint training_questions_options_array check (jsonb_typeof(answer_options) = 'array'),
  constraint training_questions_explanation_length check (
    explanation is null or length(btrim(explanation)) <= 4000
  ),
  constraint training_questions_content_position_unique unique (content_id, position)
);

create index training_questions_content_idx on public.training_questions(content_id, position);
create index training_questions_media_idx on public.training_questions(media_id) where media_id is not null;

create table public.training_modules (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  language text not null,
  status text not null default 'draft',
  created_by_user_id uuid not null,
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint training_modules_title_not_blank check (length(btrim(title)) between 2 and 180),
  constraint training_modules_description_length check (
    description is null or length(btrim(description)) <= 2000
  ),
  constraint training_modules_language_valid check (language in ('en', 'es')),
  constraint training_modules_status_valid check (status in ('draft', 'published', 'archived')),
  constraint training_modules_creator_fk foreign key (created_by_user_id)
    references public.users(id) on update restrict on delete restrict,
  constraint training_modules_lifecycle_timestamps check (
    (status = 'draft' and published_at is null and archived_at is null)
    or (status = 'published' and published_at is not null and archived_at is null)
    or (status = 'archived' and archived_at is not null)
  )
);

create index training_modules_status_language_idx
  on public.training_modules(status, language, updated_at desc);

create table public.training_module_items (
  module_id uuid not null,
  content_id uuid not null,
  position integer not null,
  is_required boolean not null default true,
  primary key (module_id, content_id),
  constraint training_module_items_module_fk foreign key (module_id)
    references public.training_modules(id) on update restrict on delete restrict,
  constraint training_module_items_content_fk foreign key (content_id)
    references public.training_content(id) on update restrict on delete restrict,
  constraint training_module_items_position_positive check (position between 1 and 1000),
  constraint training_module_items_position_unique unique (module_id, position)
);

-- Canonical learner identity is independent of both Staff RBAC and the future
-- Agent domain. TRAIN-1A supports only a referentially complete Staff bridge.
-- A future Agent bridge must reference the real Agent Identity table before the
-- learner_kind catalog is expanded; no fake Agent identity is permitted here.
create table public.training_learners (
  id uuid primary key default gen_random_uuid(),
  learner_kind text not null,
  created_at timestamptz not null default now(),
  constraint training_learners_kind_train1a check (learner_kind = 'staff')
);

create table public.training_staff_learner_links (
  learner_id uuid primary key,
  staff_user_id uuid not null unique,
  linked_at timestamptz not null default now(),
  constraint training_staff_learner_links_learner_fk foreign key (learner_id)
    references public.training_learners(id) on update restrict on delete restrict,
  constraint training_staff_learner_links_user_fk foreign key (staff_user_id)
    references public.users(id) on update restrict on delete restrict
);

create table public.training_attempts (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null,
  content_id uuid not null,
  source_mode text not null,
  attempt_number integer not null,
  status text not null default 'started',
  language text not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  duration_seconds integer,
  created_at timestamptz not null default now(),
  constraint training_attempts_learner_fk foreign key (learner_id)
    references public.training_learners(id) on update restrict on delete restrict,
  constraint training_attempts_content_fk foreign key (content_id)
    references public.training_content(id) on update restrict on delete restrict,
  constraint training_attempts_source_valid check (
    source_mode in ('academy', 'go_practice', 'go_hosted', 'assessment')
  ),
  constraint training_attempts_status_valid check (status in ('started', 'completed', 'abandoned')),
  constraint training_attempts_number_positive check (attempt_number > 0),
  constraint training_attempts_language_valid check (language in ('en', 'es')),
  constraint training_attempts_completion_valid check (
    (status = 'started' and completed_at is null)
    or (status in ('completed', 'abandoned') and completed_at is not null and completed_at >= started_at)
  ),
  constraint training_attempts_duration_valid check (duration_seconds is null or duration_seconds >= 0),
  constraint training_attempts_number_unique unique (learner_id, content_id, source_mode, attempt_number)
);

create index training_attempts_learner_history_idx
  on public.training_attempts(learner_id, started_at desc, id);
create index training_attempts_content_idx
  on public.training_attempts(content_id, started_at desc);

create table public.training_results (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null unique,
  total_questions integer not null,
  correct_answers integer not null,
  score_percent numeric(5,2) not null,
  completed boolean not null,
  recorded_at timestamptz not null default now(),
  constraint training_results_attempt_fk foreign key (attempt_id)
    references public.training_attempts(id) on update restrict on delete restrict,
  constraint training_results_counts_valid check (
    total_questions >= 0 and correct_answers between 0 and total_questions
  ),
  constraint training_results_score_valid check (score_percent between 0 and 100)
  ,constraint training_results_completed_true check (completed)
);

create index training_results_recorded_idx on public.training_results(recorded_at desc, id);

create table public.training_result_topics (
  result_id uuid not null,
  topic_id uuid not null,
  total_questions integer not null,
  correct_answers integer not null,
  primary key (result_id, topic_id),
  constraint training_result_topics_result_fk foreign key (result_id)
    references public.training_results(id) on update restrict on delete restrict,
  constraint training_result_topics_topic_fk foreign key (topic_id)
    references public.training_topics(id) on update restrict on delete restrict,
  constraint training_result_topics_counts_valid check (
    total_questions > 0 and correct_answers between 0 and total_questions
  )
);

create function pulse_private.validate_training_question()
returns trigger
language plpgsql
set search_path = pg_catalog
as $function$
declare
  option_count integer;
begin
  if not exists (
    select 1 from public.training_content content
    where content.id = new.content_id and content.status = 'draft'
  ) then
    raise exception 'questions may be changed only while content is draft';
  end if;

  option_count := jsonb_array_length(new.answer_options);

  if new.question_type = 'multiple_choice' then
    if option_count < 2 or option_count > 8 or jsonb_typeof(new.correct_answer) <> 'number' then
      raise exception 'multiple-choice questions require 2-8 options and a numeric correct index';
    end if;
    if (new.correct_answer #>> '{}')::integer < 0
       or (new.correct_answer #>> '{}')::integer >= option_count then
      raise exception 'multiple-choice correct index is outside the option range';
    end if;
  elsif new.question_type = 'true_false' then
    if option_count <> 0 or jsonb_typeof(new.correct_answer) <> 'boolean' then
      raise exception 'true/false questions require no stored options and a boolean answer';
    end if;
  elsif new.question_type = 'text' then
    if option_count <> 0 or jsonb_typeof(new.correct_answer) <> 'array'
       or jsonb_array_length(new.correct_answer) < 1 then
      raise exception 'text questions require accepted answers and no options';
    end if;
  end if;

  new.updated_at := now();
  return new;
end
$function$;

create function pulse_private.enforce_training_content_lifecycle()
returns trigger
language plpgsql
set search_path = pg_catalog
as $function$
begin
  if tg_op = 'INSERT' and new.status <> 'draft' then
    raise exception 'new training content and modules must begin as draft';
  elsif tg_op = 'UPDATE' then
    if new.id is distinct from old.id
       or new.created_by_user_id is distinct from old.created_by_user_id
       or new.created_at is distinct from old.created_at then
      raise exception 'immutable training content identity fields cannot be changed';
    end if;
    if new.status is distinct from old.status and not (
      (old.status = 'draft' and new.status in ('published', 'archived'))
      or (old.status = 'published' and new.status = 'archived')
    ) then
      raise exception 'invalid training content lifecycle transition: % -> %', old.status, new.status;
    end if;

    if new.status = 'published' and old.status <> 'published' then
      if tg_table_name = 'training_content' then
        if not exists (
          select 1
          from public.training_content_topics content_topic
          join public.training_topics topic on topic.id = content_topic.topic_id and topic.is_active
          where content_topic.content_id = new.id
        ) then
          raise exception 'published training content requires an active Topic';
        end if;

        if not exists (
          select 1 from public.training_content_audiences audience
          left join public.campaigns campaign on campaign.id = audience.campaign_id
          left join public.teams team on team.id = audience.team_id
          where audience.content_id = new.id
            and (
              audience.scope_type = 'global'
              or (audience.scope_type = 'campaign' and campaign.is_active)
              or (audience.scope_type = 'team' and team.is_active)
            )
        ) then
          raise exception 'published training content requires a valid active audience';
        end if;

        if exists (
          select 1
          from public.training_content_position_targets target
          join public.positions position on position.id = target.position_id
          where target.content_id = new.id and not position.is_active
        ) then
          raise exception 'published training content cannot target an inactive Position';
        end if;

        if new.content_type in ('quiz', 'assessment') and not exists (
          select 1 from public.training_questions question where question.content_id = new.id
        ) then
          raise exception 'published quiz or assessment content requires questions';
        end if;
      elsif tg_table_name = 'training_modules' then
        if not exists (
          select 1 from public.training_module_items item where item.module_id = new.id
        ) or exists (
          select 1
          from public.training_module_items item
          join public.training_content content on content.id = item.content_id
          where item.module_id = new.id
            and (content.status <> 'published' or content.language <> new.language)
        ) then
          raise exception 'published modules require published same-language content';
        end if;
      end if;
    end if;
  end if;

  if new.status = 'published' and new.published_at is null then new.published_at := now(); end if;
  if new.status = 'archived' and new.archived_at is null then new.archived_at := now(); end if;
  new.updated_at := now();
  return new;
end
$function$;

create function pulse_private.require_draft_training_content()
returns trigger
language plpgsql
set search_path = pg_catalog
as $function$
declare
  target_content_id uuid;
begin
  target_content_id := case when tg_op = 'DELETE' then old.content_id else new.content_id end;
  if not exists (
    select 1 from public.training_content content
    where content.id = target_content_id and content.status = 'draft'
  ) then
    raise exception 'training content children may be changed only while content is draft';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end
$function$;

create function pulse_private.enforce_training_attempt_update()
returns trigger
language plpgsql
set search_path = pg_catalog
as $function$
begin
  if tg_op = 'INSERT' then
    if not exists (
      select 1 from public.training_content content
      where content.id = new.content_id
        and content.status = 'published'
        and content.language = new.language
    ) then
      raise exception 'new training attempts require published content in the selected language';
    end if;
  else
    if new.id is distinct from old.id
       or new.learner_id is distinct from old.learner_id
       or new.content_id is distinct from old.content_id
       or new.source_mode is distinct from old.source_mode
       or new.attempt_number is distinct from old.attempt_number
       or new.language is distinct from old.language
       or new.started_at is distinct from old.started_at
       or new.created_at is distinct from old.created_at then
      raise exception 'training attempt identity fields are immutable';
    end if;
    if new.status is distinct from old.status and not (
      old.status = 'started' and new.status in ('completed', 'abandoned')
    ) then
      raise exception 'invalid training attempt transition: % -> %', old.status, new.status;
    end if;
  end if;
  return new;
end
$function$;

create function pulse_private.validate_training_result()
returns trigger
language plpgsql
set search_path = pg_catalog
as $function$
declare
  expected_score numeric(5,2);
begin
  if not exists (
    select 1 from public.training_attempts attempt
    where attempt.id = new.attempt_id and attempt.status = 'completed'
  ) then
    raise exception 'training results require a completed attempt';
  end if;

  expected_score := case
    when new.total_questions = 0 then 0
    else round((new.correct_answers::numeric * 100) / new.total_questions, 2)
  end;
  if new.score_percent <> expected_score then
    raise exception 'training result score does not match correct and total question counts';
  end if;
  return new;
end
$function$;

create function pulse_private.prevent_training_result_mutation()
returns trigger
language plpgsql
set search_path = pg_catalog
as $function$
begin
  raise exception 'training results are append-only';
end
$function$;

create function pulse_private.require_staff_learner_link()
returns trigger
language plpgsql
set search_path = pg_catalog
as $function$
begin
  if not exists (
    select 1 from public.training_staff_learner_links link
    where link.learner_id = new.id
  ) then
    raise exception 'Staff training learner requires a canonical Staff link';
  end if;
  return null;
end
$function$;

alter function pulse_private.validate_training_question() owner to postgres;
alter function pulse_private.enforce_training_content_lifecycle() owner to postgres;
alter function pulse_private.require_draft_training_content() owner to postgres;
alter function pulse_private.enforce_training_attempt_update() owner to postgres;
alter function pulse_private.validate_training_result() owner to postgres;
alter function pulse_private.prevent_training_result_mutation() owner to postgres;
alter function pulse_private.require_staff_learner_link() owner to postgres;
revoke all on function pulse_private.validate_training_question() from public, anon, authenticated, service_role;
revoke all on function pulse_private.enforce_training_content_lifecycle() from public, anon, authenticated, service_role;
revoke all on function pulse_private.require_draft_training_content() from public, anon, authenticated, service_role;
revoke all on function pulse_private.enforce_training_attempt_update() from public, anon, authenticated, service_role;
revoke all on function pulse_private.validate_training_result() from public, anon, authenticated, service_role;
revoke all on function pulse_private.prevent_training_result_mutation() from public, anon, authenticated, service_role;
revoke all on function pulse_private.require_staff_learner_link() from public, anon, authenticated, service_role;

create trigger training_topics_set_updated_at before update on public.training_topics
for each row execute function pulse_private.set_updated_at();
create trigger training_content_enforce_lifecycle before insert or update on public.training_content
for each row execute function pulse_private.enforce_training_content_lifecycle();
create trigger training_questions_validate before insert or update on public.training_questions
for each row execute function pulse_private.validate_training_question();
create trigger training_questions_require_draft before delete on public.training_questions
for each row execute function pulse_private.require_draft_training_content();
create trigger training_content_topics_require_draft before insert or update or delete on public.training_content_topics
for each row execute function pulse_private.require_draft_training_content();
create trigger training_content_audiences_require_draft before insert or update or delete on public.training_content_audiences
for each row execute function pulse_private.require_draft_training_content();
create trigger training_content_position_targets_require_draft before insert or update or delete on public.training_content_position_targets
for each row execute function pulse_private.require_draft_training_content();
create trigger training_modules_enforce_lifecycle before insert or update on public.training_modules
for each row execute function pulse_private.enforce_training_content_lifecycle();
create constraint trigger training_learners_require_staff_link
after insert or update on public.training_learners deferrable initially deferred
for each row execute function pulse_private.require_staff_learner_link();
create trigger training_attempts_enforce_update before insert or update on public.training_attempts
for each row execute function pulse_private.enforce_training_attempt_update();
create trigger training_results_validate before insert on public.training_results
for each row execute function pulse_private.validate_training_result();
create trigger training_results_prevent_update before update on public.training_results
for each row execute function pulse_private.prevent_training_result_mutation();
create trigger training_results_prevent_delete before delete on public.training_results
for each row execute function pulse_private.prevent_training_result_mutation();
create trigger training_result_topics_prevent_update before update on public.training_result_topics
for each row execute function pulse_private.prevent_training_result_mutation();
create trigger training_result_topics_prevent_delete before delete on public.training_result_topics
for each row execute function pulse_private.prevent_training_result_mutation();

alter table public.training_topics enable row level security;
alter table public.training_media enable row level security;
alter table public.training_content enable row level security;
alter table public.training_content_topics enable row level security;
alter table public.training_content_audiences enable row level security;
alter table public.training_content_position_targets enable row level security;
alter table public.training_questions enable row level security;
alter table public.training_modules enable row level security;
alter table public.training_module_items enable row level security;
alter table public.training_learners enable row level security;
alter table public.training_staff_learner_links enable row level security;
alter table public.training_attempts enable row level security;
alter table public.training_results enable row level security;
alter table public.training_result_topics enable row level security;

revoke all on table public.training_topics from public, anon, authenticated;
revoke all on table public.training_media from public, anon, authenticated;
revoke all on table public.training_content from public, anon, authenticated;
revoke all on table public.training_content_topics from public, anon, authenticated;
revoke all on table public.training_content_audiences from public, anon, authenticated;
revoke all on table public.training_content_position_targets from public, anon, authenticated;
revoke all on table public.training_questions from public, anon, authenticated;
revoke all on table public.training_modules from public, anon, authenticated;
revoke all on table public.training_module_items from public, anon, authenticated;
revoke all on table public.training_learners from public, anon, authenticated;
revoke all on table public.training_staff_learner_links from public, anon, authenticated;
revoke all on table public.training_attempts from public, anon, authenticated;
revoke all on table public.training_results from public, anon, authenticated;
revoke all on table public.training_result_topics from public, anon, authenticated;

grant all on table public.training_topics to service_role;
grant all on table public.training_media to service_role;
grant all on table public.training_content to service_role;
grant all on table public.training_content_topics to service_role;
grant all on table public.training_content_audiences to service_role;
grant all on table public.training_content_position_targets to service_role;
grant all on table public.training_questions to service_role;
grant all on table public.training_modules to service_role;
grant all on table public.training_module_items to service_role;
grant all on table public.training_learners to service_role;
grant all on table public.training_staff_learner_links to service_role;
grant all on table public.training_attempts to service_role;
grant all on table public.training_results to service_role;
grant all on table public.training_result_topics to service_role;

comment on table public.training_content is
  'Shared canonical Studio/Academy/GO content. Audience targeting grants no authorization.';
comment on table public.training_content_audiences is
  'One geographic content audience resolved from canonical Campaign or Team data, independent of RBAC scope.';
comment on table public.training_learners is
  'Training learner abstraction. TRAIN-1A permits only a canonical Staff bridge; Agent linkage is deferred to Agent Identity.';
comment on table public.training_attempts is
  'Persistent training attempt metadata. Realtime presence and transient game state do not belong here.';
comment on table public.training_results is
  'Append-oriented canonical outcome for Academy, GO practice, hosted GO, or assessment attempts.';
