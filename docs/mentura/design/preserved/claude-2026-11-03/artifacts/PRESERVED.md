---
type: preserved
status: preserved, not reconciled
source: artifacts/*.md on branch preserve/sources-2026-11-03 at acfb232 (Claude export of 2026-11-03), 26 files
sha256: per file in the table below, each equal to its artifacts/ line in SHA256SUMS.txt on that branch
ledger: N-038 (Claude audit id C-S3-artifacts); other rows that name a file are in the table
recorded-on: 2026-11-04
---

# Claude's artifacts, preserved

Each `.md` file in this folder except this one is a verbatim copy of an `artifacts/*.md` file from Claude's export of 2026-11-03, taken with `git show` from `preserve/sources-2026-11-03` and not edited. Each file is the text of one claude.ai artifact, and its first line names the artifact link it came from. Merged ledger row N-038 records these artifacts as named by Claude's memory, held only in the private store, and not re-read in the audit. This copy is the first one in a repo.

The ledger rows column also reads the full ledger, `grok-store/merged-ledger.full.md` on the preserve branch, because the public ledger shows confidential rows as pointers only. A confidential row is listed only once every source it names is on main, so a row that also names a source still off main is left out until that source lands.

Row N-038 names six of these files and gives the rest only as a count, and its idea is the artifacts that Claude's memory names. Every one of the 26 files is named in at least one note in `docs/memory/claude/`, so the table lists N-038 on all 26.

The files are preserved and not reconciled. They are records of what the artifacts said on 2026-11-03, not decisions in force, and no checker loads them. `scripts/architecture-inventory.ts` reads them like every text file under 400 KB outside `docs/reviews/`. Stage 2 of the ontology program reconciles them.

`FLAGS.tsv` on the preserve branch flags all 26 files (`mentura-confidential`, `investor-relations`, `names-polity`, `founder-personal` and `personal-data-third-party`). Torian decided gate G14, on Nov 3, that every source is preserved as-is, confidential files included, each flagged file with a `FLAGS.tsv` row. Each file's `FLAGS.tsv` line is in the table, and that row's cleanup rule still applies before any public mirror.

The artifacts use the retired name `foundation` 66 times, and one contains em dashes, as they were written. EE-091 decided that `foundation/` moves to `identity/` (not built yet).

| File | Title | sha256 | Ledger rows | FLAGS.tsv line and flags |
|---|---|---|---|---|
| `3KvPSmfE7C4eyQHNFYc1bv.md` | Conversation theorem: how the next question is chosen | `eb5019505572096e1be29d750490fa47cb37241e1e8b6fcd8e0838691e249a1d` | N-023, N-038 | line 2: mentura-confidential,investor-relations,founder-personal |
| `3L1nAHbBaVKWjHED61RJv1.md` | What kind of AI system we are building | `61d52445ea6cc9e6fa9d6e860426ab649d5b6714f83d12af9cd3334363f597b8` | N-038, N-111 | line 3: names-polity,mentura-confidential |
| `5sWFAuBtJv2KJqc7iyXjJE.md` | Problem loop (proposed) | `cb11cfd04d16afea1d28ab9bbc4c887ca8b386f3153e7b28a6fd178963aed1cc` | N-021, N-038 | line 4: personal-data-third-party |
| `5sZmpViNPfLHNmXAigeVrs.md` | Venture comparison pipeline: plan | `9ac61c443c414afa3e09464b64aea50be8a484b0f9aab09fae00ac8be11c3b69` | N-022, N-038 | line 5: mentura-confidential |
| `6Bzp6sc4bf7W9VL3L86Xcq.md` | Investor relations: a guide for a Discovery-phase founder | `95bdf48e6c1f02e050274b40ee0e527acb432781486a5d096aaab4a28d40696b` | N-033, N-038 | line 6: mentura-confidential,investor-relations,founder-personal |
| `6PbSQ93sHw2hKxDJcx5YJH.md` | Venture identity and legal entity | `4f359e91990829e794d1749776dbd6a0c0cf62fc7633b5031dcd3c1712101b54` | N-009, N-038 | line 7: mentura-confidential,investor-relations |
| `7f8K6ryc8qGj6ejqSN7DrA.md` | Knowledge, convention and code (proposed) | `b982ee46b5a11a8a6d527f4665d5df845d825ebd6bd58765a15668fb98bff9d8` | N-007, N-038 | line 8: mentura-confidential |
| `9BrcaCxu9S9Loaqmr72cp5.md` | The publishing pipeline: gates from draft to channel | `33bb29184067a20026047608a3aa1fdc95392381316151aeb3bbee57627ad1f3` | N-038, N-163 | line 9: names-polity,mentura-confidential |
| `AqbpH2Qi93URhZp6H6tX9V.md` | Venture console plan | `62c99f5b78a59c9a50a294c0f8f0f7114b0ca4d5549d60a3d9523f3878892411` | N-038, N-215 | line 10: mentura-confidential |
| `BPmRBdS9mp6JoRtWMwW1hE.md` | Precog: anticipating needs with grounded confidence | `96a35c41281f363d7facbc90dfdc94f35bcdef84cc974507254b7b39fc54e454` | N-038 | line 11: mentura-confidential |
| `C52hTMWrqDoxvSJm1MPqtR.md` | Architecture record: one golden record for Naive's engineering | `6ff62ddf19425661c0b1f3e6129755840d4902e9afb9f7fdd7e474c4ec119fd5` | N-036, N-038 | line 12: mentura-confidential |
| `DzLx13KioDW1bexKyKtmn5.md` | Go-to-market, the founder module and Mentura's presence suite | `6e8753a0779cc236a55e2b3736e14918df6ef39a3bc3057a5254f4be79680603` | N-034, N-038 | line 13: names-polity,mentura-confidential |
| `GGoCgRehUWfGZm9UoykeDP.md` | The venture library and industry graph | `8c0c25acef76d794cced7be81aaaa5bb69184f3d073864d5ffa49a57c59cd0f7` | N-031, N-038 | line 14: mentura-confidential,investor-relations |
| `Jh4pQmq1ZtgeukjP2EwGs8.md` | Venture project structure | `9f944be1357cc683dc987e10ec52aa03fcee4f0b91ad530364dfcfc53b226faa` | N-015, N-038, N-210 | line 15: mentura-confidential,investor-relations |
| `JormQSRjkoHF8Mt2MFdFRX.md` | Naive and Next.js: section correlation | `4388f81cf7ad3345718f58ab95c4026421ca33e6647a83e487e316a703d2f091` | N-030, N-038 | line 16: mentura-confidential |
| `JzodSs3wxHfS4BMaQydXFV.md` | Naive docs | `d31c6db25aba5cc0b3798dd2d9aabad00fefb8dd38c1d755e606f70d1eb27a22` | N-008, N-030, N-038 | line 17: mentura-confidential,investor-relations |
| `KeKBoHoaX8cUa3ubqKSxT8.md` | The industry as one venture: where Naive innovates | `62937015d32199f30d2fec0cbc76ea6e829186fe59f3b8d08987c604f7af9319` | N-031, N-038 | line 18: mentura-confidential,investor-relations |
| `MgZcTJsPe7pfwAksuh1Lxs.md` | From idea to identity: needs, suppliers, and how functions talk | `516189e0bbb2c895466b7ff2ccecccd80b72ec823e6419e91db8adcb6d026cf4` | N-035, N-038 | line 19: mentura-confidential |
| `NXGKHQxfVRpTwBoYiaMeNw.md` | What a venture is: the model, its proofs, and conversation intake | `e224487939e4f0f39173c077b919306f2e9e1d0fdfc593eeb66d4bc4e0a0df53` | N-038, N-045 | line 20: mentura-confidential,investor-relations |
| `P8JrRHjZwqp6ZfV6ZXPE48.md` | Proving modules, gating actions, and compliance | `b52720610ea511f1d1738b57c0775d46f3a275646a7c49926c232c5c51b71cd5` | N-011, N-038 | line 21: mentura-confidential,investor-relations |
| `RrM6rsuXAGjk8Wvh9Lv33i.md` | Naive Venture Design | `88dabf222a0ee209a40f970d45d57f33c12aaa345c2fab05cef1e73956cc9473` | N-005, N-038 | line 22: mentura-confidential,investor-relations |
| `TSYx8RQDzVxbcnmQQMaH1p.md` | Mentura discovery, the puzzle, and blind spots | `db7eb92496236e778e36ca872d9f88367ccc5579ee115a09fe8b3173687d75d8` | N-027, N-038 | line 23: mentura-confidential,investor-relations |
| `U4RxAdER9CHEZ3k9ZAxAaD.md` | Founder interviews as training data: plan | `5ad5eee1f87aa1932d73b2748e21c5cd879bd8815d0406e15c74609ebe3e3285` | N-032, N-038 | line 24: mentura-confidential,investor-relations |
| `UN4dLQn4Fq2ySzT9UA3S3q.md` | Venture calendar: design proposal | `10ea014e805e51bee9b30379ea720b3fb6dad54a9685569f7deef301d61df7dd` | N-016, N-038 | line 25: mentura-confidential |
| `XLTvXURWmMpEikYLtdCoPF.md` | AI research areas, the stack, and where we land | `6cad43db3958298aec51718db5d8f0e079679a97af2312454a3e6f1e0a676e2f` | N-038 | line 26: names-polity,mentura-confidential |
| `YLQnmD6SqAqXHar2o7ebBF.md` | Reinforcement learning: the field, our pipelines, and records-gated generation | `76e3f5eda822780120cb09a26113c2d4a4f18acc924becc4384721437df22a18` | N-020, N-038 | line 27: mentura-confidential |
