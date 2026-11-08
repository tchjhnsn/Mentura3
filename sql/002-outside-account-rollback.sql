-- Removes account isolation and leaves outside_log rows in place.
-- The owner runs this on the scratch database used for rehearsal. It does not drop outside_log.
-- The runtime revoke runs only when outside_host exists. A rehearsal login with another name,
-- or a second run after the functions are gone, still finishes.

do $$ begin
  if to_regprocedure('public.outside_log_account()') is not null then
    revoke all on function public.outside_log_account() from public;
  end if;
  if to_regprocedure('public.outside_log_authorize(text)') is not null
     and exists (select 1 from pg_catalog.pg_roles where rolname = 'outside_host') then
    revoke all on function public.outside_log_authorize(text) from outside_host;
    revoke all on function public.outside_log_account() from outside_host;
  end if;
end $$;

do $$ begin
  if to_regclass('public.outside_log') is not null then
    execute 'drop policy if exists outside_log_account on public.outside_log';
    execute 'alter table public.outside_log no force row level security';
    execute 'alter table public.outside_log disable row level security';
  end if;
end $$;

drop function if exists outside_log_authorize(text);
drop function if exists outside_log_account();
drop table if exists outside_log_grant;
drop table if exists outside_log_key;
drop extension if exists pgcrypto;
drop schema if exists outside_crypto;
