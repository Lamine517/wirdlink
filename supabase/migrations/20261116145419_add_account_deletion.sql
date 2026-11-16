create table wirdlink_private.account_deletions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  requested_at timestamptz not null default now()
);
alter table wirdlink_private.account_deletions enable row level security;
revoke all on wirdlink_private.account_deletions from public, anon, authenticated;

create function wirdlink_private.account_is_active()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from auth.users u where u.id = auth.uid())
    and not exists (select 1 from wirdlink_private.account_deletions d where d.user_id = auth.uid());
$$;
revoke all on function wirdlink_private.account_is_active() from public, anon, authenticated;
grant execute on function wirdlink_private.account_is_active() to authenticated;

create function wirdlink_private.require_active_account()
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from auth.users u where u.id = auth.uid() for share;
  if not found or not wirdlink_private.account_is_active() then
    raise exception 'Account unavailable' using errcode = '42501';
  end if;
end;
$$;
revoke all on function wirdlink_private.require_active_account() from public, anon, authenticated;

create function wirdlink_private.guard_media_write()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.bucket_id = 'wird-media' and auth.uid() is not null then
    perform wirdlink_private.require_active_account();
  end if;
  return new;
end;
$$;
revoke all on function wirdlink_private.guard_media_write() from public, anon, authenticated;
create trigger wird_media_active_account before insert or update on storage.objects
for each row execute function wirdlink_private.guard_media_write();

create policy "Require active account for wird media" on storage.objects
as restrictive for all to authenticated
using (bucket_id <> 'wird-media' or (select wirdlink_private.account_is_active()))
with check (bucket_id <> 'wird-media' or (select wirdlink_private.account_is_active()));

-- These service-only operations are called exclusively after Auth verifies the requester.
create function wirdlink_private.prepare_account_deletion(p_user_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from auth.users u where u.id = p_user_id and not coalesce(u.is_anonymous, false) for update;
  if not found then raise exception 'Account unavailable' using errcode = '42501'; end if;
  insert into wirdlink_private.account_deletions (user_id) values (p_user_id)
  on conflict (user_id) do nothing;
end;
$$;
create function wirdlink_private.account_media_paths(p_user_id uuid)
returns table(path text) language sql security definer set search_path = '' as $$
  select o.name from storage.objects o
  where o.bucket_id = 'wird-media' and split_part(o.name, '/', 1) = p_user_id::text
    and exists (select 1 from wirdlink_private.account_deletions d where d.user_id = p_user_id)
  order by o.name limit 100;
$$;
create function wirdlink_private.purge_account_data(p_user_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from wirdlink_private.account_deletions d where d.user_id = p_user_id) then
    raise exception 'Deletion not prepared' using errcode = '42501';
  end if;
  if exists (select 1 from storage.objects o where o.bucket_id = 'wird-media'
    and split_part(o.name, '/', 1) = p_user_id::text) then
    raise exception 'Media deletion incomplete' using errcode = '55000';
  end if;
  delete from public.parts p where p.participant_id = p_user_id
    or p.wird_id in (select w.id from public.wirds w where w.owner_id = p_user_id);
  delete from wirdlink_private.access_codes c where c.owner_id = p_user_id
    or c.wird_id in (select w.id from public.wirds w where w.owner_id = p_user_id);
  delete from public.wirds w where w.owner_id = p_user_id;
end;
$$;
create function public.prepare_account_deletion(p_user_id uuid)
returns void language sql security invoker set search_path = '' as $$
  select wirdlink_private.prepare_account_deletion(p_user_id);
$$;
create function public.account_media_paths(p_user_id uuid)
returns table(path text) language sql security invoker set search_path = '' as $$
  select * from wirdlink_private.account_media_paths(p_user_id);
$$;
create function public.purge_account_data(p_user_id uuid)
returns void language sql security invoker set search_path = '' as $$
  select wirdlink_private.purge_account_data(p_user_id);
$$;
revoke all on function public.prepare_account_deletion(uuid),
  public.account_media_paths(uuid), public.purge_account_data(uuid),
  wirdlink_private.prepare_account_deletion(uuid), wirdlink_private.account_media_paths(uuid),
  wirdlink_private.purge_account_data(uuid) from public, anon, authenticated;
grant usage on schema wirdlink_private to service_role;
grant execute on function public.prepare_account_deletion(uuid),
  public.account_media_paths(uuid), public.purge_account_data(uuid),
  wirdlink_private.prepare_account_deletion(uuid), wirdlink_private.account_media_paths(uuid),
  wirdlink_private.purge_account_data(uuid) to service_role;

create or replace function wirdlink_private.publish_wird(p_request_id uuid, p_draft jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  user_id uuid := auth.uid();
  existing public.wirds;
  new_id uuid;
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
  if selected.id is null or exists (select 1 from wirdlink_private.account_deletions d where d.user_id = selected.owner_id) or (selected.visibility <> 'public' and selected.owner_id <> user_id) then
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

create or replace function wirdlink_private.finish_part(p_part_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform wirdlink_private.require_active_account();
  if not wirdlink_private.account_is_active() then
    raise exception 'Participant session required' using errcode = '42501';
  end if;
  update public.parts set finished = true, finished_at = coalesce(finished_at, now())
    where id = p_part_id and participant_id = auth.uid();
  if not found then
    raise exception 'Part unavailable' using errcode = '42501';
  end if;
end;
$$;
