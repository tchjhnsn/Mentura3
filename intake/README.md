# platform/intake

Raw intake for triage (Naive `docs/design/RAW_TRIAGE_2026-11-09.md`, item 5). A raw entry is an ordinary record row in the tenant's store (`naive_records`, [../connectors/postgres.ts](../connectors/postgres.ts)), so it is append-only and hash-chained already. This folder wakes triage when one lands, and makes sure exactly one worker triages it.

| File | What it does |
|---|---|
| `raw-intake.ts` | `INTAKE_SCHEMA`: the append-only claims table `naive_triage_claims` (one row per tenant and raw path, inserted once) and a trigger on `naive_records` that sends `NOTIFY naive_raw, '<tenant>:<path>'` for a raw entry. `claim` inserts a claim and is true for exactly one caller. `unclaimed` lists raw entries with no claim. `startWorker` listens first, sweeps the unclaimed entries, then claims and triages each notified one, one at a time; triage is injected, so nothing here calls a model. `pgListener` holds `LISTEN` on one node-postgres connection |
| `raw-intake-eval.ts` | Two workers on one tenant triage each raw entry once; records that are not raw entries and other tenants' entries are left alone; claims refuse update and delete; a failed triage keeps its claim and is reported. Runs on a real Postgres named by `MENTURA_EVAL_DATABASE_URL` (a service in CI); without it, only the path checks run |

A raw entry is `raw/dump/<id>.md` (a capture in the founder's own words) or `raw/sources/<id>/text.md` (a reference's text), at the tenant root or under a venture. `source.json` is not an entry; its `text.md` is.

The schema is applied by the database owner, like the connector's: the trigger is on `naive_records`, which the runtime role cannot alter. `LISTEN` needs a session, so `pgListener` takes the direct (unpooled) connection string.

Not built yet: the triage graph the worker hands entries to (item 4), a CLI that starts a worker, a Neon Function on insert in place of the worker, and channels other than a store write (the GitHub push webhook is item 6).
