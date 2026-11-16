-- Recurring objectives count only the current Africa/Dakar cycle.
create function wirdlink_private.dakar_today()
returns date language sql stable set search_path = '' as $$
  select (timezone('Africa/Dakar', now()))::date;
$$;

create function wirdlink_private.cycle_contains(
  p_recurrence text, p_start date, p_end date, p_today date, p_part_day date
) returns boolean language plpgsql immutable set search_path = '' as $$
declare
  cycle_start date;
  cycle_end date;
  next_friday date;
begin
  if p_today < p_start or (p_end is not null and p_today > p_end) then return false; end if;
  if p_recurrence = 'Une fois' then
    return p_part_day >= p_start and (p_end is null or p_part_day <= p_end);
  elsif p_recurrence = 'Tous les jours' then
    return p_part_day = p_today;
  elsif p_recurrence = 'Chaque semaine' then
    cycle_start := p_start + ((p_today - p_start) / 7) * 7;
    cycle_end := cycle_start + 6;
    if p_end is not null and cycle_end > p_end then cycle_end := p_end; end if;
    return p_part_day >= cycle_start and p_part_day <= cycle_end;
  elsif p_recurrence = 'Chaque vendredi' then
    cycle_start := p_today - ((extract(dow from p_today)::integer + 2) % 7);
    if cycle_start < p_start then cycle_start := p_start; end if;
    next_friday := cycle_start + ((5 - extract(dow from cycle_start)::integer + 7) % 7);
    if next_friday = cycle_start then next_friday := cycle_start + 7; end if;
    cycle_end := next_friday - 1;
    if p_end is not null and cycle_end > p_end then cycle_end := p_end; end if;
    return p_part_day >= cycle_start and p_part_day <= cycle_end;
  end if;
  return false;
end $$;

revoke all on function wirdlink_private.dakar_today(),
  wirdlink_private.cycle_contains(text, date, date, date, date)
  from public, anon, authenticated;

create or replace function wirdlink_private.read_wird(p_wird_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
 select jsonb_build_object('id',w.id,'title',w.title,'description',w.description,
   'is_owner',coalesce(w.owner_id=auth.uid(),false),'instructions',w.instructions,'target',w.target,
   'completed',coalesce((select sum(p.quantity) from public.parts p where p.wird_id=w.id and p.finished
     and wirdlink_private.cycle_contains(w.recurrence,w.start_date,w.end_date,wirdlink_private.dakar_today(),
       (timezone('Africa/Dakar', p.created_at))::date)),0),
   'reserved',coalesce((select sum(p.quantity) from public.parts p where p.wird_id=w.id and not p.finished
     and wirdlink_private.cycle_contains(w.recurrence,w.start_date,w.end_date,wirdlink_private.dakar_today(),
       (timezone('Africa/Dakar', p.created_at))::date)),0),
   'recurrence',w.recurrence,'visibility',w.visibility,'image_path',w.image_path,
   'audio_path',w.audio_path,'start_date',w.start_date,'end_date',w.end_date)
 from public.wirds w where w.id=p_wird_id and wirdlink_private.can_read_wird(w.id);
$$;

create or replace function wirdlink_private.update_wird(p_wird_id uuid,p_changes jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare selected public.wirds; taken bigint; new_target integer;
begin
 perform wirdlink_private.require_active_account();
 select * into selected from public.wirds where id=p_wird_id and owner_id=auth.uid() for update;
 if selected.id is null or not exists(select 1 from auth.users where id=auth.uid() and not coalesce(is_anonymous,false)) then
   raise exception 'Owner required' using errcode='42501';
 end if;
 if p_changes is null or jsonb_typeof(p_changes)<>'object' then raise exception 'Invalid changes' using errcode='22023'; end if;
 new_target:=(p_changes->>'target')::integer;
 select coalesce(sum(quantity),0) into taken from public.parts p where p.wird_id=p_wird_id
   and wirdlink_private.cycle_contains(selected.recurrence,selected.start_date,selected.end_date,
     wirdlink_private.dakar_today(),(timezone('Africa/Dakar', p.created_at))::date);
 if new_target is null or new_target<greatest(1,taken) then raise exception 'Target below commitments' using errcode='22023'; end if;
 if p_changes->>'title' is null then raise exception 'Title required' using errcode='22023'; end if;
 update public.wirds set title=btrim(p_changes->>'title'),
 description=coalesce(p_changes->>'description',''),instructions=coalesce(p_changes->>'instructions',''),
 target=new_target where id=p_wird_id;
 return wirdlink_private.read_wird(p_wird_id);
end $$;

create or replace function wirdlink_private.reserve_part(
  p_request_id uuid, p_wird_id uuid, p_quantity integer, p_name text default ''
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  user_id uuid := auth.uid();
  existing public.parts;
  selected public.wirds;
  reserved bigint;
  today date := wirdlink_private.dakar_today();
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
  if today < selected.start_date or (selected.end_date is not null and today > selected.end_date) then
    raise exception 'Quantity unavailable' using errcode = '22023';
  end if;
  select coalesce(sum(quantity), 0) into reserved from public.parts p where p.wird_id = p_wird_id
    and wirdlink_private.cycle_contains(selected.recurrence, selected.start_date, selected.end_date, today,
      (timezone('Africa/Dakar', p.created_at))::date);
  if p_quantity > selected.target - reserved then
    raise exception 'Quantity unavailable' using errcode = '22023';
  end if;
  insert into public.parts (wird_id, participant_id, request_id, quantity, name)
  values (p_wird_id, user_id, p_request_id, p_quantity, btrim(p_name)) returning id into new_id;
  return new_id;
end;
$$;

create or replace function wirdlink_private.wird_participants(p_wird_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'wirdId',p.wird_id,
 'quantity',p.quantity,'name',p.name,'finished',p.finished) order by p.created_at,p.id),'[]'::jsonb)
 from public.parts p
 join public.wirds w on w.id = p.wird_id
 where p.wird_id=p_wird_id and wirdlink_private.can_read_wird(p_wird_id)
 and wirdlink_private.cycle_contains(w.recurrence,w.start_date,w.end_date,wirdlink_private.dakar_today(),
   (timezone('Africa/Dakar', p.created_at))::date);
$$;
