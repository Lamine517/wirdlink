-- Owner actions never trust a client-provided owner id.
create table public.wird_titles (
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(btrim(title)) between 1 and 100),
  used_at timestamptz not null default now(),
  primary key(user_id,title)
);
alter table public.wird_titles enable row level security;
revoke all on public.wird_titles from public,anon,authenticated;
grant select on public.wird_titles to authenticated;
create policy own_titles on public.wird_titles for select to authenticated
using ((select auth.uid())=user_id and (select wirdlink_private.account_is_active()));
create function wirdlink_private.remember_wird_title()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.wird_titles(user_id,title) values(new.owner_id,btrim(new.title))
 on conflict(user_id,title) do update set used_at=now();
 return new;
end $$;
revoke all on function wirdlink_private.remember_wird_title() from public,anon,authenticated;
create trigger remember_wird_title after insert or update of title on public.wirds
for each row execute function wirdlink_private.remember_wird_title();
insert into public.wird_titles(user_id,title) select distinct owner_id,btrim(title) from public.wirds on conflict do nothing;
create or replace function wirdlink_private.read_wird(p_wird_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
 select jsonb_build_object('id',w.id,'title',w.title,'description',w.description,
   'is_owner',coalesce(w.owner_id=auth.uid(),false),'instructions',w.instructions,'target',w.target,
   'completed',coalesce((select sum(p.quantity) from public.parts p where p.wird_id=w.id and p.finished),0),
   'reserved',coalesce((select sum(p.quantity) from public.parts p where p.wird_id=w.id and not p.finished),0),
   'recurrence',w.recurrence,'visibility',w.visibility,'image_path',w.image_path,
   'audio_path',w.audio_path,'start_date',w.start_date,'end_date',w.end_date)
 from public.wirds w where w.id=p_wird_id and wirdlink_private.can_read_wird(w.id);
$$;

create function wirdlink_private.update_wird(p_wird_id uuid,p_changes jsonb)
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
 select coalesce(sum(quantity),0) into taken from public.parts where wird_id=p_wird_id;
 if new_target is null or new_target<greatest(1,taken) then raise exception 'Target below commitments' using errcode='22023'; end if;
 if p_changes->>'title' is null then raise exception 'Title required' using errcode='22023'; end if;
 update public.wirds set title=btrim(p_changes->>'title'),
 description=coalesce(p_changes->>'description',''),instructions=coalesce(p_changes->>'instructions',''),
 target=new_target where id=p_wird_id;
 return wirdlink_private.read_wird(p_wird_id);
end $$;
create function public.update_wird(p_wird_id uuid,p_changes jsonb)
returns jsonb language sql security invoker set search_path='' as $$
 select wirdlink_private.update_wird(p_wird_id,p_changes);
$$;
create function wirdlink_private.delete_wird(p_wird_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare selected public.wirds;
begin
 perform wirdlink_private.require_active_account();
 select * into selected from public.wirds where id=p_wird_id and owner_id=auth.uid() for update;
 if selected.id is null or not exists(select 1 from auth.users where id=auth.uid() and not coalesce(is_anonymous,false)) then
   raise exception 'Owner required' using errcode='42501';
 end if;
 delete from public.parts where wird_id=p_wird_id;
 delete from wirdlink_private.access_codes where wird_id=p_wird_id;
 delete from public.wirds where id=p_wird_id;
end $$;
create function public.delete_wird(p_wird_id uuid)
returns void language sql security invoker set search_path='' as $$
 select wirdlink_private.delete_wird(p_wird_id);
$$;
revoke all on function public.update_wird(uuid,jsonb),wirdlink_private.update_wird(uuid,jsonb),public.delete_wird(uuid),wirdlink_private.delete_wird(uuid) from public,anon,authenticated;
grant execute on function public.update_wird(uuid,jsonb),wirdlink_private.update_wird(uuid,jsonb),public.delete_wird(uuid),wirdlink_private.delete_wird(uuid) to authenticated;
