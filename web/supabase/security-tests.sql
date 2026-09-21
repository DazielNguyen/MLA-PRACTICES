\set ON_ERROR_STOP on
set role authenticated;
set request.jwt.claim.sub='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
do $$
declare rows jsonb; answer jsonb;
begin
  perform public.ml_ensure_profile('11111111-1111-1111-1111-111111111111','Duy',repeat('a',64));
  perform public.ml_ensure_profile('22222222-2222-2222-2222-222222222222','Duy',repeat('b',64));
  assert (select count(*)=2 from public.ml_memberships), 'duplicate names must have different profiles';
  rows:=jsonb_build_array(
    jsonb_build_object('key','known:2','kind','known','value',true,'stamp',1,'writer','tab-a'),
    jsonb_build_object('key','session:33333333-3333-3333-3333-333333333333','kind','session','stamp',1,'writer','tab-a','claim',true,'value',jsonb_build_object('id','33333333-3333-3333-3333-333333333333','mode','exam','questionIds',jsonb_build_array(2),'answers',jsonb_build_object('2',jsonb_build_array('B')),'settings','{}'::jsonb,'startedAt',1000,'finishedAt',2000)),
    jsonb_build_object('key','session:44444444-4444-4444-4444-444444444444','kind','session','stamp',1,'writer','tab-a','claim',true,'value',jsonb_build_object('id','44444444-4444-4444-4444-444444444444','mode','practice','questionIds',jsonb_build_array(2),'answers','{}'::jsonb,'settings','{}'::jsonb,'startedAt',3000,'finishedAt',null))
  );
  answer:=public.ml_push_rows('11111111-1111-1111-1111-111111111111',rows);
  assert jsonb_array_length(answer)=3, 'initial save';
  assert (select count(*)=3 from public.ml_records), 'member reads their own rows';
  begin
    perform code_hash from public.ml_profiles;
    raise exception 'secret hash was readable';
  exception when insufficient_privilege then null; end;
