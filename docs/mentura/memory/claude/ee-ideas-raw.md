---
name: ee-ideas-raw
description: AGREED 2026-10-28 22:12Z: venture-wide raw/ (dump + founder-supplied sources) per LLM Wiki; compiled idea map cites raw; official transcripts first (platform job)
metadata:
  type: project
---

Torian, 2026-10-28 22:10Z: the idea dump should keep a raw version of the ideas, building on the LLM Wiki `raw/` folder concept. Founders may back an idea with references (blogs, articles, podcasts), so raw files have to be supported. He said "discuss in detail, don't make changes yet."

My proposal, posted 22:11Z and not yet agreed:
- Layout:
  - `ideas/raw/dump/<date-time>.md`: one file per capture.
  - `ideas/raw/sources/[id]/`: `source.json` (url, kind, added, founder note), an optional `original.*` and `text.md`.
  - `map.mdx` and `graph.json`: compiled from raw, with every node citing raw ids.
- Raw is immutable, and the compiled layer can be rebuilt. The Understand gate confirms the compiled layer.
- Citations fail closed.
- References are not evidence. A reference can be graded into low-grade desk research.

Open questions I asked:
1. Should raw be venture-wide (a top-level `raw/`)? I lean yes.
2. Copyright: keep the link, the note and quotes in git, and full copies private.
3. Should transcription be a platform job?

Related: [[ee-observations-evidence]], [[ee-venture-pipeline]].

AGREED by Torian 22:12Z: all recommendations stand. Raw is venture-wide (top-level `raw/`). Copyrighted sources: the link, the note and quotes go in git; full copies stay private. Transcription is a platform job, and Mentura fetches official transcripts when they exist, transcribing only when none does. Outside the platform the user supplies transcripts however they like. `source.json` records transcript origin as official, platform or founder. Added to the structure doc https://claude.ai/artifact/Jh4pQmq1ZtgeukjP2EwGs8
