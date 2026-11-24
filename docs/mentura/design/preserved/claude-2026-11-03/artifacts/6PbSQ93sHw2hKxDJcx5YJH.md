<!-- exported 2026-11-03 from https://claude.ai/artifact/6PbSQ93sHw2hKxDJcx5YJH (Claude Docs id 2ba54783-fe23-46ad-b9bc-ea1fcf706276) -->
# Venture identity and legal entity

Oct 31, 2026 · @Torian

Research only: this architects, it does not build. It answers the question left open in [Proving modules, gating actions, and compliance](https://claude.ai/artifact/P8JrRHjZwqp6ZfV6ZXPE48): what belongs to a venture's identity, what belongs to its legal entity, and where each formation, diligence and data-room document goes. It builds on R-02 to R-04, R-12, R-16 and R-17. Internal only (R-45).

## Summary

- **The venture's identity is small.** Only its id, its founding, its original founders, its essential why, its name history and its lineage pass the rigidity test. Everything else is a phase, a function's data, or a link.
- **The legal entity is a second identity, and its own rigid core is smaller still.** Delaware law treats a converted entity as the same entity (DGCL §265(f), §266), so even legal form and jurisdiction are anti-rigid for the entity itself. They are time-versioned spans, not fields.
- **Documents are evidence, never identity.** A formation service produces about fifteen documents; none of them is a field. Each is stored as evidence with its hash, and the records point to it. Gates read the evidence.
- **There is already a standard for this.** GLEIF's LEI data format holds the entity's reference data and records every change as an event with an effective date and a recorded date, which is the same bitemporal model agreed for phases (R-12). Recommend adopting its field names and codes.

## The rule

The test is R-03, after OntoClean (Guarino and Welty): a property is rigid if no instance can lose it and stay the same thing; anti-rigid if every instance can. A role is an anti-rigid property that depends on another thing, as "student" depends on a school.

Applied twice:

1. Can the venture stop having X and remain the same venture? If yes, X is not the venture's identity.
2. Can the legal entity stop having X and remain the same legal entity? If yes, X is a time-versioned span on the entity, not part of its identity.

A venture can exist before it is formed, be operated first by an LLC and then by a corporation, or move state. So the legal entity is never part of the venture's identity. They are linked by a role, "operated by", the same way founders are linked (R-04).

## Five findings that shape the design

**1. Legal form is anti-rigid even for the entity.** Under DGCL §265(f), an LLC that converts to a Delaware corporation is "deemed to be the same entity", and §266 says the same for a corporation converting out. Domestication works the same way for jurisdiction. So the entity's rigid core is its own id and its creation event; its name, form, jurisdiction, status, agent, addresses, officers and directors are all spans with a valid time and a recorded time. A change by merger instead of conversion creates a new entity, which is linked as a successor (from general knowledge of practice, not verified in a source here).

**2. GLEIF already models it bitemporally.** The LEI Common Data File (ISO 17442) holds the entity's Level 1 data: legal name, other names, legal and headquarters addresses, registration authority and its id, legal jurisdiction (ISO 3166), legal form (ISO 20275 code), status, creation date and successor entity. Every change is a legal entity event with a type (for example CHANGE\_LEGAL\_NAME, CHANGE\_LEGAL\_FORM, MERGERS\_AND\_ACQUISITIONS, DISSOLUTION), an effective date and a recorded date. Level 2 is "who owns whom", which is our links. Recommendation: use these names and codes so the record maps to a real LEI if a venture ever gets one, and so other agents can read it.

**3. Documents are evidence, the record holds facts.** The Stripe Atlas list below is the clearest case: the certificate of incorporation proves the creation event, the board consent proves officers were elected, the EIN letter proves the tax id. The facts go into the entity record; the document goes into evidence with its sha256, and each fact cites it. This is the design doc's "evidence, not claims" rule, applied at the record level.

**4. The link is many-to-many over time.** One venture may be operated by successive entities, by a parent and a subsidiary, or have its IP held by a separate entity. One entity may operate several ventures; that is the open question of whether Naive or Mentura is the company. Roles needed: operated\_by, holds\_ip\_for, employs\_for, parent\_of, successor\_of. Each role assignment is anti-rigid and carries valid\_from, valid\_to, recorded\_at and evidence, like a phase span.

**5. Common vocabularies conflate the two.** schema.org puts legalName, foundingDate and founder on one Organization, which mixes the venture and the entity. The W3C Registered Organization Vocabulary keeps them apart: a registered organization is the one that gains legal status by registration (rov:legalName, rov:orgType, rov:orgStatus, rov:registration). Use ROV's split internally; map to schema.org only in exports.

## Proposed records

All JSON in `identity/` (R-16). Records hold current state; history lives in provenance (R-17), except where a span is itself the fact, as with phases.

### identity/venture.json

| Field | Rigid? | Note |
| --- | --- | --- |
| id | yes | Stable id, never reused |
| founding (date, event, evidence) | yes | A past fact cannot change; corrections are recorded, not rewritten |
| original founders (person ids) | yes | A historical fact. Current founders are role links, which are anti-rigid |
| essential why (purpose, core promise) | yes, by R-02 | See open question 1 |
| name history | yes, as a log | Any one name is anti-rigid; the current name is the latest entry |
| lineage (forked\_from, succeeds) | yes | Links to earlier ventures |

Not in it: brand and domain (marketing), markets and geography (where), phase (when), goals (contingent why), the legal entity (a link).

### identity/entities/\<id>.json

| Part | Contents | Rigid? |
| --- | --- | --- |
| Core | id; creation event: date, jurisdiction of formation, registry, file number, evidence | yes |
| Spans | legal name, other names (DBA), legal form (ISO 20275), jurisdiction, registration and file number, status (active, good standing, dissolved), registered agent, legal address, headquarters address, tax ids, fiscal year, authorized shares, directors, officers, LEI | no: each value has valid\_from, valid\_to, recorded\_at, evidence |
| Events | one per change, typed after the LEI event list, with effective date, recorded date and evidence | yes, append-only |

### identity/links.json

One entry per role assignment: role, from, to, valid\_from, valid\_to, recorded\_at, evidence, reason (the why lives in provenance, R-04). Example: venture "Mentura" operated\_by entity "Mentura, Inc." from the filing date, evidence = the filed certificate.

## Where each document goes

Sources: **A** = Stripe Atlas incorporation documents; **C** = Clerky post-incorporation set; **D** = counsel diligence (Holloway); **R** = investor data room (Visible, other checklists).

| Document | Named by | Record it feeds | Package |
| --- | --- | --- | --- |
| Certificate of incorporation or formation | A, C, D, R | Entity creation event, file number, authorized shares | identity (entity) + evidence |
| Action of sole incorporator | A, C | First directors span | identity (entity) + evidence |
| Bylaws or operating agreement | A, C, D, R | Governing documents; the rules later gates read (as policy records) | legal |
| Certificate of secretary of bylaws | A | Evidence that bylaws were adopted | evidence |
| Initial board consent | A, C | Decision record: officers, fiscal year, founder share issuance | the entity's decisions (minute book) |
| Later board and stockholder consents, minutes | D, R | Decision records; the gate behind E\_BOARD\_APPROVAL\_MISSING | the entity's decisions |
| Indemnification agreements and stockholder consent | A | Contracts | legal |
| Form SS-4 and EIN confirmation letter | A | Tax id span | identity (entity) + evidence |
| Form 8821 | A | Evidence only; private | evidence |
| Restricted stock purchase agreements | A, C | Share issuance event; founders' equity role links; IP assignment | finance (cap table) + legal |
| Stock certificates, stock ledger, cap table | A, D, R | Cap table; the ledger is append-only | finance |
| 83(b) elections | A, C, R | Evidence attached to the issuance; a 30-day deadline a gate can check | finance + the person's records |
| Stock assignment separate from certificate, joint escrow | A | Evidence attached to the issuance | evidence |
| Invention assignment agreements (CIIAA) | A, D, R | IP ownership; precondition for hiring and diligence | legal (IP) |
| Option plan, grants, 409A | D, R | Equity records | finance + people |
| SAFEs, notes, term sheets | C, R | Financing records | finance |
| Securities exemption filings (Rule 701, state filings) | D | Compliance obligations | legal (compliance) |
| Good standing certificate | D | Status span; expires on a freshness profile | identity (entity) + evidence |
| Business licenses | D | Compliance obligations | legal (compliance) |
| Trademark registrations | R | IP owned by the entity; protects the venture's name, so it is a link, not identity | legal (IP) |
| Founder bios, org chart | R | People records and role links | people |
| Financial statements, bank statements | R | Money | finance |

What this shows: of about thirty items across the four sources, only the certificate, the incorporator action, the EIN letter and the good standing certificate feed the entity record itself. Most feed finance (cap table), legal (governing documents, IP, compliance) and the entity's decisions. The formation module writes the entity record and its links; the cap table module writes finance.

## Fit with what is agreed

- **R-12 (bitemporal phases):** the entity's spans and the role links use the same shape, so one bitemporal mechanism serves phases, entity facts and roles.
- **R-17 (separate provenance):** the entity's events are facts, not provenance, because the change itself is what the law records. Who recorded them and why still goes in provenance.
- **Gates:** E\_ENTITY\_NOT\_FORMED reads the entity's creation event and its evidence; E\_NO\_EMPLOYER\_ENTITY reads the links; good standing passes only while fresh.
- **MVP:** only `identity/venture.json` is needed for the judgment layer. Recommend the entity record and links stay architected only, with the schema reserved so the formation module can add them later.

## Open questions

1. **A pivot that changes the essential why.** If purpose is rigid, a venture that changes it becomes a new venture. Recommend: record that as a refounding, a new venture identity with a `succeeds` link to the old one, carrying its records over. The alternative, letting the why be amended, makes it anti-rigid and breaks R-02. This is Torian's call.
2. **One entity, two ventures.** The model supports one legal entity operating both Naive and Mentura; which is the company is still open.
3. **Where people's identities live.** R-04 makes people separate identities; whether they sit in `identity/people/` or the people package is not decided here.
4. **Counsel.** The document table is drawn from vendor and practitioner sources, not legal authority. Securities counsel, already planned for investment packages, should confirm it before any gate relies on it.

## References

Retrieved 2026-10-31 by this research thread through web search and page fetches. Each is a link plus the claim it supports (R-34); no copies kept.

| Reference | Supports |
| --- | --- |
| [Stripe Atlas: incorporation documents](https://docs.stripe.com/atlas/incorporation-documents) | The full C corporation and LLC document lists and what each does |
| [Cooley GO: documents on Stripe Atlas](https://www.cooleygo.com/what-documents-produced-by-cooley-gos-incorporation-generator-are-available-on-stripe-atlas/) | Atlas templates come from Cooley's generator |
| [Introducing the Complete Clerky](https://blog.clerky.com/introducing-the-complete-clerky/) | Clerky's set: incorporator action, bylaws, initial board consent, stock purchase agreements, consent before SAFEs |
| [Rho: Stripe Atlas vs. Clerky](https://www.rho.co/blog/stripe-atlas-vs-clerky) | Clerky's post-incorporation package holds bylaws, stock purchase agreements and 83(b) forms |
| [Holloway: legal diligence on corporate formation and stock](https://www.holloway.com/g/angel-investing/sections/legal-diligence-on-corporate-formation-and-stock-documents) | Counsel diligence documents and checks: charter, ledger, IP assignment, securities exemptions, good standing, licenses |
| [Thomson Reuters: key legal documents for start-ups](https://legal.thomsonreuters.com/en/insights/articles/key-legal-document-checklist-for-small-and-start-up-businesses) | Contents of a minute book |
| [Visible: what to include in a data room](https://visible.vc/blog/what-to-include-in-your-data-room/) | Data-room items by stage |
| [Papermark: startup data room checklist](https://www.papermark.com/blog/startup-data-room-checklist) | Seed-stage corporate basics, including 83(b) elections |
| [GLEIF: LEI-CDF 3.1 documentation](https://www.gleif.org/content/4_lei-data/1_access-and-use-lei-data/2_level-1-data-lei-cdf-3-1-format/lei-cdf_version_3.1-documentation.html) | Level 1 fields; legal entity events with effective and recorded dates |
| [GLEIF: ISO 20275 legal forms](https://www.gleif.org/en/about-lei/iso-20275-entity-legal-forms-code-list) | Codes for legal form |
| [W3C Registered Organization Vocabulary](https://www.w3.org/TR/vocab-regorg) | Registered organization as distinct from organization |
| [Business Law Today: conversion and domestication under the DGCL](https://businesslawtoday.org/?p=9591) | Converted and domesticated entities are deemed the same entity |
| [Delaware Code title 8 §266](https://law.justia.com/codes/delaware/title-8/chapter-1/subchapter-ix/section-266/) | Corporation converting to another entity form; check the current text before relying on wording |
| [Guarino and Welty: An Overview of OntoClean](https://www.loa.istc.cnr.it/wp-content/uploads/2020/03/OverviewOntoClean-compresso.pdf) | Rigid, anti-rigid, and roles as dependent anti-rigid properties |
