-- Rollback of 003-team-tenant.sql: mentura_authorize binds the person's id again, as 002-tenant-isolation.sql made
-- it. Businesses of teams other than personal ones become unreachable until 003 is applied again; no row is deleted.

create or replace function mentura_authorize(assertion text) returns text
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  secret text;
  body text;
  padded text;
  signature text;
  mac bytea;
  expected text;
  payload jsonb;
  account text;
  expires numeric;
  grant_id uuid;
begin
  select k.secret into secret from public.mentura_tenant_key k where k.id;
  if secret is null or assertion is null or pg_catalog.strpos(assertion, '.') = 0 then
    raise exception 'mentura: assertion refused';
  end if;
  body := split_part(assertion, '.', 1);
  signature := split_part(assertion, '.', 2);
  if signature = '' or split_part(assertion, '.', 3) <> '' then
    raise exception 'mentura: assertion refused';
  end if;
  mac := public.hmac(pg_catalog.convert_to(body, 'utf8'), pg_catalog.convert_to(secret, 'utf8'), 'sha256');
  expected := pg_catalog.rtrim(pg_catalog.translate(pg_catalog.encode(mac, 'base64'), '+/', '-_'), '=');
  if pg_catalog.length(expected) <> pg_catalog.length(signature) or expected <> signature then
    raise exception 'mentura: assertion refused';
  end if;
  padded := pg_catalog.translate(body, '-_', '+/');
  while pg_catalog.length(padded) % 4 <> 0 loop
    padded := padded || '=';
  end loop;
  payload := pg_catalog.convert_from(pg_catalog.decode(padded, 'base64'), 'utf8')::jsonb;
  account := payload #>> '{identity,userId}';
  expires := payload->>'expires';
  if account is null or account !~ '^[A-Za-z0-9_-]{1,80}$' then
    raise exception 'mentura: assertion refused';
  end if;
  if expires is null or pg_catalog.to_timestamp(expires / 1000.0) <= pg_catalog.clock_timestamp() then
    raise exception 'mentura: assertion refused';
  end if;
  delete from public.mentura_tenant_grant where expires_at <= pg_catalog.clock_timestamp();
  grant_id := pg_catalog.gen_random_uuid();
  insert into public.mentura_tenant_grant (grant_id, account_id, expires_at)
  values (grant_id, account, pg_catalog.clock_timestamp() + interval '1 minute');
  perform pg_catalog.set_config('mentura.grant', grant_id::text, true);
  return account;
end
$$;

revoke all on function mentura_authorize(text) from public;
do $$ begin
  if exists (select 1 from pg_catalog.pg_roles where rolname = 'mentura_console_tenant') then
    grant execute on function mentura_authorize(text) to mentura_console_tenant;
  end if;
end $$;
