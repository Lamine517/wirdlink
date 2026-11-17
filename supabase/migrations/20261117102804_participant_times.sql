create or replace function wirdlink_private.wird_participants(p_wird_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'wirdId',p.wird_id,
 'quantity',p.quantity,'name',p.name,'finished',p.finished,'createdAt',p.created_at)
 order by p.created_at,p.id),'[]'::jsonb)
 from public.parts p
 join public.wirds w on w.id = p.wird_id
 where p.wird_id=p_wird_id and wirdlink_private.can_read_wird(p_wird_id)
 and wirdlink_private.cycle_contains(w.recurrence,w.start_date,w.end_date,wirdlink_private.dakar_today(),
   (timezone('Africa/Dakar', p.created_at))::date);
$$;
