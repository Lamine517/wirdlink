-- Back office team, public settings and Pass dahira. Admin rights are checked here, never only in the client.
create table wirdlink_private.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  added_by uuid references auth.users(id) on delete set null,
  added_at timestamptz not null default now()
);
alter table wirdlink_private.admins enable row level security;
revoke all on wirdlink_private.admins from public, anon, authenticated;

create function wirdlink_private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select wirdlink_private.caller_is_permanent()
    and exists(select 1 from wirdlink_private.admins a where a.user_id = auth.uid());
$$;

create function wirdlink_private.require_admin() returns void
language plpgsql stable security definer set search_path = '' as $$
begin
  if not wirdlink_private.is_admin() then
    raise exception 'Admin required' using errcode = '42501';
  end if;
end;
$$;

-- Public, non-secret settings read by every visitor; written only through admin_set_setting.
create table public.app_settings (
  key text primary key check (key in ('pass')),
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);
alter table public.app_settings enable row level security;
revoke all on public.app_settings from public, anon, authenticated;
grant select (key, value) on public.app_settings to anon, authenticated;
create policy "Read settings" on public.app_settings for select to anon, authenticated using (true);

insert into public.app_settings (key, value) values ('pass', jsonb_build_object(
  'enabled', false, 'monthPrice', 2000, 'yearPrice', 15000, 'founderPrice', 10000,
  'founderSlots', 20, 'trialDays', 30, 'freePrivateLimit', 3, 'limitStartsOn', null,
  'reminderDays', 7));

create function wirdlink_private.valid_pass_settings(p jsonb) returns boolean
language sql immutable set search_path = '' as $$
  select jsonb_typeof(p) = 'object'
    and (select count(*) from jsonb_object_keys(p)) = 9
    and jsonb_typeof(p->'enabled') = 'boolean'
    and coalesce(jsonb_typeof(p->'limitStartsOn') = 'null'
      or (jsonb_typeof(p->'limitStartsOn') = 'string'
        and p->>'limitStartsOn' ~ '^\d{4}-\d{2}-\d{2}$'), false)
    and (select bool_and(jsonb_typeof(p->k) = 'number' and (p->>k) ~ '^\d+$'
        and (p->>k)::bigint between 0 and 10000000)
      from unnest(array['monthPrice','yearPrice','founderPrice','founderSlots','trialDays',
        'freePrivateLimit','reminderDays']) k)
    and (p->>'trialDays')::int <= 365 and (p->>'reminderDays')::int <= 60
    and (p->>'freePrivateLimit')::int <= 1000 and (p->>'founderSlots')::int <= 100000;
$$;

create table wirdlink_private.passes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('trial', 'month', 'year', 'founder')),
  starts_on date not null,
  ends_on date not null check (ends_on >= starts_on),
  amount integer not null default 0 check (amount >= 0),
  note text not null default '' check (length(note) <= 200),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index passes_owner_idx on wirdlink_private.passes (owner_id, ends_on desc);
alter table wirdlink_private.passes enable row level security;
revoke all on wirdlink_private.passes from public, anon, authenticated;

create function wirdlink_private.has_active_pass(p_owner uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from wirdlink_private.passes p where p.owner_id = p_owner
    and p.starts_on <= wirdlink_private.dakar_today() and p.ends_on >= wirdlink_private.dakar_today());
$$;

create function wirdlink_private.private_in_progress(p_owner uuid) returns integer
language sql stable security definer set search_path = '' as $$
  select count(*)::integer from public.wirds w where w.owner_id = p_owner and w.visibility = 'private'
    and (w.end_date is null or w.end_date >= wirdlink_private.dakar_today());
$$;

