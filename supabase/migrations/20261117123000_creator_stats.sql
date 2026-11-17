-- Totals across every wird of the signed-in creator: no names or participant identifiers leave the database.
create function wirdlink_private.creator_stats()
returns jsonb language sql stable security definer set search_path = '' as $$
 select jsonb_build_object(
   'participants',(select count(distinct p.participant_id) from public.parts p
     join public.wirds w on w.id=p.wird_id where w.owner_id=auth.uid()),
   'wirds',coalesce((select jsonb_agg(jsonb_build_object('id',w.id,'days',coalesce((
       select jsonb_agg(jsonb_build_object('day',d.day,'finished',d.finished) order by d.day) from (
         select (timezone('Africa/Dakar',p.created_at))::date as day,sum(p.quantity) as finished
         from public.parts p where p.wird_id=w.id and p.finished group by 1) d),'[]'::jsonb)))
     from public.wirds w where w.owner_id=auth.uid()),'[]'::jsonb))
 where auth.uid() is not null
   and not exists(select 1 from wirdlink_private.account_deletions d where d.user_id=auth.uid());
$$;
create function public.creator_stats() returns jsonb language sql security invoker set search_path = '' as $$
 select wirdlink_private.creator_stats();
$$;
revoke all on function public.creator_stats(),wirdlink_private.creator_stats() from public,anon,authenticated;
grant execute on function public.creator_stats(),wirdlink_private.creator_stats() to authenticated;
