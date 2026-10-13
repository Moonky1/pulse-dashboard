begin;
-- Requested corrections to the five task-owned timetable rows only.
-- Preserve all identities, permissions, Admin edits to other fields and other events.
do $$ begin
 if (select count(*) from public.pulse_schedule_events where id in
 ('a1120000-0000-4000-8000-000000000001','a1120000-0000-4000-8000-000000000002','a1120000-0000-4000-8000-000000000003','a1120000-0000-4000-8000-000000000004','a1120000-0000-4000-8000-000000000005'))<>5 then raise exception 'Inspect missing schedule rows before correcting'; end if;
 if exists(select 1 from public.pulse_schedule_events where
 (id='a1120000-0000-4000-8000-000000000001' and (config->>'type'<>'shift' or config->>'start' not in ('06:45','07:00'))) or
 (id='a1120000-0000-4000-8000-000000000005' and (config->>'type'<>'shift' or config->>'start' not in ('08:45','09:00') or config->>'end'<>'14:00')))
 then raise exception 'Shift edited unexpectedly; inspect before correcting'; end if;
end $$;
update public.pulse_schedule_events set config=config||jsonb_build_object(
 'start',case id when 'a1120000-0000-4000-8000-000000000001'::uuid then '07:00' when 'a1120000-0000-4000-8000-000000000005'::uuid then '09:00' else config->>'start' end,
 'sound','critical_alarm','volume',greatest((config->>'volume')::integer,90),'duration_seconds',8,'repeat',1,'pre_minutes',5),revision=revision+1
where id in ('a1120000-0000-4000-8000-000000000001','a1120000-0000-4000-8000-000000000002','a1120000-0000-4000-8000-000000000003','a1120000-0000-4000-8000-000000000004','a1120000-0000-4000-8000-000000000005');
commit;
