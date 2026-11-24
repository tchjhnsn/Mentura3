---
name: venture-identity-legal-entity
description: Research 2026-10-31 on what belongs to venture identity vs legal entity; doc link, proposed identity/ files, open questions (proposed, not agreed)
metadata:
  type: project
  modified: 2026-10-31T06:51:32.888Z
---

Research doc (internal, architected only): https://claude.ai/artifact/6PbSQ93sHw2hKxDJcx5YJH . Reported to phases/functions thread 2026-10-31 ~07:00Z. All PROPOSED, nothing agreed by Torian yet.

- Venture identity (rigid): id, founding, original founders, essential why, name history, lineage.
- Legal entity = separate identity linked by anti-rigid roles (operated_by, holds_ip_for, employs_for, parent_of, successor_of), many-to-many over time.
- Entity's own rigid core = id + creation event; legal form, jurisdiction, name, status etc. are bitemporal spans (DGCL 265(f)/266 "same entity" on conversion).
- Adopt GLEIF LEI-CDF field names/events (ISO 17442, 20275, 3166); its events carry effective + recorded dates = R-12 model.
- Documents are evidence, not identity fields; only ~4 of ~30 formation/diligence/data-room items feed the entity record.
- Files proposed: identity/venture.json, identity/entities/<id>.json, identity/links.json. MVP needs only venture.json.
- Open: pivot changing essential why = refounding (recommended) vs amendment; one entity for Naive+Mentura; where people identities live; counsel to confirm.

Related: [[naive-phases-functions]], [[ee-venture-top-level]].
