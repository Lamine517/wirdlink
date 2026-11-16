-- Run as database administrator after migrations. Every fixture is rolled back.
begin;
select set_config('wirdlink.owner',gen_random_uuid()::text,true);
select set_config('wirdlink.reader',gen_random_uuid()::text,true);
select set_config('wirdlink.other',gen_random_uuid()::text,true);
select set_config('wirdlink.private',gen_random_uuid()::text,true);
select set_config('wirdlink.public',gen_random_uuid()::text,true);
insert into auth.users(id,aud,role,is_anonymous) values
(current_setting('wirdlink.owner')::uuid,'authenticated','authenticated',false),
(current_setting('wirdlink.reader')::uuid,'authenticated','authenticated',true),
(current_setting('wirdlink.other')::uuid,'authenticated','authenticated',false);
insert into public.wirds(id,owner_id,request_id,title,target,recurrence,start_date,end_date,visibility) values
(current_setting('wirdlink.private')::uuid,current_setting('wirdlink.owner')::uuid,gen_random_uuid(),'Private fixture',1000,'Une fois',current_date,null,'private'),
(current_setting('wirdlink.public')::uuid,current_setting('wirdlink.owner')::uuid,gen_random_uuid(),'Public fixture',1000,'Une fois',current_date,null,'public');
insert into wirdlink_private.access_codes(wird_id,owner_id,code) values
(current_setting('wirdlink.private')::uuid,current_setting('wirdlink.owner')::uuid,'4826');
insert into storage.objects(bucket_id,name) values
('wird-media',current_setting('wirdlink.owner')||'/private.png'),
('wird-media',current_setting('wirdlink.owner')||'/public.png');
update public.wirds set image_path=current_setting('wirdlink.owner')||'/private.png' where id=current_setting('wirdlink.private')::uuid;
update public.wirds set image_path=current_setting('wirdlink.owner')||'/public.png' where id=current_setting('wirdlink.public')::uuid;
set local role anon;
select set_config('request.jwt.claims','{"role":"anon"}',true);
do $$ begin
 if public.read_wird(current_setting('wirdlink.private')::uuid) is not null then raise exception 'Private DTO leaked'; end if;
 if public.read_wird(current_setting('wirdlink.public')::uuid)->>'title'<>'Public fixture' then raise exception 'Public DTO missing'; end if;
 if exists(select 1 from storage.objects where bucket_id='wird-media' and name=current_setting('wirdlink.owner')||'/private.png') then raise exception 'Private media leaked'; end if;
 if not exists(select 1 from storage.objects where bucket_id='wird-media' and name=current_setting('wirdlink.owner')||'/public.png') then raise exception 'Public media unavailable'; end if;
 if public.wird_participants(current_setting('wirdlink.private')::uuid)<>'[]'::jsonb then raise exception 'Private participants leaked'; end if;
 begin perform public.publication_receipt(current_setting('wirdlink.private')::uuid); raise exception 'Anonymous receipt allowed'; exception when insufficient_privilege then null; end;
end $$;
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('wirdlink.reader'),'role','authenticated','is_anonymous',true)::text,true);
do $$ declare result jsonb; part_id uuid; request_id uuid:=gen_random_uuid(); begin
 begin perform public.reserve_wird_part(gen_random_uuid(),current_setting('wirdlink.private')::uuid,100,''); raise exception 'Locked reservation allowed'; exception when insufficient_privilege then null; end;
 result:=public.unlock_wird(current_setting('wirdlink.private')::uuid,'bad');
 if result->>'error'<>'invalid_code' then raise exception 'Wrong code accepted'; end if;
 result:=public.unlock_wird(current_setting('wirdlink.private')::uuid,'4826');
 if result->'wird'->>'title'<>'Private fixture' then raise exception 'Unlock failed'; end if;
 if not exists(select 1 from public.wird_author(current_setting('wirdlink.private')::uuid)) then raise exception 'Unlocked author missing'; end if;
 if not exists(select 1 from storage.objects where name=current_setting('wirdlink.owner')||'/private.png') then raise exception 'Unlocked media missing'; end if;
 result:=public.reserve_wird_part(request_id,current_setting('wirdlink.private')::uuid,100,'Test');
 part_id:=(result->'part'->>'id')::uuid;
 if part_id is null or (result->'wird'->>'reserved')::integer<>100 then raise exception 'Reservation DTO incorrect'; end if;
 if public.reserve_wird_part(request_id,current_setting('wirdlink.private')::uuid,100,'Test')->'part'->>'id'<>part_id::text then raise exception 'Retry duplicated reservation'; end if;
 begin perform public.reserve_wird_part(request_id,current_setting('wirdlink.private')::uuid,99,'Test'); raise exception 'Changed retry allowed'; exception when invalid_parameter_value then null; end;
 begin perform public.reserve_wird_part(gen_random_uuid(),current_setting('wirdlink.private')::uuid,901,''); raise exception 'Overflow allowed'; exception when invalid_parameter_value then null; end;
 result:=public.finish_wird_part(part_id);
 if (result->'wird'->>'completed')::integer<>100 or (result->'wird'->>'reserved')::integer<>0 then raise exception 'Finished totals incorrect'; end if;
 if public.finish_wird_part(part_id)<>result then raise exception 'Finish retry changed result'; end if;
 if jsonb_array_length(public.wird_participants(current_setting('wirdlink.private')::uuid))<>1 then raise exception 'Participants missing'; end if;
 if public.publication_receipt(current_setting('wirdlink.private')::uuid) is not null then raise exception 'Non-owner receipt allowed'; end if;
