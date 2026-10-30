# Record write flow

Source: `interface/router.mjs` `callInAction` (write branch), `interface/gate-hooks.mjs`, `schema/gate.mjs` `evaluate`, `schema/gate-drafts.mjs`, `schema/decisions.mjs` `holding`/`locked`, `interface/cli/mentura.mjs` `accept`.

```mermaid
stateDiagram-v2
    [*] --> Resolve: call(route, write, input, actor)
    Resolve --> Refused: no route / no write action / no venture
    Resolve --> Access
    Access --> Refused: team-plan routes deny write
    Access --> Lock: allowed
    Lock --> Locked: actor != person and an undecided decision unlocks this route (EE-058)
    Lock --> Validate: person, or no lock
    Locked --> [*]: fix = mentura decide ... then retry

    Validate --> Refused: no input / bad id / raw record already exists
    Validate --> SchemaCheck
    SchemaCheck --> Refused: validate.py fails on scratch copy
    SchemaCheck --> Gate: matches schema

    state Gate {
        [*] --> Holding: local source, actor = agent
        Holding --> Verdict
        Verdict: gateWrite / evaluate()<br/>pinned-version, access, fail_closed, config + package rules
        Verdict --> GateRefuse: then = refuse (applies to persons too)
        Verdict --> GateHold: then = draft or owner (agent only), or broken naive.config.json
        Verdict --> ClassHold: data-model decision class escalate or recommend-approve (agent only)
        Verdict --> DecisionHold: holding() - open fail-closed, waiting or stale decision on this record
        Verdict --> GatePass: pass, or actor = person
    }
    GateRefuse --> Refused

    Gate --> Remote: source is not local
    Remote --> Refused: connector writes = none
    Remote --> PullRequest: connector writes = pull-request (draft for anyone)
    Remote --> Written: direct connector write

    GatePass --> SplitAttributes
    SplitAttributes --> Written: attributes mastered elsewhere written to their source, rest to file
    GateHold --> Drafted
    ClassHold --> Drafted
    DecisionHold --> Drafted

    state Drafted {
        [*] --> VariantA: _drafts/<file>.draft (+ sidecar when the gate held it)
        VariantA --> VariantA: same sha256 rewrite
        VariantA --> Variants: gate rule keeps variants and text differs
        Variants --> Variants: next letter (b..), opens a variants decision (fail-open)
        Variants --> TooMany: letters exhausted - throws
    }
    Drafted --> Accepted: mentura accept route [--pick x] (actor = person, re-runs the whole write)
    Accepted --> Written
    Accepted --> Settled: settle() removes variants and sidecar, approves the variants decision

    Written --> Provenance: provenance.jsonl entry (activity write or accept, decision class, hash)
    Drafted --> Provenance: activity = draft
    PullRequest --> Provenance: activity = draft
    Provenance --> Around: writes.mjs around() adds changed + next (M-3, M-17)
    Around --> [*]
    Refused --> [*]
```

Notes

- A person is never held, only refused (`gateWrite` returns null for a person unless the verdict is `refuse`). Locks (`locked()`) also skip persons.
- Order matters: the schema check runs before any gate, so a refused or held write never reaches storage.
- Accept is a second full write with `actor: "person"`: the draft is re-validated and re-gated, so a rule that refuses persons also blocks acceptance.
- Remote sources skip `holding()` and `gateWrite()` entirely (`!remote` guards). A gated record mastered in GitHub is never held by the local gate; only the pull request holds it.
