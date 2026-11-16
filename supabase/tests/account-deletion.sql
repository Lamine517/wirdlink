begin;
select set_config('wirdlink.test_owner', gen_random_uuid()::text, true);
select set_config('wirdlink.test_other', gen_random_uuid()::text, true);
select set_config('wirdlink.test_owned_wird', gen_random_uuid()::text, true);
select set_config('wirdlink.test_other_wird', gen_random_uuid()::text, true);
insert into auth.users (id, aud, role, is_anonymous)
values (current_setting('wirdlink.test_owner')::uuid, 'authenticated', 'authenticated', false),
  (current_setting('wirdlink.test_other')::uuid, 'authenticated', 'authenticated', false);
insert into public.wirds (id, owner_id, request_id, title, target, recurrence, start_date, end_date, visibility)
values (current_setting('wirdlink.test_owned_wird')::uuid, current_setting('wirdlink.test_owner')::uuid,
  gen_random_uuid(), 'Deletion fixture', 1000, 'Une fois', current_date, current_date, 'private'),
  (current_setting('wirdlink.test_other_wird')::uuid, current_setting('wirdlink.test_other')::uuid,
  gen_random_uuid(), 'Unrelated fixture', 1000, 'Une fois', current_date, current_date, 'public');
insert into wirdlink_private.access_codes (wird_id, owner_id, code)
values (current_setting('wirdlink.test_owned_wird')::uuid, current_setting('wirdlink.test_owner')::uuid, '1234');
insert into public.parts (wird_id, participant_id, request_id, quantity)
values (current_setting('wirdlink.test_owned_wird')::uuid, current_setting('wirdlink.test_other')::uuid, gen_random_uuid(), 200),
  (current_setting('wirdlink.test_other_wird')::uuid, current_setting('wirdlink.test_owner')::uuid, gen_random_uuid(), 100),
  (current_setting('wirdlink.test_other_wird')::uuid, current_setting('wirdlink.test_other')::uuid, gen_random_uuid(), 50);

set local role authenticated;
select set_config('request.jwt.claims', jsonb_build_object('sub', current_setting('wirdlink.test_owner'),
  'role', 'authenticated', 'is_anonymous', false)::text, true);
do $$ begin
  if not wirdlink_private.account_is_active() then raise exception 'Active account rejected'; end if;
  begin
    perform public.prepare_account_deletion(current_setting('wirdlink.test_other')::uuid);
    raise exception 'Browser can prepare deletion';
  exception when insufficient_privilege then null; end;
  begin
    perform public.purge_account_data(current_setting('wirdlink.test_other')::uuid);
    raise exception 'Browser can purge another account';
  exception when insufficient_privilege then null; end;
end $$;
set local role service_role;
select public.prepare_account_deletion(current_setting('wirdlink.test_owner')::uuid);
select public.prepare_account_deletion(current_setting('wirdlink.test_owner')::uuid);

set local role authenticated;
do $$ begin
  if wirdlink_private.account_is_active() then raise exception 'Deleting account is active'; end if;
  begin
    perform public.reserve_part(gen_random_uuid(), current_setting('wirdlink.test_other_wird')::uuid, 1, '');
    raise exception 'Deleting account reserved a part';
  exception when insufficient_privilege then null; end;
  begin
    insert into storage.objects (bucket_id, name)
    values ('wird-media', current_setting('wirdlink.test_owner') || '/forbidden.png');
    raise exception 'Deleting account uploaded media';
  exception when insufficient_privilege then null; end;
end $$;

reset role;
savepoint media_fixture;
select set_config('request.jwt.claims', '{}', true);
insert into storage.objects (bucket_id, name)
values ('wird-media', current_setting('wirdlink.test_owner') || '/test.png');
set local role service_role;
do $$ begin
  if (select count(*) from public.account_media_paths(current_setting('wirdlink.test_owner')::uuid)) <> 1 then
    raise exception 'Owned media not found';
  end if;
  if (select count(*) from public.account_media_paths(current_setting('wirdlink.test_other')::uuid)) <> 0 then
    raise exception 'Other media included';
  end if;
  begin
    perform public.purge_account_data(current_setting('wirdlink.test_owner')::uuid);
    raise exception 'Data purged before media removal';
  exception when sqlstate '55000' then null; end;
end $$;
rollback to savepoint media_fixture;
select set_config('request.jwt.claims', '{}', true);
set local role service_role;
select public.purge_account_data(current_setting('wirdlink.test_owner')::uuid);
select public.purge_account_data(current_setting('wirdlink.test_owner')::uuid);
reset role;
do $$ begin
  if exists (select 1 from public.wirds where owner_id = current_setting('wirdlink.test_owner')::uuid) then
    raise exception 'Owned wird remains';
  end if;
  if exists (select 1 from public.parts where participant_id = current_setting('wirdlink.test_owner')::uuid
    or wird_id = current_setting('wirdlink.test_owned_wird')::uuid) then raise exception 'Associated parts remain'; end if;
  if not exists (select 1 from public.wirds where id = current_setting('wirdlink.test_other_wird')::uuid) then
    raise exception 'Unrelated wird deleted';
  end if;
  if (select sum(quantity) from public.parts where wird_id = current_setting('wirdlink.test_other_wird')::uuid) <> 50 then
    raise exception 'Unrelated part changed';
  end if;
end $$;
delete from auth.users where id = current_setting('wirdlink.test_owner')::uuid;
set local role authenticated;
do $$ begin
  if wirdlink_private.account_is_active() then raise exception 'Deleted identity remains active'; end if;
end $$;
rollback;
select 'Account deletion checks passed; all fixtures rolled back.' as result;
