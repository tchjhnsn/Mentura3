# Outside host operations

**Moved, 2026-11-24.** This package came to `packages/platform/outside/` in tchjhnsn/reflect from tchjhnsn/mentura. Mentura's console is retired, so where this page names `console/`, read it as the history of that console: the bridge it used is now `../bridge/`, and the Venture Studio in Reflect's `web/` takes the console's place (not built yet). The thirteen function ids now come from Naive's `departments.json`, not the EE-090 decision text.

This package has no network client and no deployment of its own. It runs inside the process that constructs `openToolHost`.

## Secrets

Create two files outside every account workspace. Mode `0600`. Owner is the user that runs the host. Do not export the file contents as `OUTSIDE_SIGNING_KEY` or `OUTSIDE_FIXTURE_HMAC`.

| File | Passed as | Use |
|---|---|---|
| Signing key | `signingKeyFile` | Held-write signatures |
| Inbound HMAC | `inboundKeyFile` | `receive` only |

The host does not read `process.env` for these values. Do not put the key material in the environment. A function agent is not a caller. Clearing environment variables inside the agent process is not the boundary, and this package does not do that.

## State

The local console store is a directory. `console/README.md` serves that process with `npm start` on `127.0.0.1`. Account files live on that machine, at `console/.data/workspace/.accounts/<Better Auth session user id>/` or under `NAIVE_CONSOLE_WORKSPACE`. The local outside log is `<that account directory>/outside/<venture id>/events.jsonl`.

The local log refuses a symlink or a hard link on that directory, on `events.jsonl`, and on the fixture outbox. `knowledge` and `sources.json` must be a real directory and a regular file. Caller errors do not include file text. That disk is not a hosted production store. A Functions disk would not keep this log.

## Hosted log

The hosted log is `outside_log` in the database named by `MENTURA_OUTSIDE_DATABASE_URL`. The schema is `sql/001-outside-log.sql`. Its SHA-256 is `1c8a73209ede05dffb3f076f36fe98e85dd820c9a479059f219b3b69ac6cf06a`. The previous file hash `6ce0c452ad0db32b6ec9ee0ab22640e31bafc27c0acdda1510aa3156d0db45c5` is not this schema. A rehearsal that applied that file has to apply this one. The triggers are enabled always, so replica mode does not skip them. No production outside database is set up. This process does not create a Neon project, a role password, or the database. The owner applies that file to a database that is not the tenant record store (`MENTURA_DATABASE_URL`, table `naive_records`) and not the identity store (`MENTURA_IDENTITY_DATABASE_URL` or `MENTURA_AUTH_DATABASE_URL`). A hosted origin must set those two URLs so the runtime can prove the outside database is a different database. The runtime role receives `select` and `insert` on `outside_log` only. It does not receive `update`, `delete`, or `truncate`. It must not own the table or `outside_log_append_only`, it must not be a superuser, and it must not be granted `set` on `session_replication_role`. The principal is the authenticated login, `session_user`. A role default can make `current_user` a safe role while that login stays dangerous, and `set role none` returns to the login. The log opens only when `session_user` is that login and has the runtime contract and nothing else. It is not a superuser and cannot create roles, databases, or replication. It is a member of no other role, so `pg_execute_server_program` and membership in the table owner are both refused. It cannot create objects in a schema. On `outside_log` it has `select` and `insert` only. `sql/002-outside-account.sql`, SHA-256 `4796374ece6a393e40f2d7d960604f17ccfb0be356100788df9d2a7e48873b82`, forces a row policy: a row is visible or insertable only for the account inside the signed session assertion. The owner inserts that assertion key into `outside_log_key`. The runtime cannot read that table or `outside_log_grant`. A grant is bound to the transaction that created it, expires after one minute, and finished grants are deleted on the next call. `sql/002-outside-account-rollback.sql`, SHA-256 `002bfddaaaf41983bfea160ac1e899fdf6a8806049844f7e6a0cebb8b45cfb57`, removes the policy and those tables and does not delete `outside_log` rows. It revokes `outside_host` only when that role exists. Apply both on a scratch database first. This process does not apply them to a database that holds personal rows. The two account functions are allowed only when the table owner owns them, `outside_log_account()` is sql with no arguments, `outside_log_authorize(text)` is plpgsql, both return text, and their only setting is `search_path=pg_catalog, public`. A line signed for another account still does not verify. It cannot set `session_replication_role`. It does not own the table, its schema, this database, or a trigger function on the table. It cannot execute any other security-definer function, or a function in an untrusted language, outside `pg_catalog` and `information_schema`. A superuser can still change those system schemas. The check does not remove privileges. It refuses to open, and the next open checks again. The trigger function calls no other function. The file log still cannot refuse deletion of a later line. That limit is the file, not this table. The triggers refuse `update`, `delete`, and `truncate` for the table owner as well. An owner who can disable those triggers can still remove rows. That is the owner's control, not the runtime role's. No grant is given on `naive_records` or any `identity_` table.

```sql
grant connect on database outside to outside_host;
grant usage on schema public to outside_host;
grant select, insert on outside_log to outside_host;
grant execute on function outside_log_authorize(text), outside_log_account() to outside_host;
```

Do not grant that role membership in any other role, `set` on `session_replication_role`, or `execute` on any other security-definer function. Do not make it the owner of `outside_log`, `outside_log_append_only`, or the account functions. The same role owns the table and those two functions, and that role can execute `outside_crypto.hmac`. The runtime cannot.

`node outside/postgres-log.test.ts` applies the file only to a loopback database. It creates `mentura_outside_test` on the server `MENTURA_EVAL_DATABASE_URL` names when `MENTURA_OUTSIDE_DATABASE_URL` is unset. It does not apply the file to Neon.

The Naive workspace that `console/lib/bridge.mjs` reads from the console disk is a different store. This package does not move that workspace.

On the local console machine, `mkdir` of the lock directory is the lock. Two processes on that machine take it one at a time. A lock older than 15 seconds is removed so a crashed process does not stick. Do not put this directory on a share where `mkdir` is not atomic. Do not commit the log.

## Rollback

Revert the commit that added `outside/`. Existing log files remain on disk and are ignored by a process that no longer calls the host. The next version refuses a log it does not understand by failing the JSON parse. There is no migration. Delete a venture's `outside/<venture id>/` directory only when a person has decided the receipts can go. Deletion is not part of rollback.

To stop a held write without deploying, call `submit` with `kind: "revoke"` on that authorization id, from a person `personMayApprove` accepts. To stop reads, `disconnect`. `delete-connection` clears secret names on the folded connection and keeps receipts. It does not delete the key files.

## Key rotation

Replace the signing file. Proofs and held signatures from the old key fail closed. In-flight approvals must be staged again. A held line also fails closed if its expiry, revocation, connection, or authorization id is edited. The host does not approve that line. Connection lines are signed, including the fixture, the lifecycle, and the previous log line. An appended change, or a copy of an older signed line, does not replace the current connection. Deleting a later line from the file leaves the earlier signature, and this file log cannot refuse that deletion. An append-only hosted table is the control for a deleted line. No database is provisioned. The Neon plan needs a cost decision, and this process does not change Neon. Replace the inbound file. Events signed with the old key are rejected and not appended.

## What a deploy does not do

It does not send mail, money, or posts. It does not open GitHub. It does not change PR 275's signup or profile files. It does not register a store connector.
