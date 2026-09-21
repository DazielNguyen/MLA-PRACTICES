-- Expand the bank without changing memberships, RLS, or saved progress.
-- Run after 001_study_profiles.sql. This migration is safe to run again.
begin;
do $bank$
declare definition text; old_limits integer; new_limits integer;
begin
  definition := pg_get_functiondef('public.ml_push_rows(uuid,jsonb)'::regprocedure);
  select count(*) into old_limits from regexp_matches(definition, 'between 1 and 332', 'g');
  select count(*) into new_limits from regexp_matches(definition, 'between 1 and 618', 'g');
  if old_limits = 3 and new_limits = 0 then
    execute replace(definition, 'between 1 and 332', 'between 1 and 618');
  elsif old_limits = 0 and new_limits = 3 then
    null;
  else
    raise exception 'Unexpected ml_push_rows definition. Inspect it before applying this migration.';
  end if;
end;
$bank$;
commit;
