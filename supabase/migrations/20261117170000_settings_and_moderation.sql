-- Back office, phase 2: donations, wird templates, features and texts settings; wird moderation.
alter table public.app_settings drop constraint app_settings_key_check;
alter table public.app_settings add constraint app_settings_key_check
  check (key in ('pass', 'donations', 'templates', 'features', 'texts'));

create function wirdlink_private.json_int(p jsonb, lo bigint, hi bigint) returns boolean
language sql immutable set search_path = '' as $$
  select coalesce(jsonb_typeof(p) = 'number' and p::text ~ '^\d+$' and p::text::numeric between lo and hi, false);
$$;

create function wirdlink_private.json_text(p jsonb, max_length integer) returns boolean
language sql immutable set search_path = '' as $$
  select coalesce(jsonb_typeof(p) = 'string' and char_length(p #>> '{}') <= max_length, false);
$$;

create function wirdlink_private.json_keys(p jsonb, expected text[]) returns boolean
language sql immutable set search_path = '' as $$
  select coalesce(jsonb_typeof(p) = 'object'
    and (select array_agg(k order by k) from jsonb_object_keys(p) k)
      = (select array_agg(e order by e) from unnest(expected) e), false);
$$;

create function wirdlink_private.valid_setting(p_key text, p jsonb) returns boolean
language sql immutable set search_path = '' as $$
  select coalesce(case p_key
    when 'pass' then wirdlink_private.valid_pass_settings(p)
    when 'donations' then
      wirdlink_private.json_keys(p, array['enabled','amounts','min','max','number','wave','orange'])
      and jsonb_typeof(p->'enabled') = 'boolean' and jsonb_typeof(p->'wave') = 'boolean'
      and jsonb_typeof(p->'orange') = 'boolean'
      and jsonb_typeof(p->'amounts') = 'array'
      and jsonb_array_length(p->'amounts') between 1 and 6
      and (select bool_and(wirdlink_private.json_int(a, 1, 10000000)) from jsonb_array_elements(p->'amounts') a)
      and wirdlink_private.json_int(p->'min', 1, 10000000)
      and wirdlink_private.json_int(p->'max', 1, 10000000)
      and (p->>'min')::bigint <= (p->>'max')::bigint
      and jsonb_typeof(p->'number') = 'string' and p->>'number' ~ '^\d{9}$'
    when 'templates' then
      jsonb_typeof(p) = 'array' and jsonb_array_length(p) <= 12
      and (select coalesce(bool_and(
          wirdlink_private.json_keys(t, array['id','title','target','icon'])
          and jsonb_typeof(t->'id') = 'string' and t->>'id' ~ '^[a-z0-9-]{1,40}$' and t->>'id' <> 'custom'
          and wirdlink_private.json_text(t->'title', 100) and btrim(t->>'title') <> ''
          and wirdlink_private.json_int(t->'target', 1, 2147483647)
          and t->>'icon' in ('prayer','book','heart','tap','hand','calendar','clock','bell','users')), true)
        from jsonb_array_elements(p) t)
      and (select count(distinct t->>'id') = count(*) from jsonb_array_elements(p) t)
    when 'features' then
      wirdlink_private.json_keys(p, array['tasbih','photo','audio'])
      and (select bool_and(jsonb_typeof(p->k) = 'boolean') from unnest(array['tasbih','photo','audio']) k)
    when 'texts' then
      wirdlink_private.json_keys(p, array['announcement','help','conditions'])
      and wirdlink_private.json_keys(p->'announcement', array['active','fr','en','ar'])
      and jsonb_typeof(p->'announcement'->'active') = 'boolean'
      and (select bool_and(wirdlink_private.json_text(p->'announcement'->l, 500)) from unnest(array['fr','en','ar']) l)
      and (select bool_and(wirdlink_private.json_keys(p->s, array['fr','en','ar'])
          and (select bool_and(wirdlink_private.json_text(p->s->l, 6000)) from unnest(array['fr','en','ar']) l))
        from unnest(array['help','conditions']) s)
    else false end, false);
$$;

insert into public.app_settings (key, value) values
  ('donations', jsonb_build_object('enabled', true, 'amounts', jsonb_build_array(500, 1000, 2000, 5000),
    'min', 100, 'max', 500000, 'number', '765578379', 'wave', true, 'orange', true)),
  ('templates', jsonb_build_array(
    jsonb_build_object('id', 'salat', 'title', 'Salat ala Nabi', 'target', 1000, 'icon', 'prayer'),
    jsonb_build_object('id', 'fatiha', 'title', 'Al Fatiha', 'target', 100, 'icon', 'book'),
    jsonb_build_object('id', 'istighfar', 'title', 'Istighfar', 'target', 1000, 'icon', 'heart'),
    jsonb_build_object('id', 'tahlil', 'title', 'Tahlil', 'target', 1000, 'icon', 'tap'))),
  ('features', jsonb_build_object('tasbih', true, 'photo', true, 'audio', true)),
  ('texts', jsonb_build_object(
    'announcement', jsonb_build_object('active', false, 'fr', '', 'en', '', 'ar', ''),
    'help', jsonb_build_object('fr', '', 'en', '', 'ar', ''),
    'conditions', jsonb_build_object('fr', '', 'en', '', 'ar', '')));

create or replace function wirdlink_private.admin_set_setting(p_key text, p_value jsonb) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform wirdlink_private.require_admin();
  if not wirdlink_private.valid_setting(p_key, p_value) then
    raise exception 'Invalid setting' using errcode = '22023';
  end if;
  update public.app_settings set value = p_value, updated_at = now(), updated_by = auth.uid()
  where key = p_key;
end;
$$;

-- Moderation: a hidden wird stays visible to its owner only; its data is kept.
create table wirdlink_private.hidden_wirds (
  wird_id uuid primary key references public.wirds(id) on delete cascade,
  reason text not null default '' check (char_length(reason) <= 200),
  hidden_by uuid references auth.users(id) on delete set null,
  hidden_at timestamptz not null default now()
);
alter table wirdlink_private.hidden_wirds enable row level security;
revoke all on wirdlink_private.hidden_wirds from public, anon, authenticated;

create or replace function wirdlink_private.can_read_wird(p_wird_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
 select exists (select 1 from public.wirds w where w.id=p_wird_id
   and not exists (select 1 from wirdlink_private.account_deletions d where d.user_id=w.owner_id)
   and (w.owner_id=auth.uid() or not exists (select 1 from wirdlink_private.hidden_wirds h where h.wird_id=w.id))
   and (w.visibility='public' or (
     exists (select 1 from auth.users u where u.id=auth.uid())
     and not exists (select 1 from wirdlink_private.account_deletions d where d.user_id=auth.uid())
     and (w.owner_id=auth.uid() or exists (select 1 from wirdlink_private.wird_grants g
       where g.wird_id=w.id and g.user_id=auth.uid())))));
$$;

create or replace function wirdlink_private.read_wird(p_wird_id uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
 select jsonb_build_object('id',w.id,'title',w.title,'description',w.description,
   'is_owner',coalesce(w.owner_id=auth.uid(),false),'instructions',w.instructions,'target',w.target,
   'completed',coalesce((select sum(p.quantity) from public.parts p where p.wird_id=w.id and p.finished
     and wirdlink_private.cycle_contains(w.recurrence,w.start_date,w.end_date,wirdlink_private.dakar_today(),
       (timezone('Africa/Dakar', p.created_at))::date)),0),
   'reserved',coalesce((select sum(p.quantity) from public.parts p where p.wird_id=w.id and not p.finished
     and wirdlink_private.cycle_contains(w.recurrence,w.start_date,w.end_date,wirdlink_private.dakar_today(),
       (timezone('Africa/Dakar', p.created_at))::date)),0),
   'recurrence',w.recurrence,'visibility',w.visibility,'image_path',w.image_path,
   'audio_path',w.audio_path,'start_date',w.start_date,'end_date',w.end_date,
   'hidden',coalesce(w.owner_id=auth.uid(),false)
     and exists (select 1 from wirdlink_private.hidden_wirds h where h.wird_id=w.id))
 from public.wirds w where w.id=p_wird_id and wirdlink_private.can_read_wird(w.id);
$$;

create or replace function wirdlink_private.unlock_wird(p_wird_id uuid, p_code text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare user_failures integer; global_failures integer;
begin
 perform wirdlink_private.require_active_account();
 -- A per-wird transaction lock serializes both scopes, including concurrent identities.
 perform pg_advisory_xact_lock(hashtextextended('unlock:'||p_wird_id::text,0));
 if wirdlink_private.can_read_wird(p_wird_id) then
   return jsonb_build_object('wird',wirdlink_private.read_wird(p_wird_id));
 end if;
 if not exists(select 1 from public.wirds w where w.id=p_wird_id
   and not exists(select 1 from wirdlink_private.account_deletions d where d.user_id=w.owner_id)
   and not exists(select 1 from wirdlink_private.hidden_wirds h where h.wird_id=w.id)) then
   return jsonb_build_object('error','invalid_code');
 end if;
 insert into wirdlink_private.unlock_attempts(wird_id,user_id) values(p_wird_id,auth.uid()) on conflict do nothing;
 insert into wirdlink_private.unlock_global_attempts(wird_id) values(p_wird_id) on conflict do nothing;
 update wirdlink_private.unlock_attempts set failures=0,window_started=now()
 where wird_id=p_wird_id and user_id=auth.uid() and window_started<=now()-interval '15 minutes';
 update wirdlink_private.unlock_global_attempts set failures=0,window_started=now()
 where wird_id=p_wird_id and window_started<=now()-interval '15 minutes';
 select failures into user_failures from wirdlink_private.unlock_attempts where wird_id=p_wird_id and user_id=auth.uid();
 select failures into global_failures from wirdlink_private.unlock_global_attempts where wird_id=p_wird_id;
 if user_failures>=5 or global_failures>=100 then return jsonb_build_object('error','rate_limited'); end if;
 if not exists(select 1 from wirdlink_private.access_codes c where c.wird_id=p_wird_id and c.code=p_code) then
   update wirdlink_private.unlock_attempts set failures=failures+1 where wird_id=p_wird_id and user_id=auth.uid();
   update wirdlink_private.unlock_global_attempts set failures=failures+1 where wird_id=p_wird_id;
   return jsonb_build_object('error','invalid_code');
 end if;
 insert into wirdlink_private.wird_grants(wird_id,user_id) values(p_wird_id,auth.uid()) on conflict do nothing;
 return jsonb_build_object('wird',wirdlink_private.read_wird(p_wird_id));
end;
$$;

-- Private wirds are listed without their content: the team only sees what everyone can see.
create function wirdlink_private.admin_wirds() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform wirdlink_private.require_admin();
  return coalesce((select jsonb_agg(jsonb_build_object(
      'id', w.id,
      'title', case when w.visibility = 'public' then w.title end,
      'description', case when w.visibility = 'public' then left(w.description, 300) end,
      'visibility', w.visibility,
      'author', wirdlink_private.user_name(w.owner_id),
      'createdAt', w.created_at,
      'participants', (select count(distinct p.participant_id) from public.parts p where p.wird_id = w.id),
      'hidden', h.wird_id is not null,
      'reason', coalesce(h.reason, '')) order by h.wird_id is null, w.created_at desc)
    from (select * from public.wirds
      where visibility = 'public' or id in (select wird_id from wirdlink_private.hidden_wirds)
      order by created_at desc limit 500) w
    left join wirdlink_private.hidden_wirds h on h.wird_id = w.id), '[]'::jsonb);
end;
$$;

create function wirdlink_private.admin_hide_wird(p_wird uuid, p_reason text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform wirdlink_private.require_admin();
  if p_reason is null or char_length(p_reason) > 200 then
    raise exception 'Invalid reason' using errcode = '22023';
  end if;
  if not exists(select 1 from public.wirds where id = p_wird) then
    raise exception 'wird_not_found' using errcode = 'P0001';
  end if;
  insert into wirdlink_private.hidden_wirds (wird_id, reason, hidden_by)
  values (p_wird, btrim(p_reason), auth.uid())
  on conflict (wird_id) do update set reason = excluded.reason, hidden_by = excluded.hidden_by,
    hidden_at = now();
end;
$$;

create function wirdlink_private.admin_unhide_wird(p_wird uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform wirdlink_private.require_admin();
  delete from wirdlink_private.hidden_wirds where wird_id = p_wird;
end;
$$;

create function public.admin_wirds() returns jsonb language sql security invoker set search_path = '' as $$
  select wirdlink_private.admin_wirds(); $$;
create function public.admin_hide_wird(p_wird uuid, p_reason text) returns void
language sql security invoker set search_path = '' as $$
  select wirdlink_private.admin_hide_wird(p_wird, p_reason); $$;
create function public.admin_unhide_wird(p_wird uuid) returns void
language sql security invoker set search_path = '' as $$
  select wirdlink_private.admin_unhide_wird(p_wird); $$;

do $$
declare
  fn text;
begin
  foreach fn in array array[
    'wirdlink_private.json_int(jsonb,bigint,bigint)', 'wirdlink_private.json_text(jsonb,integer)',
    'wirdlink_private.json_keys(jsonb,text[])', 'wirdlink_private.valid_setting(text,jsonb)',
    'wirdlink_private.admin_wirds()', 'wirdlink_private.admin_hide_wird(uuid,text)',
    'wirdlink_private.admin_unhide_wird(uuid)',
    'public.admin_wirds()', 'public.admin_hide_wird(uuid,text)', 'public.admin_unhide_wird(uuid)'] loop
    execute format('revoke all on function %s from public, anon, authenticated', fn);
    execute format('grant execute on function %s to authenticated', fn);
  end loop;
end;
$$;
