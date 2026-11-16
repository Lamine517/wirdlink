-- Public RPCs expose only participant DTOs; privileged data stays in a private schema.
alter table public.wirds alter column end_date drop not null;
create table wirdlink_private.wird_grants (
  wird_id uuid not null references public.wirds(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (wird_id, user_id)
);
create table wirdlink_private.unlock_attempts (
  wird_id uuid not null references public.wirds(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  window_started timestamptz not null default now(),
  failures integer not null default 0 check (failures >= 0),
  primary key (wird_id, user_id)
);
create table wirdlink_private.unlock_global_attempts (
  wird_id uuid primary key references public.wirds(id) on delete cascade,
  window_started timestamptz not null default now(),
  failures integer not null default 0 check (failures >= 0)
);
-- User-leading indexes also bound the cost of account deletion cascades.
create index wird_grants_user_idx on wirdlink_private.wird_grants(user_id);
create index unlock_attempts_user_idx on wirdlink_private.unlock_attempts(user_id);
alter table wirdlink_private.wird_grants enable row level security;
alter table wirdlink_private.unlock_attempts enable row level security;
alter table wirdlink_private.unlock_global_attempts enable row level security;
revoke all on wirdlink_private.wird_grants, wirdlink_private.unlock_attempts,
  wirdlink_private.unlock_global_attempts from public, anon, authenticated;

create function wirdlink_private.can_read_wird(p_wird_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
 select exists (select 1 from public.wirds w where w.id=p_wird_id
   and not exists (select 1 from wirdlink_private.account_deletions d where d.user_id=w.owner_id)
   and (w.visibility='public' or (
     exists (select 1 from auth.users u where u.id=auth.uid())
     and not exists (select 1 from wirdlink_private.account_deletions d where d.user_id=auth.uid())
     and (w.owner_id=auth.uid() or exists (select 1 from wirdlink_private.wird_grants g
       where g.wird_id=w.id and g.user_id=auth.uid())))));
$$;
create function wirdlink_private.read_wird(p_wird_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
 select jsonb_build_object('id',w.id,'title',w.title,'description',w.description,
   'instructions',w.instructions,'target',w.target,
   'completed',coalesce((select sum(p.quantity) from public.parts p where p.wird_id=w.id and p.finished),0),
   'reserved',coalesce((select sum(p.quantity) from public.parts p where p.wird_id=w.id and not p.finished),0),
   'recurrence',w.recurrence,'visibility',w.visibility,'image_path',w.image_path,
   'audio_path',w.audio_path,'start_date',w.start_date,'end_date',w.end_date)
 from public.wirds w where w.id=p_wird_id and wirdlink_private.can_read_wird(w.id);
$$;
create function wirdlink_private.read_wirds()
returns jsonb language sql stable security definer set search_path = '' as $$
 select coalesce(jsonb_agg(wirdlink_private.read_wird(w.id) order by w.created_at desc,w.id),'[]'::jsonb)
 from (select id,created_at from public.wirds where wirdlink_private.can_read_wird(id)
 order by created_at desc,id limit 1000) w;
$$;
create function wirdlink_private.publication_receipt(p_wird_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare result jsonb;
begin
 perform wirdlink_private.require_active_account();
 select jsonb_strip_nulls(jsonb_build_object('id',w.id,'title',w.title,'visibility',w.visibility,'accessCode',c.code))
 into result from public.wirds w left join wirdlink_private.access_codes c on c.wird_id=w.id
 where w.id=p_wird_id and w.owner_id=auth.uid()
 and exists(select 1 from auth.users u where u.id=auth.uid() and not coalesce(u.is_anonymous,false));
 return result;
end;
$$;
create function wirdlink_private.unlock_wird(p_wird_id uuid,p_code text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare user_failures integer; global_failures integer;
begin
 perform wirdlink_private.require_active_account();
 -- A per-wird transaction lock serializes both scopes, including concurrent identities.
 perform pg_advisory_xact_lock(hashtextextended('unlock:'||p_wird_id::text,0));
 if wirdlink_private.can_read_wird(p_wird_id) then
   return jsonb_build_object('wird',wirdlink_private.read_wird(p_wird_id));
 end if;
 if not exists(select 1 from public.wirds w where w.id=p_wird_id
   and not exists(select 1 from wirdlink_private.account_deletions d where d.user_id=w.owner_id)) then
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
  -- Serializes retries with the same owner/request pair, including concurrent calls.
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
  if (p_draft->>'startDate')::date < current_date then
    raise exception 'Start date is in the past' using errcode = '22023';
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

create or replace function wirdlink_private.reserve_part(
  p_request_id uuid, p_wird_id uuid, p_quantity integer, p_name text default ''
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  user_id uuid := auth.uid();
  existing public.parts;
  selected public.wirds;
  reserved bigint;
  new_id uuid;
begin
  perform wirdlink_private.require_active_account();
  if not wirdlink_private.account_is_active() then
    raise exception 'Participant session required' using errcode = '42501';
  end if;
  if p_request_id is null or p_quantity is null or p_quantity <= 0
    or p_name is null or length(p_name) > 60 then
    raise exception 'Invalid part' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(user_id::text || p_request_id::text, 0));
  select * into existing from public.parts where participant_id = user_id and request_id = p_request_id;
  if found then
    if existing.wird_id <> p_wird_id or existing.quantity <> p_quantity or existing.name <> btrim(p_name) then
      raise exception 'Request already used with different content' using errcode = '22023';
    end if;
    return existing.id;
  end if;
  select * into selected from public.wirds where id = p_wird_id for update;
  if found then
    perform 1 from auth.users u where u.id = selected.owner_id for share;
  end if;
  if selected.id is null or exists (select 1 from wirdlink_private.account_deletions d where d.user_id = selected.owner_id) or not wirdlink_private.can_read_wird(p_wird_id) then
    raise exception 'Wird unavailable' using errcode = '42501';
  end if;
  select coalesce(sum(quantity), 0) into reserved from public.parts where wird_id = p_wird_id;
  if p_quantity > selected.target - reserved then
    raise exception 'Quantity unavailable' using errcode = '22023';
  end if;
  insert into public.parts (wird_id, participant_id, request_id, quantity, name)
  values (p_wird_id, user_id, p_request_id, p_quantity, btrim(p_name)) returning id into new_id;
  return new_id;
end;
$$;


create function wirdlink_private.part_result(p_part_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
 select jsonb_build_object('part',jsonb_build_object('id',p.id,'wirdId',p.wird_id,
 'quantity',p.quantity,'name',p.name,'finished',p.finished),'wird',wirdlink_private.read_wird(p.wird_id))
 from public.parts p where p.id=p_part_id and p.participant_id=auth.uid()
 and wirdlink_private.can_read_wird(p.wird_id);
$$;
create function wirdlink_private.reserve_wird_part(p_request_id uuid,p_wird_id uuid,p_quantity integer,p_name text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare part_id uuid;
begin
 part_id:=wirdlink_private.reserve_part(p_request_id,p_wird_id,p_quantity,p_name);
 return wirdlink_private.part_result(part_id);
end;
$$;
create function wirdlink_private.finish_wird_part(p_part_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
 perform wirdlink_private.finish_part(p_part_id);
 return wirdlink_private.part_result(p_part_id);
end;
$$;
create function wirdlink_private.wird_participants(p_wird_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'wirdId',p.wird_id,
 'quantity',p.quantity,'name',p.name,'finished',p.finished) order by p.created_at,p.id),'[]'::jsonb)
 from public.parts p where p.wird_id=p_wird_id and wirdlink_private.can_read_wird(p_wird_id);
$$;
create or replace function wirdlink_private.wird_author(p_wird_id uuid)
returns table(display_name text, organization text)
language sql stable security definer set search_path = '' as $$
 select coalesce(nullif(btrim(concat_ws(' ',p.first_name,p.last_name)),''),'Un membre'),coalesce(p.organization,'')
 from public.wirds w left join public.profiles p on p.id=w.owner_id
 where w.id=p_wird_id and wirdlink_private.can_read_wird(w.id);
$$;
drop policy "Read public or owned wirds" on public.wirds;
create policy "Read accessible wirds" on public.wirds for select to anon,authenticated
 using (wirdlink_private.can_read_wird(id));
create policy "Read attached accessible media" on storage.objects for select to anon,authenticated
 using (bucket_id='wird-media' and exists(select 1 from public.wirds w
 where (w.image_path=name or w.audio_path=name) and wirdlink_private.can_read_wird(w.id)));

create function public.read_wirds() returns jsonb language sql security invoker set search_path = '' as $$
 select wirdlink_private.read_wirds();
$$;
revoke all on function public.read_wirds(),wirdlink_private.read_wirds() from public,anon,authenticated;
grant execute on function public.read_wirds(),wirdlink_private.read_wirds() to anon, authenticated;

create function public.read_wird(p_wird_id uuid) returns jsonb language sql security invoker set search_path = '' as $$
 select wirdlink_private.read_wird(p_wird_id);
$$;
revoke all on function public.read_wird(uuid),wirdlink_private.read_wird(uuid) from public,anon,authenticated;
grant execute on function public.read_wird(uuid),wirdlink_private.read_wird(uuid) to anon, authenticated;

create function public.publication_receipt(p_wird_id uuid) returns jsonb language sql security invoker set search_path = '' as $$
 select wirdlink_private.publication_receipt(p_wird_id);
$$;
revoke all on function public.publication_receipt(uuid),wirdlink_private.publication_receipt(uuid) from public,anon,authenticated;
grant execute on function public.publication_receipt(uuid),wirdlink_private.publication_receipt(uuid) to authenticated;

create function public.unlock_wird(p_wird_id uuid,p_code text) returns jsonb language sql security invoker set search_path = '' as $$
 select wirdlink_private.unlock_wird(p_wird_id,p_code);
$$;
revoke all on function public.unlock_wird(uuid,text),wirdlink_private.unlock_wird(uuid,text) from public,anon,authenticated;
grant execute on function public.unlock_wird(uuid,text),wirdlink_private.unlock_wird(uuid,text) to authenticated;

create function public.reserve_wird_part(p_request_id uuid,p_wird_id uuid,p_quantity integer,p_name text) returns jsonb language sql security invoker set search_path = '' as $$
 select wirdlink_private.reserve_wird_part(p_request_id,p_wird_id,p_quantity,p_name);
$$;
revoke all on function public.reserve_wird_part(uuid,uuid,integer,text),wirdlink_private.reserve_wird_part(uuid,uuid,integer,text) from public,anon,authenticated;
grant execute on function public.reserve_wird_part(uuid,uuid,integer,text),wirdlink_private.reserve_wird_part(uuid,uuid,integer,text) to authenticated;

create function public.finish_wird_part(p_part_id uuid) returns jsonb language sql security invoker set search_path = '' as $$
 select wirdlink_private.finish_wird_part(p_part_id);
$$;
revoke all on function public.finish_wird_part(uuid),wirdlink_private.finish_wird_part(uuid) from public,anon,authenticated;
grant execute on function public.finish_wird_part(uuid),wirdlink_private.finish_wird_part(uuid) to authenticated;

create function public.wird_participants(p_wird_id uuid) returns jsonb language sql security invoker set search_path = '' as $$
 select wirdlink_private.wird_participants(p_wird_id);
$$;
revoke all on function public.wird_participants(uuid),wirdlink_private.wird_participants(uuid) from public,anon,authenticated;
grant execute on function public.wird_participants(uuid),wirdlink_private.wird_participants(uuid) to anon, authenticated;

revoke all on function wirdlink_private.can_read_wird(uuid),wirdlink_private.part_result(uuid) from public,anon,authenticated;
grant execute on function wirdlink_private.can_read_wird(uuid) to anon,authenticated;
-- part_result is an internal implementation detail, never directly granted.
