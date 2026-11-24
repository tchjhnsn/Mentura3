-- Outside host log.
-- This table is not naive_records and it is not an identity table.
-- Apply it to the database named by MENTURA_OUTSIDE_DATABASE_URL.
-- The runtime role may select and insert. It may not update or delete.
-- This file does not create a login, a password, a cloud project, or a database.

create table if not exists outside_log (
  account_id text not null check (account_id ~ '^[A-Za-z0-9_-]{1,80}$'),
  venture_id text not null check (venture_id ~ '^[a-z0-9][a-z0-9-]{0,40}$'),
  seq bigint not null check (seq > 0),
  prev_hash text not null check (prev_hash ~ '^[0-9a-f]{0,64}$'),
  line_hash text not null check (line_hash ~ '^[0-9a-f]{64}$'),
  line jsonb not null,
  written_at timestamptz not null default now(),
  primary key (account_id, venture_id, seq)
);

create unique index if not exists outside_log_cache_key
  on outside_log (account_id, venture_id, (line->>'key'))
  where line->>'kind' = 'cache' and coalesce(line->>'key', '') <> '';

-- This function calls no other function. PL/pgSQL does not record callees in pg_depend, so a
-- later edit must not add a call: the open check can see the owner of this function, not the
-- owner of a function named only inside the body.
create or replace function outside_log_append_only() returns trigger
language plpgsql
as $$
begin
  raise exception 'outside_log is append-only: % refused', tg_op;
end
$$;

drop trigger if exists outside_log_append_only on outside_log;
create trigger outside_log_append_only
  before update or delete on outside_log
  for each row execute function outside_log_append_only();

drop trigger if exists outside_log_no_truncate on outside_log;
create trigger outside_log_no_truncate
  before truncate on outside_log
  for each statement execute function outside_log_append_only();

-- Replica mode skips an ordinary trigger. Always means the trigger still fires when a login
-- has been granted SET on session_replication_role. Disabling a trigger remains the table owner's act.
alter table outside_log enable always trigger outside_log_append_only;
alter table outside_log enable always trigger outside_log_no_truncate;

revoke all on table outside_log from public;
