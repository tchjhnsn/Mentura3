---
name: workflow-review-2026-10-26
description: Findings of the 2026-10-26 workspace/workflow review: merge backlog, scattered pending decisions, where debate/BASED/pricing notes live
metadata:
  type: project
  modified: 2026-10-26T06:14:37.966Z
---

Review doc: https://claude.ai/artifact/NRWprdhj8FUUtJum3gimvb (thread cmsg_01TRojivaFzywKqAKrsycdv8LScYidhK93eYjsX9PsCTEP). Recommendations only, awaiting Torian's picks.

- Bottleneck is merges as much as decisions: 10 open polity PRs on 2026-10-26, oldest #131 (2026-10-15).
- Pending decisions scattered: G-ledger has no `awaiting-decision` entries (schema allows it); ~30 Polity plan docs carry `decision-status: proposed/awaiting-decision`; founder questions are prose in work-queue items.
- polity docs/handoffs/index.json on main lags claims (H-0005 "ready" though PR #174 claims it; H-0003 "done" but #136 open).
- Vault `_meta/handoff-prompt.md` contains a plaintext GitHub PAT; flagged to Torian to revoke. Never copy it.
- Locations Torian asked about: debate platform = companies/polity/delivery/roadmap/social/PLAN_DEBATES_AND_LOGIC_TREES_2026-10-04.md; BASED goals = everything-ecosystem/methodology/frameworks/business-discovery-framework.md (Layer 4); products = PRODUCT_OFFERINGS_INDEX_2026-08-12.md; pricing = companies/polity/business/PRICING_TIERS_PROPOSAL_2026-10-04.md.
- Proposed Polity sequence: BASED vision -> per-product ledger (fits MAD W-013) -> SMART roadmap, in a separate thread.
