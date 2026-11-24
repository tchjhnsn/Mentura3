---
name: ee-observations-evidence
description: Torian 2026-10-28 21:52Z: fast activity data vs package records; evidence layer holds graded evidence only; raw observations stored too; Naive keeps summaries+pointers when a tool is the system of record
metadata:
  type: project
  modified: 2026-10-28T21:52:18.745Z
---

Discussion, 2026-10-28 21:48–21:52Z. Torian agreed to two recommendations:
- The evidence layer holds graded, cited evidence only (`evidence/results`).
- When a founder uses a CRM, Ramp, Mercury or similar, Naive keeps summaries and pointers, not its own copy. The tool stays the system of record, and vendor connectors live in the platform (EE-041). The connector contract lives in the source-of-truth layer (EE-037).

Torian added that raw observations must be stored somewhere too.

My proposal (21:53Z, not yet confirmed or built):
- Raw observations go in `knowledge/observations/<stream>/YYYY/MM/<date>-<id>.json`.
- Streams are append-only; a correction is a new entry pointing to the old one.
- Example streams: customer-feedback, interviews, experiments, investor-touchpoints.
- Each stream is marked sensitive or not. Sensitive streams stay out of git; only their summaries are versioned with the package.
- Evidence cites observation ids.
- This needs a new "stream" route type and freshness gates on packages (for example, validation needs feedback from the last 30 days).

Torian also described an investors folder: a CRM of investors plus files for ongoing relationships. That belongs in the Relationships package (currently not modeled), as a slow investor record plus an interactions stream.

Related: [[ee-venture-pipeline]], [[ee-venture-package]], [[ee-knowledge-connectors]].

2026-10-28 22:05Z update. Torian asked whether master data and activity/transactional data go into packages or folders; he said "we definitely need to add those types of packages". AGREED by Torian 22:07Z ("this is perfect"): a third package kind, **data packages**, organized by subject (customers, investors, money), not by data kind. Each one is a folder holding `[id].json` master records plus `_streams/<stream>/YYYY/MM/` append-only activity, which replaces the `knowledge/observations` idea. Data packages are never "complete"; their gates are coverage and freshness. Core packages read them as refs. Structure doc: https://claude.ai/artifact/Jh4pQmq1ZtgeukjP2EwGs8 (option A, package folders, recommended; not yet agreed).