end $$;
set request.jwt.claim.sub='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
do $$
begin
  assert (select count(*)=0 from public.ml_records), 'other learner must not read private records';
  assert (select count(*)=0 from public.ml_profiles), 'private profiles hidden';
  begin
    perform public.ml_push_rows('11111111-1111-1111-1111-111111111111','[]');
    raise exception 'another learner wrote records';
  exception when insufficient_privilege then null; end;
  begin
    perform public.ml_ensure_profile('11111111-1111-1111-1111-111111111111','Duy',repeat('f',64));
    raise exception 'name or id granted membership';
  exception when insufficient_privilege then null; end;
  begin
    perform public.ml_shared_history('11111111-1111-1111-1111-111111111111');
    raise exception 'private history exposed';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.ml_memberships values('11111111-1111-1111-1111-111111111111','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
    raise exception 'membership self insert allowed';
  exception when insufficient_privilege then null; end;
  begin
    perform public.ml_set_sharing('11111111-1111-1111-1111-111111111111',true);
    raise exception 'sharing change allowed for viewer';
  exception when insufficient_privilege then null; end;
end $$;
set request.jwt.claim.sub='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
select public.ml_set_sharing('11111111-1111-1111-1111-111111111111',true);
set request.jwt.claim.sub='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
do $$
declare profiles jsonb; sessions jsonb;
begin
  profiles:=public.ml_shared_profiles(); sessions:=public.ml_shared_history('11111111-1111-1111-1111-111111111111');
  assert jsonb_array_length(profiles)=1, 'only shared learner is listed';
  assert profiles->0->>'name'='Duy', 'shared name';
  assert not(profiles->0?'code_hash'), 'shared list has no recovery hash';
  assert jsonb_array_length(sessions)=1, 'shared history contains finished sessions only';
  assert (select count(*)=0 from public.ml_records), 'sharing does not grant direct record access';
  assert not public.ml_is_member('11111111-1111-1111-1111-111111111111'), 'viewing does not grant membership';
  perform public.ml_restore_profile(repeat('a',64));
  assert public.ml_is_member('11111111-1111-1111-1111-111111111111'), 'valid code links another anonymous identity';
  assert (select count(*)=3 from public.ml_records), 'restored identity sees saved progress';
end $$;
do $$
declare row jsonb; result jsonb;
begin
  select jsonb_build_object('key',key,'kind',kind,'value',value,'stamp',2,'writer','tab-b','claim',true) into row from public.ml_records where key='session:44444444-4444-4444-4444-444444444444';
  result:=public.ml_push_rows('11111111-1111-1111-1111-111111111111',jsonb_build_array(row));
  assert result->0->>'writer'='tab-b', 'explicit resume transfers writer';
  row:=jsonb_set(jsonb_set(jsonb_set(row,'{stamp}','3'),'{writer}','"tab-a"'),'{claim}','false');
  result:=public.ml_push_rows('11111111-1111-1111-1111-111111111111',jsonb_build_array(row));
  assert result->0->>'writer'='tab-b', 'old tab cannot overwrite the claimed session';
  select jsonb_build_object('key',key,'kind',kind,'value',jsonb_set(value,'{finishedAt}','null'),'stamp',100,'writer','tab-b','claim',true) into row from public.ml_records where key='session:33333333-3333-3333-3333-333333333333';
  result:=public.ml_push_rows('11111111-1111-1111-1111-111111111111',jsonb_build_array(row));
  assert result->0->'value'->>'finishedAt'='2000', 'completed session stays immutable';
  row:=jsonb_build_object('key','attempt:33333333-3333-3333-3333-333333333333:2','kind','attempt','stamp',1,'writer','tab-b','value',jsonb_build_object('questionId',2,'sessionId','33333333-3333-3333-3333-333333333333','correct',true,'lastSeen',2000));
  perform public.ml_push_rows('11111111-1111-1111-1111-111111111111',jsonb_build_array(row));
  row:=jsonb_set(jsonb_set(row,'{stamp}','9'),'{value,correct}','false');
  result:=public.ml_push_rows('11111111-1111-1111-1111-111111111111',jsonb_build_array(row));
  assert result->0->'value'->>'correct'='true', 'retried grade cannot count or mutate twice';
  assert (select count(*)=1 from public.ml_records where kind='attempt'), 'one grade row';
  begin
    insert into public.ml_records values('11111111-1111-1111-1111-111111111111','known:3','known','true',1,'tab-b',now());
    raise exception 'direct write bypassed validation';
  exception when insufficient_privilege then null; end;
end $$;
set request.jwt.claim.sub='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
select public.ml_set_sharing('11111111-1111-1111-1111-111111111111',false);
do $$ begin assert public.ml_shared_profiles()='[]'::jsonb, 'unsharing removes the public listing'; end $$;
do $$
declare result jsonb; payload jsonb;
begin
  result:=public.ml_push_rows('11111111-1111-1111-1111-111111111111','[{"key":"known:615","kind":"known","value":true,"stamp":1,"writer":"tab-a"}]'::jsonb);
  assert result->0->>'key'='known:615', 'new MLA question preference is accepted';
  result:=public.ml_push_rows('11111111-1111-1111-1111-111111111111','[{"key":"attempt:mla-session:333","kind":"attempt","value":{"questionId":333,"sessionId":"mla-session","correct":true,"lastSeen":3000},"stamp":1,"writer":"tab-a"}]'::jsonb);
  assert result->0->'value'->>'questionId'='333', 'new MLA attempt is accepted';
  payload:=jsonb_build_object('id','expanded-session','mode','practice','questionIds',(select jsonb_agg(n) from generate_series(1,400) n),'answers','{}'::jsonb,'settings','{}'::jsonb,'startedAt',1000,'finishedAt',null);
  result:=public.ml_push_rows('11111111-1111-1111-1111-111111111111',jsonb_build_array(jsonb_build_object('key','session:expanded-session','kind','session','value',payload,'stamp',1,'writer','tab-a')));
  assert jsonb_array_length(result->0->'value'->'questionIds')=400, 'sessions can contain more than the old 332 limit';
  begin
    perform public.ml_push_rows('11111111-1111-1111-1111-111111111111','[{"key":"known:619","kind":"known","value":true,"stamp":1,"writer":"tab-a"}]'::jsonb);
    raise exception 'out of range question accepted' using errcode='XX000';
  exception when raise_exception then null; end;
end $$;
reset role;
set role anon;
set request.jwt.claim.sub='';
do $$ begin
  begin
    perform public.ml_shared_profiles();
    raise exception 'unauthenticated role can execute shared functions';
  exception when insufficient_privilege then null; end;
  begin
    perform * from public.ml_records;
    raise exception 'unauthenticated role reads records';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
select 'PASS: ownership, RLS, read-only sharing, recovery, tab claims, immutable history, idempotent grades' as result;