end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('wirdlink.other'),'role','authenticated','is_anonymous',false)::text,true);
do $$ declare i integer; begin
 if public.read_wird(current_setting('wirdlink.private')::uuid) is not null then raise exception 'Grant leaked between users'; end if;
 for i in 1..5 loop
 if public.unlock_wird(current_setting('wirdlink.private')::uuid,'bad')->>'error'<>'invalid_code' then raise exception 'Unexpected early throttle'; end if;
 end loop;
 if public.unlock_wird(current_setting('wirdlink.private')::uuid,'4826')->>'error'<>'rate_limited' then raise exception 'Per-user throttle bypassed'; end if;
end $$;
reset role;
do $$ begin
 if (select failures from wirdlink_private.unlock_attempts where wird_id=current_setting('wirdlink.private')::uuid and user_id=current_setting('wirdlink.other')::uuid)<>5 then raise exception 'Failure increments rolled back'; end if;
end $$;
-- Reset only the per-user window and simulate the global threshold; correct codes are throttled too.
update wirdlink_private.unlock_attempts set window_started=now()-interval '16 minutes' where user_id=current_setting('wirdlink.other')::uuid;
update wirdlink_private.unlock_global_attempts set failures=100 where wird_id=current_setting('wirdlink.private')::uuid;
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('wirdlink.other'),'role','authenticated','is_anonymous',false)::text,true);
do $$ begin
 if public.unlock_wird(current_setting('wirdlink.private')::uuid,'4826')->>'error'<>'rate_limited' then raise exception 'Global throttle bypassed'; end if;
end $$;
reset role;
update wirdlink_private.unlock_global_attempts set window_started=now()-interval '16 minutes' where wird_id=current_setting('wirdlink.private')::uuid;
set local role authenticated;
do $$ begin
 if public.unlock_wird(current_setting('wirdlink.private')::uuid,'4826')->'wird' is null then raise exception 'Throttle window did not expire'; end if;
end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('wirdlink.owner'),'role','authenticated','is_anonymous',false)::text,true);
do $$ declare draft jsonb; published uuid; request_id uuid:=gen_random_uuid(); begin
 if public.publication_receipt(current_setting('wirdlink.private')::uuid)->>'accessCode'<>'4826' then raise exception 'Owner receipt missing'; end if;
 draft:=jsonb_build_object('title',' Trimmed publication ','target',1000,'recurrence','Une fois','startDate',current_date::text,'endDate','','visibility','public');
 published:=public.publish_wird(request_id,draft);
 if published is null or public.read_wird(published)->>'end_date' is not null then raise exception 'Optional end date rejected'; end if;
 if public.publish_wird(request_id,draft||'{"title":"Trimmed publication","endDate":null}'::jsonb)<>published then raise exception 'Normalized retry failed'; end if;
 begin perform public.publish_wird(gen_random_uuid(),draft||jsonb_build_object('startDate',(current_date-2)::text)); raise exception 'Old start date accepted'; exception when invalid_parameter_value then null; end;
 if public.publish_wird(gen_random_uuid(),draft||jsonb_build_object('startDate',(current_date-1)::text)) is null then raise exception 'Timezone start date rejected'; end if;
 begin perform public.publish_wird(gen_random_uuid(),draft||jsonb_build_object('imagePath',current_setting('wirdlink.owner')||'/missing.png')); raise exception 'Missing media accepted'; exception when invalid_parameter_value then null; end;
 begin perform public.publish_wird(gen_random_uuid(),draft||jsonb_build_object('imagePath',current_setting('wirdlink.other')||'/foreign.png')); raise exception 'Foreign media accepted'; exception when invalid_parameter_value then null; end;
end $$;
reset role;
-- New private state must not prevent account purge.
select wirdlink_private.prepare_account_deletion(current_setting('wirdlink.other')::uuid);
select wirdlink_private.purge_account_data(current_setting('wirdlink.other')::uuid);
delete from auth.users where id=current_setting('wirdlink.other')::uuid;
rollback;
select 'Connected publication checks passed; all fixtures rolled back.' as result;
