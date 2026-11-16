begin;
select set_config('wirdlink.test_owner', gen_random_uuid()::text, true);
select set_config('wirdlink.test_other', gen_random_uuid()::text, true);
select set_config('wirdlink.test_public', gen_random_uuid()::text, true);
select set_config('wirdlink.test_private', gen_random_uuid()::text, true);
insert into auth.users (id, aud, role, is_anonymous)
values (current_setting('wirdlink.test_owner')::uuid, 'authenticated', 'authenticated', false),
  (current_setting('wirdlink.test_other')::uuid, 'authenticated', 'authenticated', false);
insert into public.wirds (id, owner_id, request_id, title, target, recurrence, start_date, end_date, visibility)
values (current_setting('wirdlink.test_public')::uuid, current_setting('wirdlink.test_owner')::uuid,
  gen_random_uuid(), 'Public author test', 1000, 'Une fois', current_date, current_date, 'public'),
  (current_setting('wirdlink.test_private')::uuid, current_setting('wirdlink.test_owner')::uuid,
  gen_random_uuid(), 'Private author test', 1000, 'Une fois', current_date, current_date, 'private');
set local role authenticated;
select set_config('request.jwt.claims', jsonb_build_object('sub', current_setting('wirdlink.test_owner'),
  'role', 'authenticated', 'is_anonymous', false)::text, true);
insert into public.profiles (id, first_name, last_name, address, organization)
values (current_setting('wirdlink.test_owner')::uuid, 'Prénom', 'Nom', 'Adresse privée', 'Dahira test');
insert into public.profiles (id, first_name, last_name, address, organization)
values (current_setting('wirdlink.test_owner')::uuid, 'Prénom', 'Nom', 'Adresse privée', 'Dahira test')
on conflict (id) do update set first_name = excluded.first_name, address = excluded.address;
do $$ begin
  if (select address from public.profiles where id = auth.uid()) <> 'Adresse privée' then
    raise exception 'Owner cannot read profile';
  end if;
end $$;
select set_config('request.jwt.claims', jsonb_build_object('sub', current_setting('wirdlink.test_other'),
  'role', 'authenticated', 'is_anonymous', false)::text, true);
do $$ begin
  if exists (select * from public.profiles where id = current_setting('wirdlink.test_owner')::uuid) then
    raise exception 'Private profile leaked';
  end if;
  update public.profiles set address = 'Modified' where id = current_setting('wirdlink.test_owner')::uuid;
  if found then raise exception 'Another user edited the profile'; end if;
  if exists (select * from public.wird_author(current_setting('wirdlink.test_private')::uuid)) then
    raise exception 'Private author leaked';
  end if;
end $$;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
do $$ begin
  if (select display_name from public.wird_author(current_setting('wirdlink.test_public')::uuid)) <> 'Prénom Nom' then
    raise exception 'Public author missing';
  end if;
  if (select organization from public.wird_author(current_setting('wirdlink.test_public')::uuid)) <> 'Dahira test' then
    raise exception 'Public organization missing';
  end if;
  begin
    perform address from public.profiles;
    raise exception 'Anonymous visitor can read private addresses';
  exception when insufficient_privilege then null; end;
end $$;
rollback;
select 'Profile privacy and author checks passed; all fixtures rolled back.' as result;
