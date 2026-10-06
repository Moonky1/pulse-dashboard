-- Remove the unapproved TO catalog entry; never recreate it on catalog application.
begin;
set local lock_timeout='5s';
set local statement_timeout='120s';
do $block$
declare definition text; unapproved_row text := $row$('33000000-0000-4000-8000-000000000003',operations_area_id,garrett_campaign_id,null,'to','TO','Garrett transfer operations.',true),$row$;
begin
  definition := pg_get_functiondef('public.apply_org3a_business_catalog()'::regprocedure);
  if strpos(definition,unapproved_row)=0 then
    raise exception 'Catalog seed changed; review before removing TO' using errcode='55000'; end if;
  execute replace(definition,unapproved_row,'');
  -- FK restrictions reject deletion if any unreviewed reference has appeared.
  delete from public.operating_units unit using public.campaigns campaign
    where unit.id='33000000-0000-4000-8000-000000000003' and unit.code='to'
      and unit.name='TO' and unit.campaign_id=campaign.id and campaign.code='auto_warranty_garrett';
end
$block$;
commit;
