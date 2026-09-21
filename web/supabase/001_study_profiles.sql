-- Run once in the Supabase SQL Editor. No service-role key is needed in the app.
begin;

create table public.ml_profiles (
  id uuid primary key,
  name text not null check (char_length(btrim(name)) between 1 and 40),
  code_hash text not null unique,
  shared boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.ml_memberships (
  profile_id uuid not null references public.ml_profiles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (profile_id, user_id)
);
create index ml_memberships_user on public.ml_memberships(user_id);
create table public.ml_records (
  profile_id uuid not null references public.ml_profiles(id) on delete cascade,
  key text not null check (char_length(key) between 1 and 180),
  kind text not null check (kind in ('session','attempt','bookmark','known','flash','baseline')),
  value jsonb not null,
  stamp bigint not null check (stamp >= 0),
  writer text not null check (writer ~ '^[a-zA-Z0-9-]{1,80}$'),
  updated_at timestamptz not null default now(),
  primary key (profile_id, key)
);
create index ml_records_sessions on public.ml_records(profile_id, kind);
alter table public.ml_profiles enable row level security;
alter table public.ml_memberships enable row level security;
alter table public.ml_records enable row level security;
revoke all on public.ml_profiles, public.ml_memberships, public.ml_records from public, anon, authenticated;
grant select (id,name,shared,created_at) on public.ml_profiles to authenticated;
grant select on public.ml_memberships, public.ml_records to authenticated;

create function public.ml_is_member(p_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.ml_memberships where profile_id=p_id and user_id=(select auth.uid()));
$$;
revoke all on function public.ml_is_member(uuid) from public, anon, authenticated;
grant execute on function public.ml_is_member(uuid) to authenticated;
create policy ml_membership_read on public.ml_memberships for select to authenticated using (user_id=(select auth.uid()));
create policy ml_profile_read on public.ml_profiles for select to authenticated using (shared or public.ml_is_member(id));
create policy ml_record_read on public.ml_records for select to authenticated using (public.ml_is_member(profile_id));

create function public.ml_ensure_profile(p_id uuid,p_name text,p_code text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_profile public.ml_profiles; v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Unauthenticated' using errcode='42501'; end if;
  if p_code is null or p_code !~ '^[a-f0-9]{64}$' or p_name is null or char_length(btrim(p_name)) not between 1 and 40 then raise exception 'Invalid profile'; end if;
  select * into v_profile from public.ml_profiles where id=p_id for update;
  if not found then
    if (select count(*) from public.ml_memberships where user_id=v_uid)>=50 then raise exception 'Profile limit reached'; end if;
    insert into public.ml_profiles(id,name,code_hash) values(p_id,btrim(p_name),encode(sha256(convert_to(p_code,'UTF8')),'hex')) on conflict(id) do nothing;
    select * into v_profile from public.ml_profiles where id=p_id for update;
  end if;
  if not public.ml_is_member(p_id) and v_profile.code_hash <> encode(sha256(convert_to(p_code,'UTF8')),'hex') then raise exception 'Profile access denied' using errcode='42501'; end if;
  insert into public.ml_memberships(profile_id,user_id) values(p_id,v_uid) on conflict do nothing;
  return jsonb_build_object('id',v_profile.id,'name',v_profile.name,'shared',v_profile.shared,'created_at',v_profile.created_at);
end;
$$;
create function public.ml_restore_profile(p_code text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_profile public.ml_profiles; v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Unauthenticated' using errcode='42501'; end if;
  if p_code is null or p_code !~ '^[a-f0-9]{64}$' then raise exception 'Mã tiếp tục không hợp lệ.'; end if;
  select * into v_profile from public.ml_profiles where code_hash=encode(sha256(convert_to(p_code,'UTF8')),'hex');
  if not found then raise exception 'Không tìm thấy hồ sơ. Kiểm tra mã và dự án Supabase.'; end if;
  insert into public.ml_memberships(profile_id,user_id) values(v_profile.id,v_uid) on conflict do nothing;
  return jsonb_build_object('id',v_profile.id,'name',v_profile.name,'shared',v_profile.shared,'created_at',v_profile.created_at);
end;
$$;
create function public.ml_set_sharing(p_id uuid,p_shared boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.ml_is_member(p_id) then raise exception 'Profile access denied' using errcode='42501'; end if;
  update public.ml_profiles set shared=p_shared where id=p_id;
end;
$$;

create function public.ml_push_rows(p_profile_id uuid,p_rows jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare r jsonb; v jsonb; k text; t text; w text; s bigint; old public.ml_records; result jsonb := '[]'::jsonb; accept boolean;
begin
  if not public.ml_is_member(p_profile_id) then raise exception 'Profile access denied' using errcode='42501'; end if;
  if jsonb_typeof(p_rows) is distinct from 'array' or jsonb_array_length(p_rows)>80 or octet_length(p_rows::text)>2000000 then raise exception 'Invalid batch'; end if;
  -- Serialize batches for one profile to make first inserts and ownership claims atomic.
  perform 1 from public.ml_profiles where id=p_profile_id for update;
  for r in select value from jsonb_array_elements(p_rows) loop
    k:=r->>'key'; t:=r->>'kind'; w:=r->>'writer'; v:=r->'value'; s:=(r->>'stamp')::bigint;
    if k is null or char_length(k)>180 or t is null or split_part(k,':',1)<>t or w is null or w!~'^[a-zA-Z0-9-]{1,80}$' or s is null or s<0 or v is null or octet_length(v::text)>500000 then raise exception 'Invalid row'; end if;
    if t='session' then
      if k is distinct from 'session:'||(v->>'id') or jsonb_typeof(v->'questionIds') is distinct from 'array' or jsonb_typeof(v->'answers') is distinct from 'object' or jsonb_typeof(v->'settings') is distinct from 'object' or jsonb_typeof(v->'startedAt') is distinct from 'number' or coalesce(v->>'mode','') not in ('exam','practice') or not(v?'finishedAt') then raise exception 'Invalid session'; end if;
      if jsonb_array_length(v->'questionIds') not between 1 and 332 then raise exception 'Invalid questions'; end if;
      if v->'finishedAt'<>'null'::jsonb and jsonb_typeof(v->'finishedAt') is distinct from 'number' then raise exception 'Invalid finish time'; end if;
    elsif t='attempt' then
      if jsonb_typeof(v->'questionId') is distinct from 'number' or (v->>'questionId')::integer not between 1 and 332 or jsonb_typeof(v->'correct') is distinct from 'boolean' or jsonb_typeof(v->'lastSeen') is distinct from 'number' or k is distinct from 'attempt:'||(v->>'sessionId')||':'||(v->>'questionId') then raise exception 'Invalid attempt'; end if;
    elsif t in ('known','bookmark') then
      if jsonb_typeof(v) is distinct from 'boolean' or split_part(k,':',2)!~'^[0-9]{1,3}$' or split_part(k,':',2)::integer not between 1 and 332 then raise exception 'Invalid question preference'; end if;
    elsif t='flash' then
      if v<>'null'::jsonb and (jsonb_typeof(v->'ids') is distinct from 'array' or jsonb_typeof(v->'index') is distinct from 'number') then raise exception 'Invalid flashcard'; end if;
    elsif t='baseline' then
      if k<>'baseline:legacy' or jsonb_typeof(v->'progress') is distinct from 'object' or jsonb_typeof(v->'covered') is distinct from 'array' then raise exception 'Invalid baseline'; end if;
    else raise exception 'Invalid record kind'; end if;
    select * into old from public.ml_records where profile_id=p_profile_id and key=k for update;
    accept:=not found;
    if not accept then
      accept:=s>old.stamp or (s=old.stamp and w>old.writer);
      if t='attempt' then accept:=false; end if;
      if t='session' then
        -- Completed sessions are immutable. Old tabs cannot overwrite a newly claimed session.
        if old.value->'finishedAt'<>'null'::jsonb then accept:=false; end if;
        if old.writer<>w and not coalesce((r->>'claim')::boolean,false) then accept:=false; end if;
      end if;
    end if;
    if accept then
      insert into public.ml_records(profile_id,key,kind,value,stamp,writer) values(p_profile_id,k,t,v,s,w)
      on conflict(profile_id,key) do update set value=excluded.value,stamp=excluded.stamp,writer=excluded.writer,updated_at=clock_timestamp();
    end if;
    select * into old from public.ml_records where profile_id=p_profile_id and key=k;
    result:=result||jsonb_build_array(jsonb_build_object('key',old.key,'kind',old.kind,'value',old.value,'stamp',old.stamp,'writer',old.writer));
  end loop;
  return result;
end;
$$;

-- Shared views expose completed history only. They never grant profile membership.
create function public.ml_shared_profiles() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(to_jsonb(p)),'[]'::jsonb) from (
    select p.id,p.name,count(r.key) as sessions,max(r.updated_at) as latest
    from public.ml_profiles p left join public.ml_records r on r.profile_id=p.id and r.kind='session' and r.value->'finishedAt'<>'null'::jsonb
    where p.shared and (select auth.uid()) is not null group by p.id,p.name order by p.name,p.id limit 500
  ) p;
$$;
create function public.ml_shared_history(p_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null or not exists(select 1 from public.ml_profiles where id=p_id and (shared or public.ml_is_member(id))) then raise exception 'Lịch sử chưa được chia sẻ.' using errcode='42501'; end if;
  return (select coalesce(jsonb_agg(r.value order by (r.value->>'finishedAt')::numeric desc),'[]'::jsonb) from (
    select value from public.ml_records where profile_id=p_id and kind='session' and value->'finishedAt'<>'null'::jsonb order by (value->>'finishedAt')::numeric desc limit 100
  ) r);
end;
$$;
revoke all on function public.ml_ensure_profile(uuid,text,text),public.ml_restore_profile(text),public.ml_set_sharing(uuid,boolean),public.ml_push_rows(uuid,jsonb),public.ml_shared_profiles(),public.ml_shared_history(uuid) from public, anon, authenticated;
grant execute on function public.ml_ensure_profile(uuid,text,text),public.ml_restore_profile(text),public.ml_set_sharing(uuid,boolean),public.ml_push_rows(uuid,jsonb),public.ml_shared_profiles(),public.ml_shared_history(uuid) to authenticated;
commit;
