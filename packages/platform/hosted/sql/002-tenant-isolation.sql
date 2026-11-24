-- Tenant isolation for naive_records. The owner applies this after connectors/postgres.ts SCHEMA.
-- It does not delete rows. The runtime login is not created here and is not the table owner.
-- Rehearse on an empty scratch database. Do not apply this to a database that already holds personal rows
-- until that rehearsal has been read. Rollback is 002-tenant-isolation-rollback.sql.
--
--   signed assertion
--        |
--        v
--   mentura_authorize(assertion)     owner function, key table hidden from the runtime
--        |  checks the HMAC, writes an unguessable grant, SET LOCAL only
--        v
--   row policy: tenant = mentura_account()
--        |
--        v
--   runtime SELECT/INSERT see only that account
--
-- A tenant id in the INSERT, a session variable the login sets itself, and SET ROLE do not choose
-- another account. The login cannot read the key or the grant table. The table owner is not the
-- runtime. FORCE ROW LEVEL SECURITY applies the policy to the owner as well. A superuser still
-- bypasses row security; the runtime must not be a superuser.

create extension if not exists pgcrypto;

create table if not exists mentura_tenant_key (
  id boolean primary key default true check (id),
  secret text not null
);

create table if not exists mentura_tenant_grant (
  grant_id uuid primary key,
  account_id text not null,
  expires_at timestamptz not null
);

revoke all on table mentura_tenant_key from public;
revoke all on table mentura_tenant_grant from public;

create or replace function mentura_account() returns text
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select g.account_id
    from public.mentura_tenant_grant g
   where g.grant_id::text = nullif(pg_catalog.current_setting('mentura.grant', true), '')
     and g.expires_at > pg_catalog.clock_timestamp()
$$;

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
grant execute on function mentura_account() to public;

alter table naive_records enable row level security;
alter table naive_records force row level security;

drop policy if exists naive_records_tenant on naive_records;
create policy naive_records_tenant on naive_records
  for all
  using (tenant = public.mentura_account())
  with check (tenant = public.mentura_account());

do $$ begin
  if exists (select 1 from pg_catalog.pg_roles where rolname = 'mentura_console_tenant') then
    grant execute on function mentura_authorize(text) to mentura_console_tenant;
  end if;
end $$;
