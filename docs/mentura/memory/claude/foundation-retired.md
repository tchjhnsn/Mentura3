---
name: foundation-retired
description: RULE (Torian 2026-11-01 09:42Z, angry): "foundation" is retired everywhere (folder, package, noun); it is identity. Never use or propose foundation again
metadata:
  type: feedback
  modified: 2026-11-01T09:50:46.022Z
---

Torian 2026-11-01 09:42Z: "Why do we still have Foundation? We got rid of that a long time ago... It's a pointless folder. It's not a function. Get rid of it." Decided 10-30 (EE-091, foundation/ -> identity/) but never built, so it kept reappearing in docs and in my systems doc, which wasted his time and tokens.

**Why:** a decision that isn't enforced decays; he has to repeat himself. That is the core complaint about how we work.
**How to apply:** never write "foundation" as a folder, package, route or noun. Its records live under identity/, the package is `identity`, and the strategic foundation view is the "identity statements". The retirement is enforced: docs/ontology.json retires `foundation` and `strategic foundation`, so schema/check-nouns.mjs fails on any use. Built on everything-ecosystem branch claude/retire-foundation (codemod, 257 files; migration schema/migrations/to-identity.mjs; framework 0.4.0; route aliases foundation -> identity). Before describing any system, check the decisions ledger for in-force decisions on it, and treat unbuilt ones as defects to fix, not as current design. Related: [[naive-systems-doc]], [[knowledge-convention-code]].