-- The limit only applies once the offer is enabled and its announced start date is reached.
-- Existing private wirds are never affected: only the creation of a new one is refused.
create function wirdlink_private.private_allowed(p_owner uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select case
    when s.value is null or not (s.value->>'enabled')::boolean
      or nullif(s.value->>'limitStartsOn', '') is null
      or (s.value->>'limitStartsOn')::date > wirdlink_private.dakar_today() then true
    when wirdlink_private.has_active_pass(p_owner) then true
    else wirdlink_private.private_in_progress(p_owner) < (s.value->>'freePrivateLimit')::integer
  end
  from (select (select value from public.app_settings where key = 'pass') as value) s;
$$;

create or replace function wirdlink_private.publish_wird(p_request_id uuid, p_draft jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  user_id uuid := auth.uid();
  existing public.wirds;
  new_id uuid;
  normalized jsonb;
begin
  perform wirdlink_private.require_active_account();
  if not wirdlink_private.account_is_active() or not exists (
    select 1 from auth.users u where u.id = user_id and not coalesce(u.is_anonymous, false)
  ) then
    raise exception 'Responsible authentication required' using errcode = '42501';
  end if;
  if p_request_id is null or p_draft is null or jsonb_typeof(p_draft) <> 'object' then
    raise exception 'Invalid publication' using errcode = '22023';
  end if;
  normalized := jsonb_build_object('title',btrim(p_draft->>'title'),
    'description',coalesce(p_draft->>'description',''),'instructions',coalesce(p_draft->>'instructions',''),
    'target',(p_draft->>'target')::integer,'recurrence',p_draft->>'recurrence',
    'startDate',((p_draft->>'startDate')::date)::text,
    'endDate',(nullif(p_draft->>'endDate','')::date)::text,'visibility',p_draft->>'visibility',
    'imagePath',nullif(p_draft->>'imagePath',''),'audioPath',nullif(p_draft->>'audioPath',''));
  p_draft := normalized;
  perform pg_advisory_xact_lock(hashtextextended(user_id::text || p_request_id::text, 0));
  select * into existing from public.wirds where owner_id = user_id and request_id = p_request_id;
  if found then
    if jsonb_build_object('title', existing.title, 'description', existing.description,
      'instructions', existing.instructions, 'target', existing.target,
      'recurrence', existing.recurrence, 'startDate', existing.start_date::text,
      'endDate', existing.end_date::text, 'visibility', existing.visibility,
      'imagePath', existing.image_path, 'audioPath', existing.audio_path) <> p_draft then
      raise exception 'Request already used with different content' using errcode = '22023';
    end if;
    return existing.id;
  end if;
  if (p_draft->>'startDate')::date < (timezone('utc', now()))::date - 1 then
    raise exception 'Start date is in the past' using errcode = '22023';
  end if;
  if p_draft->>'visibility' = 'private' then
    perform pg_advisory_xact_lock(hashtextextended('private:' || user_id::text, 0));
    if not wirdlink_private.private_allowed(user_id) then
      raise exception 'private_limit' using errcode = 'P0001';
    end if;
  end if;
  if exists(select 1 from (values(p_draft->>'imagePath'),(p_draft->>'audioPath')) media(path)
    where media.path is not null and (split_part(media.path,'/',1)<>user_id::text
      or not exists(select 1 from storage.objects o where o.bucket_id='wird-media' and o.name=media.path))) then
    raise exception 'Media unavailable' using errcode='22023';
  end if;
  insert into public.wirds (owner_id, request_id, title, description, instructions,
    target, recurrence, start_date, end_date, visibility, image_path, audio_path)
  values (user_id, p_request_id, btrim(p_draft->>'title'), coalesce(p_draft->>'description', ''),
    coalesce(p_draft->>'instructions', ''), (p_draft->>'target')::integer,
    p_draft->>'recurrence', (p_draft->>'startDate')::date, (p_draft->>'endDate')::date,
    p_draft->>'visibility', p_draft->>'imagePath', p_draft->>'audioPath') returning id into new_id;
  if p_draft->>'visibility' = 'private' then
    insert into wirdlink_private.access_codes (wird_id, owner_id, code)
    values (new_id, user_id, lpad((('x' || encode(extensions.gen_random_bytes(4), 'hex'))::bit(32)::bigint % 10000)::text, 4, '0'));
  end if;
  return new_id;
end;
$$;

-- Creator side.
create function wirdlink_private.my_pass() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'active', wirdlink_private.has_active_pass(auth.uid()),
    'kind', (select p.kind from wirdlink_private.passes p where p.owner_id = auth.uid()
      and p.starts_on <= wirdlink_private.dakar_today() and p.ends_on >= wirdlink_private.dakar_today()
      order by p.ends_on desc limit 1),
    'endsOn', (select max(p.ends_on) from wirdlink_private.passes p where p.owner_id = auth.uid()
      and p.ends_on >= wirdlink_private.dakar_today()),
    'hadPass', exists(select 1 from wirdlink_private.passes p where p.owner_id = auth.uid()),
    'privateInProgress', wirdlink_private.private_in_progress(auth.uid()),
    'privateAllowed', wirdlink_private.private_allowed(auth.uid()),
    'isAdmin', wirdlink_private.is_admin())
  where wirdlink_private.caller_is_permanent();
$$;

create function wirdlink_private.start_trial() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  settings jsonb := (select value from public.app_settings where key = 'pass');
  today date := wirdlink_private.dakar_today();
begin
  if not wirdlink_private.caller_is_permanent() then
    raise exception 'Responsible authentication required' using errcode = '42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('pass:' || auth.uid()::text, 0));
  if settings is null or not (settings->>'enabled')::boolean
    or (settings->>'trialDays')::integer < 1
    or exists(select 1 from wirdlink_private.passes where owner_id = auth.uid()) then
    raise exception 'trial_unavailable' using errcode = 'P0001';
  end if;
  insert into wirdlink_private.passes (owner_id, kind, starts_on, ends_on, created_by)
  values (auth.uid(), 'trial', today, today + (settings->>'trialDays')::integer - 1, auth.uid());
  return wirdlink_private.my_pass();
end;
$$;

-- Back office.
create function wirdlink_private.user_contact(p_user uuid) returns text
language sql stable security definer set search_path = '' as $$
  select coalesce(nullif(u.email, ''), case when coalesce(u.phone, '') <> '' then '+' || u.phone end, '')
  from auth.users u where u.id = p_user;
$$;

create function wirdlink_private.user_name(p_user uuid) returns text
language sql stable security definer set search_path = '' as $$
  select coalesce(btrim(concat_ws(' ', nullif(btrim(p.first_name), ''), nullif(btrim(p.last_name), ''))), '')
  from (select 1) x left join public.profiles p on p.id = p_user;
$$;

create function wirdlink_private.admin_overview() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  today date := wirdlink_private.dakar_today();
begin
  perform wirdlink_private.require_admin();
  return jsonb_build_object(
    'totals', jsonb_build_object(
      'wirds', (select count(*) from public.wirds),
      'privateWirds', (select count(*) from public.wirds where visibility = 'private'),
      'creators', (select count(distinct owner_id) from public.wirds),
      'participants', (select count(distinct participant_id) from public.parts),
      'finished', (select coalesce(sum(quantity), 0) from public.parts where finished),
      'activePasses', (select count(distinct owner_id) from wirdlink_private.passes
        where starts_on <= today and ends_on >= today and kind <> 'trial'),
      'trials', (select count(distinct owner_id) from wirdlink_private.passes
        where starts_on <= today and ends_on >= today and kind = 'trial'),
      'founders', (select count(distinct owner_id) from wirdlink_private.passes where kind = 'founder'),
      'collected', (select coalesce(sum(amount), 0) from wirdlink_private.passes)),
    'creators', coalesce((select jsonb_agg(c order by c->>'name') from (
      select jsonb_build_object(
        'id', o.owner_id,
        'name', wirdlink_private.user_name(o.owner_id),
        'organization', coalesce((select p.organization from public.profiles p where p.id = o.owner_id), ''),
        'contact', wirdlink_private.user_contact(o.owner_id),
        'wirds', (select count(*) from public.wirds w where w.owner_id = o.owner_id),
        'privateInProgress', wirdlink_private.private_in_progress(o.owner_id),
        'passEndsOn', (select max(p.ends_on) from wirdlink_private.passes p
          where p.owner_id = o.owner_id and p.ends_on >= today),
        'passKind', (select p.kind from wirdlink_private.passes p where p.owner_id = o.owner_id
          and p.ends_on >= today order by p.ends_on desc limit 1)) c
      from (select distinct owner_id from public.wirds
        union select distinct owner_id from wirdlink_private.passes) o
      join auth.users u on u.id = o.owner_id
      limit 1000) x), '[]'::jsonb),
    'passes', coalesce((select jsonb_agg(jsonb_build_object(
        'id', p.id, 'ownerId', p.owner_id, 'ownerName', wirdlink_private.user_name(p.owner_id),
        'kind', p.kind, 'startsOn', p.starts_on, 'endsOn', p.ends_on, 'amount', p.amount,
        'note', p.note, 'createdAt', p.created_at) order by p.created_at desc)
      from (select * from wirdlink_private.passes order by created_at desc limit 200) p), '[]'::jsonb));
end;
$$;

create function wirdlink_private.admin_grant_pass(p_owner uuid, p_kind text, p_amount integer, p_note text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  settings jsonb := (select value from public.app_settings where key = 'pass');
  today date := wirdlink_private.dakar_today();
  start_on date;
  end_on date;
  new_id uuid;
begin
  perform wirdlink_private.require_admin();
  if p_kind not in ('trial', 'month', 'year', 'founder') or p_amount is null or p_amount < 0
    or p_amount > 10000000 or p_note is null or length(p_note) > 200 then
    raise exception 'Invalid pass' using errcode = '22023';
  end if;
  if not exists(select 1 from auth.users u where u.id = p_owner and not coalesce(u.is_anonymous, false))
    or exists(select 1 from wirdlink_private.account_deletions d where d.user_id = p_owner) then
    raise exception 'Unknown creator' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('pass:' || p_owner::text, 0));
  if p_kind = 'founder' and not exists(select 1 from wirdlink_private.passes
      where owner_id = p_owner and kind = 'founder')
    and (select count(distinct owner_id) from wirdlink_private.passes where kind = 'founder')
      >= (settings->>'founderSlots')::integer then
    raise exception 'founders_full' using errcode = 'P0001';
  end if;
  start_on := greatest(today, coalesce((select max(ends_on) + 1 from wirdlink_private.passes
    where owner_id = p_owner), today));
  end_on := case p_kind
    when 'month' then (start_on + interval '1 month')::date - 1
    when 'trial' then start_on + greatest((settings->>'trialDays')::integer, 1) - 1
    else (start_on + interval '1 year')::date - 1 end;
  insert into wirdlink_private.passes (owner_id, kind, starts_on, ends_on, amount, note, created_by)
  values (p_owner, p_kind, start_on, end_on, p_amount, btrim(p_note), auth.uid()) returning id into new_id;
  return jsonb_build_object('id', new_id, 'startsOn', start_on, 'endsOn', end_on);
end;
$$;

create function wirdlink_private.admin_revoke_pass(p_pass uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform wirdlink_private.require_admin();
  delete from wirdlink_private.passes where id = p_pass;
end;
$$;

create function wirdlink_private.admin_set_setting(p_key text, p_value jsonb) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform wirdlink_private.require_admin();
  if p_key <> 'pass' or not coalesce(wirdlink_private.valid_pass_settings(p_value), false) then
    raise exception 'Invalid setting' using errcode = '22023';
  end if;
  update public.app_settings set value = p_value, updated_at = now(), updated_by = auth.uid()
  where key = p_key;
end;
$$;

create function wirdlink_private.admin_team() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform wirdlink_private.require_admin();
  return coalesce((select jsonb_agg(jsonb_build_object(
      'id', a.user_id, 'name', wirdlink_private.user_name(a.user_id),
      'contact', wirdlink_private.user_contact(a.user_id), 'addedAt', a.added_at,
      'isMe', a.user_id = auth.uid()) order by a.added_at)
    from wirdlink_private.admins a), '[]'::jsonb);
end;
$$;

-- Members are found by the e-mail or phone number of an existing WirdLink account.
create function wirdlink_private.admin_add_member(p_contact text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  contact text := lower(btrim(coalesce(p_contact, '')));
  digits text := regexp_replace(coalesce(p_contact, ''), '\D', '', 'g');
  member uuid;
begin
  perform wirdlink_private.require_admin();
  if length(digits) = 9 then digits := '221' || digits; end if;
  select u.id into member from auth.users u
  where not coalesce(u.is_anonymous, false)
    and ((contact like '%@%' and lower(u.email) = contact)
      or (contact not like '%@%' and length(digits) >= 9 and u.phone = digits))
  limit 1;
  if member is null then
    raise exception 'member_not_found' using errcode = 'P0001';
  end if;
  insert into wirdlink_private.admins (user_id, added_by) values (member, auth.uid())
  on conflict (user_id) do nothing;
end;
$$;

create function wirdlink_private.admin_remove_member(p_user uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform wirdlink_private.require_admin();
  perform pg_advisory_xact_lock(hashtextextended('admins', 0));
  if (select count(*) from wirdlink_private.admins where user_id <> p_user) = 0 then
    raise exception 'last_admin' using errcode = 'P0001';
  end if;
  delete from wirdlink_private.admins where user_id = p_user;
end;
$$;

create function public.my_pass() returns jsonb language sql security invoker set search_path = '' as $$
  select wirdlink_private.my_pass(); $$;
create function public.start_trial() returns jsonb language sql security invoker set search_path = '' as $$
  select wirdlink_private.start_trial(); $$;
create function public.admin_overview() returns jsonb language sql security invoker set search_path = '' as $$
  select wirdlink_private.admin_overview(); $$;
create function public.admin_grant_pass(p_owner uuid, p_kind text, p_amount integer, p_note text)
returns jsonb language sql security invoker set search_path = '' as $$
  select wirdlink_private.admin_grant_pass(p_owner, p_kind, p_amount, p_note); $$;
create function public.admin_revoke_pass(p_pass uuid) returns void language sql security invoker set search_path = '' as $$
  select wirdlink_private.admin_revoke_pass(p_pass); $$;
create function public.admin_set_setting(p_key text, p_value jsonb) returns void
language sql security invoker set search_path = '' as $$
  select wirdlink_private.admin_set_setting(p_key, p_value); $$;
create function public.admin_team() returns jsonb language sql security invoker set search_path = '' as $$
  select wirdlink_private.admin_team(); $$;
create function public.admin_add_member(p_contact text) returns void language sql security invoker set search_path = '' as $$
  select wirdlink_private.admin_add_member(p_contact); $$;
create function public.admin_remove_member(p_user uuid) returns void language sql security invoker set search_path = '' as $$
  select wirdlink_private.admin_remove_member(p_user); $$;

do $$
declare
  fn text;
begin
  foreach fn in array array[
    'wirdlink_private.is_admin()', 'wirdlink_private.require_admin()',
    'wirdlink_private.valid_pass_settings(jsonb)', 'wirdlink_private.has_active_pass(uuid)',
    'wirdlink_private.private_in_progress(uuid)', 'wirdlink_private.private_allowed(uuid)',
    'wirdlink_private.user_contact(uuid)', 'wirdlink_private.user_name(uuid)',
    'wirdlink_private.my_pass()', 'wirdlink_private.start_trial()',
    'wirdlink_private.admin_overview()', 'wirdlink_private.admin_grant_pass(uuid,text,integer,text)',
    'wirdlink_private.admin_revoke_pass(uuid)', 'wirdlink_private.admin_set_setting(text,jsonb)',
    'wirdlink_private.admin_team()', 'wirdlink_private.admin_add_member(text)',
    'wirdlink_private.admin_remove_member(uuid)',
    'public.my_pass()', 'public.start_trial()', 'public.admin_overview()',
    'public.admin_grant_pass(uuid,text,integer,text)', 'public.admin_revoke_pass(uuid)',
    'public.admin_set_setting(text,jsonb)', 'public.admin_team()',
    'public.admin_add_member(text)', 'public.admin_remove_member(uuid)'] loop
    execute format('revoke all on function %s from public, anon, authenticated', fn);
    execute format('grant execute on function %s to authenticated', fn);
  end loop;
end;
$$;
