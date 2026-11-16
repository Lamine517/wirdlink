create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null default '' check (length(first_name) <= 60),
  last_name text not null default '' check (length(last_name) <= 60),
  address text not null default '' check (length(address) <= 240),
  organization text not null default '' check (length(organization) <= 120)
);
alter table public.profiles enable row level security;
revoke all on public.profiles from public, anon, authenticated;
grant select, insert on public.profiles to authenticated;
grant update (id, first_name, last_name, address, organization) on public.profiles to authenticated;
create policy "Read own profile" on public.profiles for select to authenticated
using (id = (select auth.uid()) and (select wirdlink_private.account_is_active()));
create policy "Create own profile" on public.profiles for insert to authenticated
with check (id = (select auth.uid()) and (select wirdlink_private.account_is_active()));
create policy "Update own profile" on public.profiles for update to authenticated
using (id = (select auth.uid()) and (select wirdlink_private.account_is_active()))
with check (id = (select auth.uid()) and (select wirdlink_private.account_is_active()));

create function wirdlink_private.wird_author(p_wird_id uuid)
returns table(display_name text, organization text)
language sql stable security definer set search_path = '' as $$
  select coalesce(nullif(btrim(concat_ws(' ', p.first_name, p.last_name)), ''), 'Un membre'),
    coalesce(p.organization, '')
  from public.wirds w left join public.profiles p on p.id = w.owner_id
  where w.id = p_wird_id and (w.visibility = 'public' or w.owner_id = auth.uid());
$$;
create function public.wird_author(p_wird_id uuid)
returns table(display_name text, organization text)
language sql stable security invoker set search_path = '' as $$
  select * from wirdlink_private.wird_author(p_wird_id);
$$;
revoke all on function wirdlink_private.wird_author(uuid), public.wird_author(uuid)
from public, anon, authenticated;
grant usage on schema wirdlink_private to anon;
grant execute on function wirdlink_private.wird_author(uuid), public.wird_author(uuid)
to anon, authenticated;
