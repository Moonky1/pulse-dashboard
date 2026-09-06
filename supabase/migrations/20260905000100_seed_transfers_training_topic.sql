-- STUDIO-1C: first approved canonical Pulse Training topic.
-- This migration intentionally creates no content, questions, learners, results, or audit events.

do $migration$
declare
  canonical_topic_id constant uuid := '23500000-0000-4000-8000-000000000001';
begin
  if exists (
    select 1
    from public.training_topics topic
    where topic.id = canonical_topic_id
       or lower(topic.code) = 'transfers'
  ) then
    raise exception 'STUDIO-1C cannot seed Transfers: conflicting training topic already exists';
  end if;

  insert into public.training_topics(id, code, name, description)
  values (
    canonical_topic_id,
    'transfers',
    'Transfers',
    'Core transfer procedures and expectations for openers.'
  );
end
$migration$;
