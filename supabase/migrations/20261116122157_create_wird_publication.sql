-- Hosted and local schema. No real users or example wirds are inserted.
create schema if not exists wirdlink_private;
revoke all on schema wirdlink_private from public, anon, authenticated;
grant usage on schema wirdlink_private to authenticated;

create table public.wirds (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  request_id uuid not null,
  title text not null check (length(btrim(title)) between 1 and 100),
  description text not null default '' check (length(description) <= 1000),
  instructions text not null default '' check (length(instructions) <= 1000),
  target integer not null check (target > 0),
  recurrence text not null check (recurrence in ('Une fois', 'Tous les jours', 'Chaque semaine', 'Chaque vendredi')),
  start_date date not null,
  end_date date not null check (end_date >= start_date),
  visibility text not null check (visibility in ('public', 'private')),
  image_path text,
  audio_path text,
  created_at timestamptz not null default now(),
  unique (owner_id, request_id),
  check (image_path is null or image_path like owner_id::text || '/%'),
  check (audio_path is null or audio_path like owner_id::text || '/%')
);
create index wirds_public_created_idx on public.wirds (created_at desc) where visibility = 'public';

create table public.parts (
  id uuid primary key default gen_random_uuid(),
  wird_id uuid not null references public.wirds(id),
  participant_id uuid not null references auth.users(id),
  request_id uuid not null,
  quantity integer not null check (quantity > 0),
  name text not null default '' check (length(name) <= 60),
  finished boolean not null default false,
  created_at timestamptz not null default now(),
  finished_at timestamptz,
  unique (participant_id, request_id),
  check (finished = (finished_at is not null))
);
create index parts_wird_id_idx on public.parts (wird_id);

create table wirdlink_private.access_codes (
  wird_id uuid primary key references public.wirds(id),
  owner_id uuid not null references auth.users(id),
  code text not null check (code ~ '^[0-9]{4}$')
);
create index access_codes_owner_idx on wirdlink_private.access_codes (owner_id);

alter table public.wirds enable row level security;
alter table public.parts enable row level security;
alter table wirdlink_private.access_codes enable row level security;
revoke all on public.wirds, public.parts from public, anon, authenticated;
revoke all on wirdlink_private.access_codes from public, anon, authenticated;

-- Column grants avoid leaking owner/request identifiers through the public API.
grant select (id, title, description, instructions, target, recurrence, start_date,
  end_date, visibility, image_path, audio_path, created_at) on public.wirds to anon, authenticated;
grant select (id, wird_id, quantity, name, finished, created_at, finished_at)
  on public.parts to authenticated;
create policy "Read public or owned wirds" on public.wirds for select to anon, authenticated
  using (visibility = 'public' or owner_id = (select auth.uid()));
create policy "Read own parts" on public.parts for select to authenticated
  using (participant_id = (select auth.uid()));
create policy "Read own access codes" on wirdlink_private.access_codes for select to authenticated
  using (owner_id = (select auth.uid()));

-- Privileged mutations are deliberately separate from the exposed API schema.
create function wirdlink_private.publish_wird(p_request_id uuid, p_draft jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  user_id uuid := auth.uid();
  existing public.wirds;
  new_id uuid;
begin
  if user_id is null or not exists (
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

create function public.publish_wird(p_request_id uuid, p_draft jsonb)
returns uuid language sql security invoker set search_path = '' as $$
  select wirdlink_private.publish_wird(p_request_id, p_draft);
$$;

create function wirdlink_private.reserve_part(
  p_request_id uuid, p_wird_id uuid, p_quantity integer, p_name text default ''
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  user_id uuid := auth.uid();
  existing public.parts;
  selected public.wirds;
  reserved bigint;
  new_id uuid;
begin
  if user_id is null then
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
  if not found or (selected.visibility <> 'public' and selected.owner_id <> user_id) then
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

create function public.reserve_part(p_request_id uuid, p_wird_id uuid, p_quantity integer, p_name text default '')
returns uuid language sql security invoker set search_path = '' as $$
  select wirdlink_private.reserve_part(p_request_id, p_wird_id, p_quantity, p_name);
$$;

create function wirdlink_private.finish_part(p_part_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then
    raise exception 'Participant session required' using errcode = '42501';
  end if;
  update public.parts set finished = true, finished_at = coalesce(finished_at, now())
    where id = p_part_id and participant_id = auth.uid();
  if not found then
    raise exception 'Part unavailable' using errcode = '42501';
  end if;
end;
$$;
create function public.finish_part(p_part_id uuid)
returns void language sql security invoker set search_path = '' as $$
  select wirdlink_private.finish_part(p_part_id);
$$;

revoke all on function wirdlink_private.publish_wird(uuid, jsonb),
  wirdlink_private.reserve_part(uuid, uuid, integer, text), wirdlink_private.finish_part(uuid),
  public.publish_wird(uuid, jsonb), public.reserve_part(uuid, uuid, integer, text),
  public.finish_part(uuid) from public, anon, authenticated;
grant execute on function wirdlink_private.publish_wird(uuid, jsonb),
  wirdlink_private.reserve_part(uuid, uuid, integer, text), wirdlink_private.finish_part(uuid),
  public.publish_wird(uuid, jsonb), public.reserve_part(uuid, uuid, integer, text),
  public.finish_part(uuid) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('wird-media', 'wird-media', false, 10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/webm']);

create policy "Read own wird media" on storage.objects for select to authenticated
using (bucket_id = 'wird-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Upload own wird media" on storage.objects for insert to authenticated
with check (bucket_id = 'wird-media' and (storage.foldername(name))[1] = (select auth.uid())::text
  and not coalesce((select auth.jwt()->>'is_anonymous')::boolean, true));
create policy "Delete own wird media" on storage.objects for delete to authenticated
using (bucket_id = 'wird-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
