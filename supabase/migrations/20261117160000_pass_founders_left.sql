-- Lets creators see whether a founder place is still available before paying.
create or replace function wirdlink_private.my_pass() returns jsonb
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
    'isAdmin', wirdlink_private.is_admin(),
    'founder', exists(select 1 from wirdlink_private.passes p where p.owner_id = auth.uid()
      and p.kind = 'founder'),
    'foundersLeft', greatest(0, coalesce((select (s.value->>'founderSlots')::integer
      from public.app_settings s where s.key = 'pass'), 0)
      - (select count(distinct p.owner_id) from wirdlink_private.passes p where p.kind = 'founder')))
  where wirdlink_private.caller_is_permanent();
$$;
