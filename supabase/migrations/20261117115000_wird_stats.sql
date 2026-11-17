-- Owner-only aggregates: no names or participant identifiers leave the database.
create function wirdlink_private.wird_stats(p_wird_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
 select jsonb_build_object(
   'participants',(select count(distinct p.participant_id) from public.parts p where p.wird_id=w.id),
   'days',coalesce((select jsonb_agg(jsonb_build_object('day',d.day,'finished',d.finished,'reserved',d.reserved)
     order by d.day) from (
       select (timezone('Africa/Dakar',p.created_at))::date as day,
         sum(p.quantity) filter (where p.finished) as finished,
         sum(p.quantity) filter (where not p.finished) as reserved
       from public.parts p where p.wird_id=w.id group by 1) d),'[]'::jsonb))
 from public.wirds w
 where w.id=p_wird_id and w.owner_id=auth.uid()
   and not exists(select 1 from wirdlink_private.account_deletions d where d.user_id=auth.uid());
$$;
create function public.wird_stats(p_wird_id uuid) returns jsonb language sql security invoker set search_path = '' as $$
 select wirdlink_private.wird_stats(p_wird_id);
$$;
revoke all on function public.wird_stats(uuid),wirdlink_private.wird_stats(uuid) from public,anon,authenticated;
grant execute on function public.wird_stats(uuid),wirdlink_private.wird_stats(uuid) to authenticated;
