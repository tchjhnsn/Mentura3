---
name: naive-docs-not-public
description: 2026-10-31 Naive closed source; docs/templates behind waitlist, gated off the public site by a flag; READMEs are the docs
metadata:
  type: project
  modified: 2026-10-31T05:52:34.770Z
---

2026-10-31 05:30Z Torian decided Naive is closed source; Discovery becomes a free tier behind a waitlist. 05:31Z: docs and templates live behind the waitlist, not on the public site. 05:51Z (card in thread cmsg_01TRojivaFzywKqAKrsycdv8UeXFAJ5edDQtADCmqQWMSz) he chose "gate with a flag": production returns 404 for /docs, /templates, .md routes and llms files; previews keep them; NAIVE_DOCS_PUBLIC=1 re-opens them. Home links to docs become "Join the waitlist" (no waitlist mechanism exists yet as of 05:55Z).

05:52Z Torian: README docs-as-code ([[readmes-docs-as-code]]) is one of the most important updates right now; every thread should follow it.

**How to apply:** don't add public docs/templates pages or link the public site to /docs; put docs in README.md beside the code or "No docs change: <why>" in the PR body.
