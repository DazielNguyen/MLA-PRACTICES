-- Support original questions 1001–1352. Keep memberships, RLS and progress intact.
-- Run after 002_expanded_question_bank.sql. Safe to run again.
begin;
do $bank$
declare definition text; old_limits integer; new_limits integer;
begin
  definition := pg_get_functiondef('public.ml_push_rows(uuid,jsonb)'::regprocedure);
  select count(*) into old_limits from regexp_matches(definition, 'between 1 and 618', 'g');
  select count(*) into new_limits from regexp_matches(definition, 'between 1 and 1352', 'g');
  if old_limits = 3 and new_limits = 0 and position('^[0-9]{1,3}$' in definition) > 0 then
    definition := replace(definition, 'between 1 and 618', 'between 1 and 1352');
    execute replace(definition, '^[0-9]{1,3}$', '^[0-9]{1,4}$');
  elsif old_limits = 0 and new_limits = 3 and position('^[0-9]{1,4}$' in definition) > 0 then
    null;
  else
    raise exception 'Unexpected ml_push_rows definition. Inspect it before applying this migration.';
  end if;
end;
$bank$;
commit;
