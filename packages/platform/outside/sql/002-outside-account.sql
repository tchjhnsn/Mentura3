-- Account isolation for outside_log. The owner applies this after 001-outside-log.sql.
-- It does not delete log rows. The runtime login is not created here and is not the table owner.
-- Rehearse on an empty scratch database. Do not apply this to a database that holds personal rows.
-- Rollback is 002-outside-account-rollback.sql.
--
--   signed session assertion
--        |
--        v
--   outside_log_authorize(assertion)   owner function, key table hidden from the runtime
--        |  checks the HMAC, writes one grant for this transaction only
--        v
--   row policy: account_id = outside_log_account()
--        |
--        v
--   runtime SELECT/INSERT see only that account
--
-- A different account id in the INSERT, a session variable the login sets, and an old grant id
-- do not choose another account. The grant is bound to this transaction and expires. Finished
-- grants are removed on the next call. The login cannot read the key or the grant table.
-- FORCE ROW LEVEL SECURITY applies the policy to the table owner. A superuser still bypasses it.
-- The same role must own outside_log and these two functions.

create schema if not exists outside_crypto;
revoke all on schema outside_crypto from public;
do $$ begin
  if exists (
    select 1
      from pg_catalog.pg_extension e
      join pg_catalog.pg_namespace n on n.oid = e.extnamespace
     where e.extname = 'pgcrypto' and n.nspname <> 'outside_crypto'
  ) then
    drop extension pgcrypto cascade;
  end if;
end $$;
create extension if not exists pgcrypto with schema outside_crypto;
revoke all on all functions in schema outside_crypto from public;

create table if not exists outside_log_key (
  id boolean primary key default true check (id),
  secret text not null
);

create table if not exists outside_log_grant (
  grant_id uuid primary key,
  account_id text not null,
  xact xid8 not null,
  expires_at timestamptz not null
);

revoke all on table outside_log_key from public;
revoke all on table outside_log_grant from public;

create or replace function outside_log_account() returns text
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select g.account_id
    from public.outside_log_grant g
   where g.grant_id::text = nullif(pg_catalog.current_setting('outside.grant', true), '')
     and g.xact = pg_catalog.pg_current_xact_id()
     and g.expires_at > pg_catalog.clock_timestamp()
$$;

create or replace function outside_log_authorize(assertion text) returns text
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
  delete from public.outside_log_grant g
   where g.expires_at <= pg_catalog.clock_timestamp()
      or pg_catalog.pg_xact_status(g.xact) is distinct from 'in progress';
  select k.secret into secret from public.outside_log_key k where k.id;
  if secret is null or assertion is null or pg_catalog.strpos(assertion, '.') = 0 then
    raise exception 'outside: assertion refused';
  end if;
  body := split_part(assertion, '.', 1);
  signature := split_part(assertion, '.', 2);
  if signature = '' or split_part(assertion, '.', 3) <> '' then
    raise exception 'outside: assertion refused';
  end if;
  mac := outside_crypto.hmac(pg_catalog.convert_to(body, 'utf8'), pg_catalog.convert_to(secret, 'utf8'), 'sha256');
  expected := pg_catalog.rtrim(pg_catalog.translate(pg_catalog.encode(mac, 'base64'), '+/', '-_'), '=');
  if pg_catalog.length(expected) <> pg_catalog.length(signature) or expected <> signature then
    raise exception 'outside: assertion refused';
  end if;
  padded := pg_catalog.translate(body, '-_', '+/');
  while pg_catalog.length(padded) % 4 <> 0 loop
    padded := padded || '=';
  end loop;
  payload := pg_catalog.convert_from(pg_catalog.decode(padded, 'base64'), 'utf8')::jsonb;
  account := payload #>> '{identity,userId}';
  expires := payload->>'expires';
  if account is null or account !~ '^[A-Za-z0-9_-]{1,80}$' then
    raise exception 'outside: assertion refused';
  end if;
  if expires is null or pg_catalog.to_timestamp(expires / 1000.0) <= pg_catalog.clock_timestamp() then
    raise exception 'outside: assertion refused';
  end if;
  delete from public.outside_log_grant g where g.xact = pg_catalog.pg_current_xact_id();
  grant_id := pg_catalog.gen_random_uuid();
  insert into public.outside_log_grant (grant_id, account_id, xact, expires_at)
  values (grant_id, account, pg_catalog.pg_current_xact_id(), pg_catalog.clock_timestamp() + interval '1 minute');
  perform pg_catalog.set_config('outside.grant', grant_id::text, true);
  return account;
end
$$;

revoke all on function outside_log_authorize(text) from public;
revoke all on function outside_log_account() from public;
grant execute on function outside_log_account() to public;

alter table outside_log enable row level security;
alter table outside_log force row level security;

drop policy if exists outside_log_account on outside_log;
create policy outside_log_account on outside_log
  for all
  using (account_id = public.outside_log_account())
  with check (account_id = public.outside_log_account());

do $$ begin
  if exists (select 1 from pg_catalog.pg_roles where rolname = 'outside_host') then
    grant execute on function outside_log_authorize(text) to outside_host;
    grant execute on function outside_log_account() to outside_host;
  end if;
end $$;
