-- Run as database administrator in an isolated transaction. No messages sent.
begin;
select set_config('wirdlink.test_owner', gen_random_uuid()::text, true);
select set_config('wirdlink.test_participant', gen_random_uuid()::text, true);
select set_config('wirdlink.test_other', gen_random_uuid()::text, true);
select set_config('wirdlink.test_request', gen_random_uuid()::text, true);
select set_config('wirdlink.test_part_request', gen_random_uuid()::text, true);
insert into auth.users (id, aud, role, is_anonymous)
values (current_setting('wirdlink.test_owner')::uuid, 'authenticated', 'authenticated', false),
  (current_setting('wirdlink.test_participant')::uuid, 'authenticated', 'authenticated', true),
  (current_setting('wirdlink.test_other')::uuid, 'authenticated', 'authenticated', true);
insert into storage.objects (bucket_id, name)
values ('wird-media', current_setting('wirdlink.test_owner') || '/policy-test.png');
select set_config('wirdlink.test_draft', jsonb_build_object(
  'title', 'Test transactionnel', 'description', '', 'instructions', 'Consigne facultative',
  'target', 1000, 'recurrence', 'Une fois', 'visibility', 'public',
  'startDate', current_date::text, 'endDate', current_date::text,
  'imagePath', null, 'audioPath', null)::text, true);

set local role authenticated;
select set_config('request.jwt.claims', jsonb_build_object('sub', current_setting('wirdlink.test_owner'),
  'role', 'authenticated', 'is_anonymous', false)::text, true);
select set_config('wirdlink.test_wird', public.publish_wird(
  current_setting('wirdlink.test_request')::uuid, current_setting('wirdlink.test_draft')::jsonb)::text, true);
do $$ begin
  if not exists (select 1 from storage.objects where bucket_id = 'wird-media'
    and name = current_setting('wirdlink.test_owner') || '/policy-test.png') then
    raise exception 'Owner cannot read own media';
  end if;
  if public.publish_wird(current_setting('wirdlink.test_request')::uuid,
    current_setting('wirdlink.test_draft')::jsonb)::text <> current_setting('wirdlink.test_wird') then
    raise exception 'Publication retry created a duplicate';
  end if;
  begin
    perform public.publish_wird(current_setting('wirdlink.test_request')::uuid,
      current_setting('wirdlink.test_draft')::jsonb || '{"target":2000}'::jsonb);
    raise exception 'Publication request reuse was accepted';
  exception when sqlstate '22023' then null; end;
  begin
    update public.wirds set target = 1;
    raise exception 'Direct mutation was permitted';
  exception when insufficient_privilege then null; end;
end $$;
select set_config('wirdlink.test_private', public.publish_wird(gen_random_uuid(),
  current_setting('wirdlink.test_draft')::jsonb || '{"visibility":"private"}'::jsonb)::text, true);

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
do $$ begin
  if (select count(id) from public.wirds where id = current_setting('wirdlink.test_wird')::uuid) <> 1 then
    raise exception 'Public wird is unreadable';
  end if;
  if exists (select id from public.wirds where id = current_setting('wirdlink.test_private')::uuid) then
    raise exception 'Private wird leaked';
  end if;
  begin
    perform owner_id from public.wirds;
    raise exception 'Owner identifier leaked';
  exception when insufficient_privilege then null; end;
  begin
    perform public.reserve_part(gen_random_uuid(), current_setting('wirdlink.test_wird')::uuid, 1, '');
    raise exception 'Unauthenticated reservation accepted';
  exception when insufficient_privilege then null; end;
end $$;

set local role authenticated;
select set_config('request.jwt.claims', jsonb_build_object('sub', current_setting('wirdlink.test_participant'),
  'role', 'authenticated', 'is_anonymous', true)::text, true);
