<!-- exported 2026-11-03 from https://claude.ai/artifact/DzLx13KioDW1bexKyKtmn5 (Claude Docs id 692f5a35-8283-4398-bd3a-31fc85b51b7e) -->
# Go-to-market, the founder module and Mentura's presence suite

Oct 31, 2026 · @Torian

This drafts Torian's go-to-market thinking of 2026-10-31: dogfood Naive on his own companies, keep Naive closed behind a waitlist, and give founders a presence suite through Mentura. Most of it is a proposal; the choices are on decision cards in the thread.

## Go-to-market

The plan is to run Naive on Torian's own companies first and let the results sell it. As the founder he has to be the best salesperson, and his public presence is the first proof: profiles, a founder's website, and posts about his ventures, published by agents through Naive.

That is the same move as "the founder is his own ICP" (recorded 2026-10-30): he uses Naive to cover his own gaps, so his daily use is both the test and the demo. It also fits the stealth-until-stable goal: nothing about Naive goes public until it is stable, while his own presence can grow from now on.

What this needs from Naive, in order:

1. His founder record and social accounts, in the founder module (section 3).
2. A publishing route that knows personal from venture, and which presence each post belongs on (section 4).
3. The publication gate that already exists (EE-025): agents draft, a person approves, nothing goes out unreviewed.

## What is free and what is closed

The proposal: the Discovery module is the free part of Naive; everything else, including the docs and templates, sits behind a waitlist, and Naive is no longer open source. Some of this cannot be fully undone, so it is on a decision card.

What already exists, and what changing it means:

| Today | If Naive closes |
| --- | --- |
| `naive-framework` and `create-venture` 0.6.0 are public on npm under MIT | Published versions stay MIT for anyone who has them; that cannot be withdrawn. New versions can stop being published, and old ones can be deprecated |
| The everything-ecosystem repo is private | No change needed |
| The docs site (Nextra) and the home page are public | Docs and templates move behind the waitlist, or become internal only |
| The naive-plugins repo (visibility not checked) | Make it private or keep only a stub |

Three shapes to choose from:

- **Closed, Discovery free behind the waitlist** (your proposal). Most control, best fit with stealth. Costs the reach that open source gives, and anyone can still fork 0.6.0.
- **Open core: Discovery open, the rest closed.** Keeps a public on-ramp and the MIT history consistent; the closed part carries the value.
- **Keep it open.** The earlier plan (open framework, paid platform). Least friction, least control.

My recommendation is the first, with one change: keep 0.6.0 as it is and stop publishing, rather than trying to retract it.

## The founder module

The founder module holds who the founder is in public: their social accounts and their own website. It extends the founder record that already exists (name, role, hats, agreement, profile); the confidential founder puzzle stays separate and is never published without the founder's approval.

| Part | Holds |
| --- | --- |
| Social accounts | One entry per account: network, handle, URL, purpose (personal, a venture, or both), and who may post there (the founder, or named agents) |
| Founder's website | The URL, or, if there is none, a template to build one, hosted through Mentura |
| Presence checks | Whether each account and the site are complete and consistent: same name, photo and story |
| Assets | Headshots and bios, the public versions only |

Which networks matter depends on the founder's profession: a photographer needs a portfolio, a writer a newsletter, a software founder X and LinkedIn. A rating of how important each network is per profession is worth designing, but you suggested holding it; I agree, it is architected only. For now: X, LinkedIn, Substack and the founder's site.

## Publishing router

Every publication is routed twice: first to an owner (the founder personally, or a venture), then to the presences it belongs on, each with its own version. The publication gate that exists (EE-025) still applies to every route: agents draft and check, a person approves.

1. **Owner.** Is this about the founder, or about a venture? A post about Naive written by Torian can be both: the venture owns it, and the founder's presence carries a version.
2. **Presences.** For a venture: a page on its site, a specific blog, a forum, its social accounts. For the founder: their site, blog, X, LinkedIn, Substack.
3. **Versions.** One source, several versions: a full essay on Substack, a thread on X, a short post on LinkedIn. Versions are artifacts built from the one record, so editing the record updates them all (records versus artifacts, agreed 2026-10-29).
4. **Appearances.** When the founder or someone from the venture appears elsewhere (a podcast, an interview), it is recorded and routed the same way, as a mention on the right presences.

In scope now: X, LinkedIn, Substack, and websites. Video, YouTube uploads and podcasts are recorded as presences, but publishing to them waits; you said no video work yet.

### Destinations as a module, and one gate (Torian, 2026-10-31 06:00Z)

There is no index of sites. A **destination module** answers one question: is this site (a URL or a handle) somewhere this founder or venture publishes, and if so, whose presence is it, which channel, and which policy applies. It computes the answer from the records that already exist: each venture's publication policy (`governance/publication-policy.json`, EE-025) and the founder module's social accounts and site. A list of sites, if anyone wants one, is a generated view of those records, never a separate source.

Modules exist without agents. A public relations agent would be the role that uses the destination module and the gate, but the modules work the same when Torian runs them himself or when no agent exists (the same rule as the agent router, R-25).

