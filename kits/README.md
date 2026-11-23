# Kits

A kit belongs to Mentura. It is an enhanced package: automations, agent workflows, richer skills and connectors, on top of one Naive package.

A kit lives at `platform/kits/<name>/kit.json`. It names the one package it extends (`package`) and never replaces that package. The package at `library/packages/<name>/package.json` in Naive works with no kit installed: schemas, templates, deterministic checks and at most one skill, offline, naming no vendor (EE-071).

A kit can also extend a framework command (`extends.command`), and bring automations: triggers that name the package they need and run only once it is complete (`packages/naive/src/records/kit.schema.json`). A venture turns kits on with `kits` in its `naive.config.json`. Naive finds kits only in the folder `NAIVE_KITS` names, so a deployment sets it to this folder (EE-118).

| Kit | What it does |
|---|---|
| `agent-upgrade/` | Runs `naive upgrade --agent`: an agent does the guides' by-hand steps on a staged copy; the framework's checks and a typed confirmation decide what lands (U-3) |
| `validation-kickoff/` | Proposes the decision to start validating once the foundation is complete (M-12) |

`node platform/kits/test.mjs` tests them offline. The agent upgrade lands on the framework version that the installed Naive's `upgrades.json` names, so the test does not change when Naive moves.
