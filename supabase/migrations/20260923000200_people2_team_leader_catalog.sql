-- Pulse PEOPLE-2: keep the approved Team Leader label stable when the
-- idempotent ORG-3A catalog is re-applied on an already deployed database.
-- The function body is otherwise preserved byte-for-byte from the deployed
-- definition, including its authorization, audit, and people-state guards.

do $people2_catalog_label$
declare
  catalog_definition text;
begin
  select pg_get_functiondef('public.apply_org3a_business_catalog()'::regprocedure)
    into catalog_definition;

  if position('''Team Leader''' in catalog_definition) = 0 then
    if position('''Team Lead''' in catalog_definition) = 0 then
      raise exception 'ORG-3A catalog Position label was not recognized'
        using errcode = '55000';
    end if;

    execute replace(catalog_definition, '''Team Lead''', '''Team Leader''');
  end if;

  update public.positions
  set name = 'Team Leader'
  where code = 'team_lead'
    and name is distinct from 'Team Leader';
end
$people2_catalog_label$;

