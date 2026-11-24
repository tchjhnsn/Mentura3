---
publish: false
type: research
source: hybrid
created: 2026-10-28T19:05:00Z
ai-model: claude-opus-5.5
authority: advisory
tags: [marketing, mdx, brand, design-tokens, naive, mentura]
description: "Export of the 'MDX marketing pages and brand assets' doc (https://claude.ai/artifact/EZrUCCNwVB4DUJX2Jw9uiw), kept in the repo so the handoff for the Naive docs and marketing site is self-contained. The doc's embedded flow diagram is not included. Its open questions are not yet answered by Torian."
---

# MDX marketing pages and brand assets

Oct 28, 2026 · @Torian

## Short answer

Yes, this works with today's tools. A founder writes each page's content as MDX. Agents turn it into a designed page, using components and a design skill. Those components read two things from the source of truth: brand tokens (colours, type, spacing, logo) and facts (price, plan limits, product names).

The brand's system of record can stay wherever the founder designs: Figma, Canva or Claude Design. What enters the source of truth is the brand in one standard format, the W3C community group's Design Tokens format (stable since 2025.10). That copy is either exported once, or kept in sync through a connector.

Two conventions belong in the framework: the page format, and a brand record with an owner. Syncing from Figma or Canva and deploying the site belong in Mentura, the platform.

## How it works

*(Diagram in the original doc: marketing page flow · founder content, brand and facts to deploy.)*

The founder only touches the words. The agent reads the content, the brand record and the facts, then opens a pull request with a preview. The venture's publication policy decides whether a person approves the page or an agent may merge it.

## MDX for marketing pages

MDX is Markdown that can hold components. Next.js supports it directly through `@next/mdx`: a page can be a `page.mdx` file, and a root `mdx-components.tsx` file maps every heading, link and image to the venture's own styled components. That split is what lets the founder and the agent work apart.

- **The founder writes prose.** Headings, paragraphs and lists in plain Markdown. No layout, no class names.
- **The agent owns the components.** `<Hero>`, `<Pricing>`, `<Testimonial>`, `<CTA>` live in code and read the brand record for fonts, colours and spacing. A design skill tells the agent how the venture wants pages to look.
- **Facts are not typed into pages.** A `<Price plan="pro" />` component reads the price from its system of record through the source-of-truth matrix, so the where-used list from EE-042 can find every page that shows it.
- **Frontmatter carries page metadata** (title, description, audience, phase), which the agent uses for SEO tags and the founder never has to touch.

The Vercel Portfolio Starter Kit and Next.js MDX blog templates already follow this shape, so the default path is: fork a Vercel template, keep content in `content/*.mdx`, and let agents propose changes as pull requests that deploy a preview.

Where MDX is weaker: pages that are mostly layout (a dense landing page with many sections) end up as a list of components with little prose. That is still fine for an agent editor, and it is the reason a CMS loses its main advantage here: the visual editor exists for people, and our editor is an agent.

## Brand assets in the source of truth

The brand record should be a design-token file in the W3C Design Tokens Community Group format, whose first stable version (Format Module 2025.10) was published in October 2025. It is plain JSON, vendor-neutral, and already read and written by the main design tools, so it fits the framework rule that nothing names a vendor. Fonts, colours, spacing, radii and logo references all fit in it, with the logo files themselves stored beside it.

Where the brand actually lives differs by founder, and the matrix already handles that: the brand record gets a `system_of_record` like any other record.

| Tool | What it can give us | Export or connect |
| --- | --- | --- |
| Figma | Variables through the REST API, but only on Enterprise plans. Others export tokens with a plugin such as Tokens Studio. | Export tokens, or connect on Enterprise |
| Canva | Brand templates can be listed and filled through the Connect API. I found no public API that exports a brand kit's fonts and colours. | Connect for templates; enter tokens once by hand |
| Claude Design | Builds a design system from a codebase or Figma file and hands off to Claude Code, HTML or Canva. | Export into the repo |
| None yet | The agent drafts tokens from a few questions and a logo. | The repo is the system of record |

So both of your options work. **Export** puts a copy of the tokens in the venture's source of truth, which is simplest and works offline. **Connect** leaves the tool as the system of record and the matrix points there, with the offline drift check catching a stale copy. For this ICP, I would default to export and treat connect as a platform feature.

## Delegating trust

Moving fast with agents means deciding in advance what they may change alone. The governance layer already has decision rights and a publication gate, so the website gets a publication policy rather than a new mechanism.

- **Agent alone:** layout, component styling, typos, image sizes, SEO metadata, anything that follows the brand record and the design skill. Merged after checks pass.
- **Founder approves:** new pages, claims about the product, prices, anything legal or about customers. The agent opens the pull request and the founder approves it from the preview link.
- **Never by agent:** brand record changes and domain or deploy settings, unless the policy says otherwise.

A human marketer added later is just another actor in the matrix and the policy. They can take the founder-approves column, or edit MDX themselves, without changing anything structural. Each rule is a record, so loosening trust over time is a reviewed change, not a habit.

## Framework versus platform

**Framework (Memento or Naive):** the brand record type (DTCG tokens plus asset files, under the source-of-truth layer), the MDX page convention (`content/*.mdx`, frontmatter fields, components reading facts through the matrix), the publication policy record, a design-skill format, and an offline check that pages use only brand tokens and live facts.

**Platform (Mentura):** the Figma and Canva connectors, Claude Design import, a gallery of design-system templates (starter token sets and component kits per style), Vercel template wiring, and hosted preview approval.

Design-system templates fit cleanly on the platform side: a founder picks one, its tokens become the brand record, and the agent restyles the components from it.

## Open questions

1. **Framework name.** Memento collides with Memento Database, an existing app; Naive has no collision I know of yet but reads as a judgement in English. Worth a trademark check on both before choosing.
2. **Layer rename.** You chose "source of truth" as the primary name, with knowledge layer or knowledge base as the secondary. Should the `knowledge/` folder be renamed too, or keep the folder and change only the docs?
3. **Brand record location.** Under the source-of-truth layer as a record type, or under each venture's brand pillar with the matrix pointing at it? I lean towards the brand pillar.
4. **Default for Canva users.** Since a Canva brand kit can't be exported by API, is a one-time manual token entry acceptable for the beachhead?

## Sources

- [Next.js: How to use Markdown and MDX](https://nextjs.org/docs/app/guides/mdx)
- [Design Tokens Format Module 2025.10](https://www.designtokens.org/tr/2025.10/)
- [Canva Connect: brand templates](https://www.canva.dev/docs/connect/api-reference/brand-templates/)
- [Figma REST API: Variables](https://developers.figma.com/docs/rest-api/variables/)
- [TechCrunch: Anthropic launches Claude Design (April 17, 2026)](https://techcrunch.com/2026/04/17/anthropic-launches-claude-design/)
