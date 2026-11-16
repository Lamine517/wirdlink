-- Administrative test execution only. All synthetic users/content are rolled back.
begin;
select set_config('wirdlink.owner',gen_random_uuid()::text,true);
select set_config('wirdlink.other',gen_random_uuid()::text,true);
select set_config('wirdlink.guest',gen_random_uuid()::text,true);
select set_config('wirdlink.wird',gen_random_uuid()::text,true);
select set_config('wirdlink.guest_wird',gen_random_uuid()::text,true);
insert into auth.users(id,aud,role,is_anonymous) values
(current_setting('wirdlink.owner')::uuid,'authenticated','authenticated',false),
(current_setting('wirdlink.other')::uuid,'authenticated','authenticated',false),
(current_setting('wirdlink.guest')::uuid,'authenticated','authenticated',true);
insert into public.wirds(id,owner_id,request_id,title,target,recurrence,start_date,end_date,visibility,description,instructions) values
(current_setting('wirdlink.wird')::uuid,current_setting('wirdlink.owner')::uuid,gen_random_uuid(),'Private remembered title',1000,'Chaque vendredi',current_date,null,'private','Original description','Original instruction'),
(current_setting('wirdlink.guest_wird')::uuid,current_setting('wirdlink.guest')::uuid,gen_random_uuid(),'Synthetic anonymous owner',100,'Une fois',current_date,null,'public','','');
insert into wirdlink_private.access_codes(wird_id,owner_id,code) values(current_setting('wirdlink.wird')::uuid,current_setting('wirdlink.owner')::uuid,'2147');
insert into wirdlink_private.wird_grants(wird_id,user_id) values(current_setting('wirdlink.wird')::uuid,current_setting('wirdlink.other')::uuid);
insert into wirdlink_private.unlock_attempts(wird_id,user_id,failures) values(current_setting('wirdlink.wird')::uuid,current_setting('wirdlink.other')::uuid,1);
insert into wirdlink_private.unlock_global_attempts(wird_id,failures) values(current_setting('wirdlink.wird')::uuid,1);
insert into public.parts(wird_id,participant_id,request_id,quantity,name,finished,finished_at) values
(current_setting('wirdlink.wird')::uuid,current_setting('wirdlink.other')::uuid,gen_random_uuid(),100,'',false,null),
(current_setting('wirdlink.wird')::uuid,current_setting('wirdlink.other')::uuid,gen_random_uuid(),200,'',true,now());
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('wirdlink.other'),'role','authenticated','is_anonymous',false)::text,true);
do $$ begin
 if exists(select 1 from public.wird_titles where user_id=current_setting('wirdlink.owner')::uuid) then raise exception 'Private title suggestions leaked'; end if;
 if (public.read_wird(current_setting('wirdlink.wird')::uuid)->>'is_owner')::boolean is distinct from false then raise exception 'Non-owner marked owner'; end if;
 begin perform public.update_wird(current_setting('wirdlink.wird')::uuid,'{"title":"Intrusion","target":1000}'); raise exception 'Non-owner updated wird'; exception when insufficient_privilege then null; end;
 begin perform public.delete_wird(current_setting('wirdlink.wird')::uuid); raise exception 'Non-owner deleted wird'; exception when insufficient_privilege then null; end;
 begin insert into public.wird_titles(user_id,title) values(auth.uid(),'Injected'); raise exception 'Client inserted suggestion'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('wirdlink.guest'),'role','authenticated','is_anonymous',true)::text,true);
do $$ begin
 begin perform public.update_wird(current_setting('wirdlink.guest_wird')::uuid,'{"title":"Anonymous update","target":100}'); raise exception 'Anonymous owner updated wird'; exception when insufficient_privilege then null; end;
 begin perform public.delete_wird(current_setting('wirdlink.guest_wird')::uuid); raise exception 'Anonymous owner deleted wird'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('wirdlink.owner'),'role','authenticated','is_anonymous',false)::text,true);
do $$ declare result jsonb; draft jsonb; begin
 if (public.read_wird(current_setting('wirdlink.wird')::uuid)->>'is_owner')::boolean is distinct from true then raise exception 'Owner flag missing'; end if;
 if not exists(select 1 from public.wird_titles where title='Private remembered title') then raise exception 'Inserted title not remembered'; end if;
 begin perform public.update_wird(current_setting('wirdlink.wird')::uuid,'{"title":"Invalid target","target":299}'); raise exception 'Target below ongoing plus finished allowed'; exception when invalid_parameter_value then null; end;
 begin perform public.update_wird(current_setting('wirdlink.wird')::uuid,'{"title":"Invalid target","target":0}'); raise exception 'Zero target allowed'; exception when invalid_parameter_value then null; end;
 result:=public.update_wird(current_setting('wirdlink.wird')::uuid,jsonb_build_object('title',' Renamed private title ','target',300,'description','Changed','instructions','Optional instruction','visibility','public','startDate','2000-01-01','owner_id',current_setting('wirdlink.other')));
 if result->>'title' is distinct from 'Renamed private title' or (result->>'target')::integer is distinct from 300 then raise exception 'Owner update failed'; end if;
 if result->>'visibility' is distinct from 'private' or result->>'recurrence' is distinct from 'Chaque vendredi' or result->>'start_date' is distinct from current_date::text or result->>'end_date' is not null then raise exception 'Uneditable fields changed'; end if;
 if result->>'description' is distinct from 'Changed' or result->>'instructions' is distinct from 'Optional instruction' then raise exception 'Optional text update failed'; end if;
 if not exists(select 1 from public.wird_titles where title='Renamed private title') then raise exception 'Updated title not remembered'; end if;
 draft:=jsonb_build_object('title','RPC published suggestion','description','','target',100,'recurrence','Une fois','visibility','public','startDate',current_date::text,'endDate',null);
 perform public.publish_wird(gen_random_uuid(),draft);
 if not exists(select 1 from public.wird_titles where title='RPC published suggestion') then raise exception 'Published title not remembered'; end if;
 perform public.delete_wird(current_setting('wirdlink.wird')::uuid);
 if public.read_wird(current_setting('wirdlink.wird')::uuid) is not null then raise exception 'Deleted wird still readable'; end if;
 if not exists(select 1 from public.wird_titles where title='Renamed private title') then raise exception 'Deletion lost reusable suggestion'; end if;
end $$;
reset role;
do $$ begin
 if exists(select 1 from public.parts where wird_id=current_setting('wirdlink.wird')::uuid)
 or exists(select 1 from wirdlink_private.access_codes where wird_id=current_setting('wirdlink.wird')::uuid)
 or exists(select 1 from wirdlink_private.wird_grants where wird_id=current_setting('wirdlink.wird')::uuid)
 or exists(select 1 from wirdlink_private.unlock_attempts where wird_id=current_setting('wirdlink.wird')::uuid)
 or exists(select 1 from wirdlink_private.unlock_global_attempts where wird_id=current_setting('wirdlink.wird')::uuid) then raise exception 'Deleted wird retained dependent data'; end if;
end $$;
set local role anon;
select set_config('request.jwt.claims','{"role":"anon"}',true);
do $$ begin
 begin perform * from public.wird_titles; raise exception 'Anonymous visitor read title history'; exception when insufficient_privilege then null; end;
 begin perform public.delete_wird(current_setting('wirdlink.guest_wird')::uuid); raise exception 'Anonymous visitor deleted wird'; exception when insufficient_privilege then null; end;
end $$;
rollback;
select 'Wird management ownership, totals, suggestions privacy and deletion checks passed; fixtures rolled back.' as result;
