# Decisions

Source: `schema/decisions.mjs` (`decisions`, `propose`, `approve`, `holding`, `locked`, `actionFor`), `schema/decision-record.schema.json`, `schema/gate-drafts.mjs` (variants decisions), `interface/cli/mentura.mjs` (`propose`, `decide`).

The task brief names the states open -> drafted -> decided. The code stores four statuses (`open`, `decided`, `deferred`, `withdrawn`); "drafted" is not a status but `open` with an agent-written `answer` (`awaiting: "approval"`). The chart shows both the stored status and the derived `render`.

```mermaid
stateDiagram-v2
    [*] --> Open: person writes decisions/[id], or agent propose() (forced status open), or framework (root, foundation, variants)
    state Open {
        [*] --> Undrafted: answer null
        Undrafted --> Drafted: agent propose() with answer (awaiting approval)
        Drafted --> Drafted: agent re-propose (allowed while not decided)
    }
    Open --> Decided: person approve(by, answer?) - wording own | approved | changed, phase stamped
    Open --> Deferred: status set by a write (no command)
    Open --> Withdrawn: status set by a write (no command)
    Deferred --> Decided: approve() (only decided is refused)
    Withdrawn --> Decided: approve() (only decided is refused)
    Decided --> [*]
    note right of Decided
        propose() refuses to touch a decided decision;
        approve() refuses to decide twice.
        In discovery a decided decision is firmness "working", later "firm".
    end note
```

Derived render (computed every read, in this priority order):

```mermaid
stateDiagram-v2
    direction LR
    state status_check <<choice>>
    [*] --> status_check
    status_check --> withdrawn: status withdrawn
    status_check --> deferred: status deferred
    status_check --> stale: decided and parent approved after it
    status_check --> overdue: open and past due
    status_check --> done: decided
    status_check --> later: needed_in a later phase and no due
    status_check --> waiting: an ancestor is open and fail-closed
    status_check --> now: otherwise
```

Effects on other machines

- `waiting`, `stale`, or `open` + `fail-closed` on a record -> `holding()` turns an agent's write of that record into a draft (record-write chart, DecisionHold).
- Any status other than `decided`/`withdrawn` with `unlocks` -> `locked()` refuses agent writes and runs on those routes.
- A held write with variants creates a `variants-*` decision (`boundary: fail-open`); `settle()` approves it on accept.
