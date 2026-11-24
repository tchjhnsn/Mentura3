-- Removes tenant isolation and leaves naive_records rows in place.
-- The owner runs this on the scratch database used for rehearsal. It does not drop naive_records.
-- The runtime revoke runs only when mentura_console_tenant exists, matching the forward migration.
-- A rehearsal login with another name, or a second run after the functions are gone, still finishes.

do $$ begin
  if to_regprocedure('public.mentura_account()') is not null then
    revoke all on function public.mentura_account() from public;
  end if;
  if to_regprocedure('public.mentura_authorize(text)') is not null
     and exists (select 1 from pg_catalog.pg_roles where rolname = 'mentura_console_tenant') then
    revoke all on function public.mentura_authorize(text) from mentura_console_tenant;
  end if;
end $$;

do $$ begin
  if to_regclass('public.naive_records') is not null then
    execute 'drop policy if exists naive_records_tenant on public.naive_records';
    execute 'alter table public.naive_records no force row level security';
    execute 'alter table public.naive_records disable row level security';
  end if;
end $$;

drop function if exists mentura_authorize(text);
drop function if exists mentura_account();
drop table if exists mentura_tenant_grant;
drop table if exists mentura_tenant_key;
