# Naive state charts

Mermaid `stateDiagram-v2` charts of Naive as it stands on `claude/mac-lifecycle` (commit 0762899), read from the code, not from the design docs. Created 2026-10-29.

## Method

Torian asked for Poteto's pstack state chart (github.com/poteto/plugins). That repository has no state chart skill or command: `pstack` ships architect, arena, figure-it-out, how, interrogate, tdd, why and principle skills, and the only mentions of state machines are review advice ("push the logic into a dedicated state machine"). Nothing was installed or run from it. The charts follow pstack's `how` method by hand: start from each entry point, follow the call chain to its effect, read the code rather than names, and note what a newcomer would get wrong.

## Charts

| File | Covers |
|---|---|
| [record-write.md](record-write.md) | `call(write)`: route, access, decision lock, schema, gate (refuse, draft, owner, class, holding decision), remote vs local, held drafts and variants, `mentura accept`, provenance, `around()` |
| [decisions.md](decisions.md) | Stored status (open, decided, deferred, withdrawn), propose and approve, and the derived render (now, waiting, later, overdue, stale, deferred, done, withdrawn) |
| [lifecycle.md](lifecycle.md) | The five phases and their gates, exit criteria in the telos, meet and advance, back and skip rules |
| [port.md](port.md) | A port plan item: move or leave, the apply precheck, rename, sources.json, trace |
| [releases.md](releases.md) | build, blocked, dry run, released, add, start, export; how each file is classified |

## Gaps and contradictions found

1. **Two ways to change phase, only one gated.** `naive phase <next>` goes through `lifecycle.advance()`, which checks exit criteria. `mentura phase <phase> --venture <id> --as person` (`interface/cli/freshness.mjs`) calls `freshness.phase()` directly: no exit-criteria check, no skip check, no `--reason` for going back. The lifecycle gate can be bypassed by anyone who types `--as person`.
2. **"Drafted" is not a decision status.** The brief's open -> drafted -> decided has no `drafted` in `decision-record.schema.json`; it is `open` with an agent-written `answer`, surfaced as `awaiting: "approval"`.
3. **Deferred and withdrawn have no command.** No CLI or function sets them; only a raw write of `decisions/[id]` does. `approve()` will decide a withdrawn or deferred decision without comment.
4. **An agent can write a decision straight to `decided`.** `decisions/[id]` is a writable route and `decision-record` has no `decision_class` in `data-model.json`, so unless the venture lists it in `fail_closed`, an agent's write lands as the record, bypassing `propose()` (which forces `open`) and `approve()`. `decisions()` reports it as an error only if `provenance.approved_by` is missing, and an agent can supply that field.
5. **Remote sources skip the local gate.** `holding()` and `gateWrite()` run only when the source is local. A gated record whose source is a GitHub repository is held only by the pull request, so `fail_closed`, owner rules and pinned-version refusals do not apply.
6. **`meet()` writes the telos without the schema.** It writes `telos.json` with `writeFileSync` and records provenance, skipping `validate.py`, the gate and the decision-class draft that a router write of `foundation/telos` would get.
7. **Phases listed in six files.** `lifecycle.mjs`, `need-now.mjs` and `router.mjs` read `phases.json`; `decisions.mjs`, `packages.mjs` and `check-team.mjs` hard-code the same five ids. They agree today, but a sixth phase would split them.
8. **Port apply is checked as a whole but not done as a whole.** The precheck covers every item first, but if a rename or `sources.json` write fails midway, earlier items are moved and marked done while later ones are not. Re-running is safe (done items are skipped), but there is no rollback.
9. **A release has no stale state.** Nothing marks `.release/` out of date when a frozen record changes after a build; `naive start` keeps serving it until the next build. `build` also accepts `MENTURA_ACTOR=agent` with no person check, though only confirmed records can enter.
10. **Variants cap.** `writeHeld` throws after 26 variants (a to z); the write returns an exception rather than a refusal with a fix.
