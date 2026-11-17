-- The pronunciation-length replacement stored the payment-number pattern with an extra
-- backslash, so a real 9-digit number no longer passed. Digits are written without a slash.
create or replace function wirdlink_private.valid_setting(p_key text, p jsonb) returns boolean
language sql immutable set search_path = '' as $$
  select coalesce(case p_key
    when 'pass' then wirdlink_private.valid_pass_settings(p)
    when 'donations' then
      wirdlink_private.json_keys(p, array['enabled','amounts','min','max','number','wave','orange'])
      and jsonb_typeof(p->'enabled') = 'boolean' and jsonb_typeof(p->'wave') = 'boolean'
      and jsonb_typeof(p->'orange') = 'boolean'
      and jsonb_typeof(p->'amounts') = 'array'
      and jsonb_array_length(p->'amounts') between 1 and 6
      and (select bool_and(wirdlink_private.json_int(a, 1, 10000000)) from jsonb_array_elements(p->'amounts') a)
      and wirdlink_private.json_int(p->'min', 1, 10000000)
      and wirdlink_private.json_int(p->'max', 1, 10000000)
      and (p->>'min')::bigint <= (p->>'max')::bigint
      and jsonb_typeof(p->'number') = 'string' and p->>'number' ~ '^[0-9]{9}$'
    when 'templates' then
      jsonb_typeof(p) = 'array' and jsonb_array_length(p) <= 12
      and (select coalesce(bool_and(
          jsonb_typeof(t->'id') = 'string' and t->>'id' ~ '^[a-z0-9-]{1,40}$' and t->>'id' <> 'custom'
          and wirdlink_private.json_text(t->'title', 100) and btrim(t->>'title') <> ''
          and wirdlink_private.json_int(t->'target', 1, 2147483647)
          and t->>'icon' in ('prayer','book','heart','tap','hand','calendar','clock','bell','users')
          and (
            wirdlink_private.json_keys(t, array['id','title','target','icon'])
            or (
              wirdlink_private.json_keys(t, array['id','title','target','icon','text'])
              and wirdlink_private.json_keys(t->'text', array['fr','en','ar'])
              and (select bool_and(wirdlink_private.json_text(t->'text'->l, 1000))
                from unnest(array['fr','en','ar']) l)
            )
            or (
              wirdlink_private.json_keys(t, array['id','title','target','icon','text'])
              and wirdlink_private.json_keys(t->'text', array['ar','en','fr','latin'])
              and wirdlink_private.json_text(t->'text'->'latin', 1000)
              and (select bool_and(wirdlink_private.json_text(t->'text'->l, 1000))
                from unnest(array['fr','en','ar']) l)
            )
          )), true)
        from jsonb_array_elements(p) t)
      and (select count(distinct t->>'id') = count(*) from jsonb_array_elements(p) t)
    when 'features' then
      wirdlink_private.json_keys(p, array['tasbih','photo','audio'])
      and (select bool_and(jsonb_typeof(p->k) = 'boolean') from unnest(array['tasbih','photo','audio']) k)
    when 'texts' then
      wirdlink_private.json_keys(p, array['announcement','help','conditions'])
      and wirdlink_private.json_keys(p->'announcement', array['active','fr','en','ar'])
      and jsonb_typeof(p->'announcement'->'active') = 'boolean'
      and (select bool_and(wirdlink_private.json_text(p->'announcement'->l, 500)) from unnest(array['fr','en','ar']) l)
      and (select bool_and(wirdlink_private.json_keys(p->s, array['fr','en','ar'])
          and (select bool_and(wirdlink_private.json_text(p->s->l, 6000)) from unnest(array['fr','en','ar']) l))
        from unnest(array['help','conditions']) s)
    else false end, false);
$$;
