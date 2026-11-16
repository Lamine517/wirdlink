-- A local calendar can be one day behind UTC, and phone files use alias media types.
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

create function wirdlink_private.caller_is_permanent()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from auth.users u
    where u.id = auth.uid()
      and not coalesce(u.is_anonymous, false)
      and not exists (select 1 from wirdlink_private.account_deletions d where d.user_id = u.id)
  );
$$;
revoke all on function wirdlink_private.caller_is_permanent() from public, anon, authenticated;
grant execute on function wirdlink_private.caller_is_permanent() to authenticated;

drop policy if exists "Upload own wird media" on storage.objects;
create policy "Upload own wird media" on storage.objects for insert to authenticated
with check (
  bucket_id = 'wird-media'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (select wirdlink_private.caller_is_permanent())
);
