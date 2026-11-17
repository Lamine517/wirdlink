create or replace function wirdlink_private.wird_author(p_wird_id uuid)
returns table(display_name text, organization text)
language sql stable security definer set search_path = '' as $$
 select coalesce(btrim(concat_ws(' ',p.first_name,p.last_name)),''),coalesce(btrim(p.organization),'')
 from public.wirds w left join public.profiles p on p.id=w.owner_id
 where w.id=p_wird_id and wirdlink_private.can_read_wird(w.id);
$$;
