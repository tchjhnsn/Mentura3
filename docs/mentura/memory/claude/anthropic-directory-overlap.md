---
name: anthropic-directory-overlap
description: 2026-10-30 assessment of Anthropic's Small Business plugin and founder plugins in the Anthropic Directory vs Naive
metadata:
  type: project
  modified: 2026-10-30T20:16:36.579Z
---

2026-10-30 20:15Z Torian found Anthropic's "Small Business" plugin (directory id dab4db2f..., source anthropics/knowledge-work-plugins/small-business, v1.35.1) and feared it made Naive pointless. Thread cmsg_01TRojivaFzywKqAKrsycdv8FmnhcW7q2NmTZ2rjRhB5cW.

What it is: 44 skills + ~35 vendor connectors (QuickBooks, Stripe, Gusto, HubSpot...) for RUNNING an existing small business: payroll, books, invoices, leads, marketing, hiring. Router skill, 15-min onboarding that stores a flat `## Business context` block in memory, approval gates before money/customer actions, build-agent turns a repeated task into a skill.

My read: surface overlap only. No idea/problem/validation stage, no lifecycle phases, no decision records, no premise checks, no record files as source of truth. Closest overlap is with Mentura's platform side (connectors) not Naive's framework. Closer competitors in the same directory are community plugins: Founder OS (idea->validation->MVP->launch->fundraise flows + advisor agents), "venture" (per-venture workspace chaining research/PMF/GTM), cofounders, solofounder. All are prompt packs without a durable record layer.

Recommendation given: no change to the stable-Naive goal; stay out of the directory until stable (stealth); patterns worth borrowing later: one-real-run onboarding, approval gates, shared rule files (absent-is-not-zero, untrusted-content). Related: [[naive-plugins-and-proving]], [[ee-self-validation]].

2026-10-30 20:50Z follow-up (Torian asked: templates/playbooks? people behind them? build a directory?). Doc: https://claude.ai/artifact/Y76VuMbDQwDmi1287GDxUS . Founder OS = Adam M. Adamek PhD, Impact Brussels ASBL (nonprofit), Apache-2.0 + CC-BY-4.0, sponsorship-funded, closest in ethos. Haytham (arslan70) had Naive's ambition, retired 2026-07 to a personal tool. Directory has 2,283 community plugins (anthropics/claude-plugins-community marketplace.json). Recommended: adapt a few items now (Founder OS interview guide + validate flow, founder-mode decision-check frames, strategy-pack scheduled critic); no own directory now (marketplace exists; curated phase index = framework data, architect only; hosted directory = Mentura, architect only).
