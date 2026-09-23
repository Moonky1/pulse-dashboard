begin;
create extension if not exists pgtap with schema extensions;
set local role postgres;
select extensions.plan(3);

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

select * from extensions.finish();
rollback;