do $$ begin
  if exists (select 1 from storage.objects where bucket_id = 'wird-media'
    and name = current_setting('wirdlink.test_owner') || '/policy-test.png') then
    raise exception 'Another participant can read private media';
  end if;
  begin
    insert into storage.objects (bucket_id, name)
    values ('wird-media', current_setting('wirdlink.test_participant') || '/anonymous.png');
    raise exception 'Anonymous media upload permitted';
  exception when insufficient_privilege then null; end;
  begin
    perform public.publish_wird(gen_random_uuid(), current_setting('wirdlink.test_draft')::jsonb);
    raise exception 'Anonymous participant published';
  exception when insufficient_privilege then null; end;
  begin
    perform public.reserve_part(gen_random_uuid(), current_setting('wirdlink.test_private')::uuid, 1, '');
    raise exception 'Private reservation accepted without access';
  exception when insufficient_privilege then null; end;
  begin
    perform public.reserve_part(gen_random_uuid(), current_setting('wirdlink.test_wird')::uuid, 0, '');
    raise exception 'Zero quantity accepted';
  exception when sqlstate '22023' then null; end;
end $$;
select set_config('wirdlink.test_part', public.reserve_part(current_setting('wirdlink.test_part_request')::uuid,
  current_setting('wirdlink.test_wird')::uuid, 600, 'Participant fictif')::text, true);
do $$ begin
  if public.reserve_part(current_setting('wirdlink.test_part_request')::uuid,
    current_setting('wirdlink.test_wird')::uuid, 600, 'Participant fictif')::text <> current_setting('wirdlink.test_part') then
    raise exception 'Reservation retry created a duplicate';
  end if;
  begin
    perform public.reserve_part(gen_random_uuid(), current_setting('wirdlink.test_wird')::uuid, 401, '');
    raise exception 'Overbooking accepted';
  exception when sqlstate '22023' then null; end;
end $$;
select public.finish_part(current_setting('wirdlink.test_part')::uuid);
select public.finish_part(current_setting('wirdlink.test_part')::uuid);
do $$ begin
  if (select sum(quantity) from public.parts where wird_id = current_setting('wirdlink.test_wird')::uuid and finished) <> 600 then
    raise exception 'Completion counted twice';
  end if;
end $$;

select set_config('request.jwt.claims', jsonb_build_object('sub', current_setting('wirdlink.test_other'),
  'role', 'authenticated', 'is_anonymous', true)::text, true);
do $$ begin
  if exists (select id from public.parts where id = current_setting('wirdlink.test_part')::uuid) then
    raise exception 'Another participant can read the part';
  end if;
  begin
    perform public.finish_part(current_setting('wirdlink.test_part')::uuid);
    raise exception 'Another participant finished the part';
  exception when insufficient_privilege then null; end;
  begin
    perform code from wirdlink_private.access_codes;
    raise exception 'Private access code leaked';
  exception when insufficient_privilege then null; end;
end $$;
select public.reserve_part(gen_random_uuid(), current_setting('wirdlink.test_wird')::uuid, 400, '');
do $$ begin
  begin
    perform public.reserve_part(gen_random_uuid(), current_setting('wirdlink.test_wird')::uuid, 1, '');
    raise exception 'Full wird still accepts reservations';
  exception when sqlstate '22023' then null; end;
end $$;
reset role;
do $$ begin
  if not exists (select 1 from storage.objects where bucket_id = 'wird-media'
    and name = current_setting('wirdlink.test_owner') || '/policy-test.png') then
    raise exception 'Media fixture is missing';
  end if;
  if (select sum(quantity) from public.parts where wird_id = current_setting('wirdlink.test_wird')::uuid) <> 1000 then
    raise exception 'Reserved count is inconsistent';
  end if;
  if (select count(*) from public.wirds where owner_id = current_setting('wirdlink.test_owner')::uuid) <> 2 then
    raise exception 'Duplicate publication exists';
  end if;
  if not exists (select 1 from storage.buckets where id = 'wird-media' and not public and file_size_limit = 10485760) then
    raise exception 'Media bucket is not private or bounded';
  end if;
end $$;
rollback;
select 'Publication, permissions, idempotence and quantity checks passed; fixtures rolled back.' as result;
