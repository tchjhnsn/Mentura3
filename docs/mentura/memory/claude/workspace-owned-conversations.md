---
name: workspace-owned-conversations
description: Torian 2026-11-01 02:49Z rule: in Mentura a conversation belongs to the workspace; founder and venture suites only receive routed lines (receipts) by triage
metadata:
  type: project
  modified: 2026-11-01T02:53:58.993Z
---

Torian, 2026-11-01 02:49Z: "The conversation thread does not belong to the venture. The venture receives the conversation thread." Triage sorts threads by subject into the founder suite and venture suites. "Suite" is a placeholder; "folder" is his alternative.

Proposed design (architecture only, not built), written as the "Conversations belong to the workspace" section of doc https://claude.ai/artifact/5sZmpViNPfLHNmXAigeVrs (the venture comparison plan):
- Path `workspace/conversations/<id>/` with conversation.json, inputs.jsonl, routing.jsonl (append-only). Replaces meta-schema §9's `raw/conversations/<id>/`.
- Suites hold receipts (conversation id + line hash), never text. Checks: no suite holds text; receipts resolve; every line accounted for; founder lines reach a venture only by a promotion decision.
- Triage tags subjects first, then destinations; agents propose, people confirm; one line can go to several places.
- A venture that leaves takes a sealed excerpt so its provenance still resolves.
- Open: workspace = one person or a team (drafted as team); a conversation shared by two workspaces.

Terms sent to the phases thread term engine: workspace, receipt, triage, subject, sealed excerpt (plus suite). Related: [[naive-phases-functions]].
