begin;
create extension if not exists pgtap with schema extensions;
set local role postgres;
select set_config(
  'search_path',
  quote_ident((
    select namespace.nspname
    from pg_extension extension
    join pg_namespace namespace on namespace.oid = extension.extnamespace
    where extension.extname = 'pgtap'
  )) || ', public',
  true
);
select extensions.no_plan();

select extensions.ok(
  position('''Team Leader''' in pg_get_functiondef('public.apply_org3a_business_catalog()'::regprocedure)) > 0,
  'deployed catalog contract preserves the approved Team Leader label'
);

select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000000',true);
select extensions.throws_ok(
  $$select public.apply_org3a_business_catalog()$$,
  '42501',
  null,
  'catalog authorization remains protected after the label refinement'
);

select extensions.ok(
  position('''Team Lead''' in pg_get_functiondef('public.apply_org3a_business_catalog()'::regprocedure)) = 0,
  'catalog contract cannot reintroduce the retired Team Lead label'
);

select extensions.ok(not exists(
  select 1 from auth.users
  where id::text like 'a2300000-0000-4000-8000-%'
     or email like 'people2.%@example.test'
),'PEOPLE-2 synthetic Auth fixtures leave no remote residue');

select extensions.ok(not exists(
  select 1 from public.departments
  where code = 'people2_certification'
),'PEOPLE-2 synthetic organization fixture leaves no remote residue');

select * from extensions.finish();
rollback;