Everything published goes through one gate, as a pipeline from input to output:

| Stage | What happens | Exists today? |
| --- | --- | --- |
| Input | A record or draft is submitted with its owner (founder or venture) and its destinations | Partly: `naive publish build <channel>` takes MDX variants for one channel |
| Route | The destination module resolves each destination to an owner, channel and policy | No; channels are per venture only, nothing for the founder personally |
| Lens | One version per destination: the full essay, the X thread, the LinkedIn post, built from the one record | No; this is the missing middle stage |
| Verify | The publish lint (copy distance, leaks, brand, claims, marks, personal data, secrets), the channel's own checks and platform rules, then error handling: each failure reported with its fix, nothing silently changed | Yes: `naive publish check`, `schema/publish-lint.mjs`, `schema/brand-lint.mjs`, channel checks in the policy |
| Approve | A person approves under the public-commitment decision class; agents never approve | Yes: `naive publish`, delegation by door and exposure |
| Output | The approved artifact goes live; the manifest keeps its hash, approver and versions; rollback stays available | Yes: `governance/publications.json`, `naive publish rollback` |

So the gate is mostly built. What is new: founder-owned channels, the destination module, and the lens stage as its own module between input and verification.

This is architected, not built: posting by agents is out of the MVP, and Torian's own posts can go through the existing gate by hand. Requirements R-47 to R-50 record it.

## Mentura services

Mentura would give waitlisted founders what they need to present themselves as founders, partly as a scholarship. These are platform services with partners, not Naive features.

| Service | What it is | Status |
| --- | --- | --- |
| Founder's website | A template site, deployed through Mentura using the Vercel playbook already drafted | Idea |
| Hosting partner | Corrected 2026-10-31: "SpaceX hosting" meant Cursor's Origin, which hosts code, not websites. See "Hosting founder websites" below. | Open, see below |
| Headshots | Partner photographers, booked through Mentura | Idea |
| Scholarship | Waitlisted founders get presence help for free: site, profiles, headshots | Idea; needs a funding source |
| Social profiles | Help structuring each profile, from the founder module's checks | Idea |
| Stores and merchandise | A presence type for founders who sell goods | Recorded, later |
| Banking and legal | Your own money and legal documents, through Rho, Ramp or Mercury | See below |

On banking: you want this set up for yourself now, and you have no money in the bank yet. Opening the account and storing legal documents can be done directly with Rho, Ramp or Mercury today, without Naive building anything. A Naive or Mentura connector is a separate decision, and connectors are out of the MVP.

## Hosting founder websites

**What Origin is.** Origin is Cursor's code hosting, in early beta since 2026-08-17 for paid Cursor plans ([changelog](https://cursor.com/changelog/origin-code-hosting)). It hosts git repos, pull requests and code search, syncs with GitHub, and lets Cursor agents push branches. It does not host websites or databases; deploys come only through its Vercel integration. So it is not a hosting partner. If anything, it is an alternative to GitHub as the place a venture's repo lives, which matters for the console's "one GitHub repo per venture" decision, but it is too early to depend on.

**The options for letting founders deploy through us:**

| Option | What we build | Trade-off |
| --- | --- | --- |
| A. A deploy platform's multi-tenant API (Vercel for Platforms, or Cloudflare Workers for Platforms) | Mentura owns the account, deploys each founder's site and attaches their domain by API | Least to build; we pay their margins and live inside their limits |
| B. Our own storage and serving, with Neon for data | Sites as files in object storage (Cloudflare R2, S3 or Vercel Blob), one Worker serving them by hostname; a Neon database per venture when a site needs data | Most control and the best margins; we own uptime, domains, TLS and abuse |
| C. Origin | Nothing to host sites | Not a fit for hosting; revisit only as a repo host |

Polity already runs on Cloudflare Workers with Neon behind Hyperdrive, so option B is a stack we know.

**My recommendation:** architect only for now, since hosting is Mentura and after the MVP. When it is built, start with A for speed, but keep storage behind one interface so moving to B later is a swap, not a rewrite. I have not checked the current terms or pricing of Vercel's, Cloudflare's or Neon's platform programs; that is the first research step before this becomes a plan.

## Fit with the MVP, and the decisions

Most of this is Mentura, after the MVP. The MVP stays the judgment layer chosen on 2026-10-30; two small pieces fit inside it because they are records, not services.

| Piece | MVP? |
| --- | --- |
| Founder module: social accounts and website as records | In: records, no connectors |
| Publishing router as a record of owner, presences and versions | Architected; agents posting for you are out of the MVP |
| Website templates, hosting, headshots, scholarship | Mentura, later |
| Banking and legal connectors | Out; set up the accounts directly for now |
| Network importance by profession | Architected only, as you suggested |

Decisions, both made 2026-10-31: Naive closes with Discovery free through the waitlist, and docs and templates sit behind the waitlist.

- [x] Should Naive close: Discovery free behind the waitlist, open core, or stay open?
- [x] Should the docs and templates move behind the waitlist now, or become internal only?
