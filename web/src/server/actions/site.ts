// The person's own site and blog as actions (doc "Personal site and blog design guide", 2026-11-18): Ask Reflect
// reads what is on the site (its template, address, posts and subscriber count) and changes its template and its
// design (colors and type, checked by Virtu like the Customize panel on the site). Publishing
// and unpublishing are a tap on the work's page only, never offered to a model (page-actions.test.ts says why).
import { z } from "zod";
import { TEMPLATES, isTemplate, readingMinutes, type TemplateId } from "@reflect/core/site";
import { profileSettings } from "../profile-store";
import { postsOf, setTemplate, siteOf, subscriberCount } from "../site-store";
import { designOf, designState, readEdits, saveDesign, setDesign } from "../site-design";
import { profileHref } from "./profiles";
import { action } from "./types";

const TEMPLATE = z.enum(TEMPLATES.map((t) => t.id) as [TemplateId, ...TemplateId[]]);

export const siteAction = action({
  id: "site",
  title: "Read the person's site",
  description: "Read the person's own site and blog (their profile at /p/<handle> is the site): its template, its address, their own domain if one is set, how many people subscribe, and each published post with its title, address, kind, date and minutes to read. Published posts are copies of journal works the person chose to publish; the journal itself is never published.",
  tier: "read",
  on: ["chat", "mcp"],
  input: z.object({}),
  run: async ({ userId }) => {
    const [s, settings, posts, subscribers] = await Promise.all([siteOf(userId), profileSettings(userId), postsOf(userId), subscriberCount(userId)]);
    const href = profileHref({ id: userId, handle: settings.handle });
    return {
      href,
      template: s.template,
      templates: TEMPLATES.map((t) => ({ id: t.id, label: t.label })),
      domain: s.domain ? { name: s.domain, connected: !!s.domainCheckedAt } : null,
      subscribers,
      posts: posts.map((p) => ({ title: p.title, href: `${href}/${p.slug}`, kind: p.kind, published: p.publishedAt, minutes: readingMinutes(p.body), work: `/journal/w/${p.workId}` })),
    };
  },
});

export const setSiteTemplateAction = action({
  id: "set_site_template",
  title: "Change the site's template",
  description: `Set the template of the person's own site: ${TEMPLATES.map((t) => `${t.id} (${t.line})`).join("; ")}. Only when the person asks. Undo puts back the one before.`,
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ template: TEMPLATE }),
  before: async ({ userId }) => ({ template: (await siteOf(userId)).template }),
  run: async ({ userId }, { template }) => {
    await setTemplate(userId, template);
    return { template, label: TEMPLATES.find((t) => t.id === template)!.label, href: "/settings/site" };
  },
  change: (_r, _i, before) => ({ before }),
  undo: async ({ userId }, c) => {
    const t = (c.before as { template?: unknown } | null)?.template;
    if (!isTemplate(t)) throw new Error("This change cannot be undone.");
    await setTemplate(userId, t);
  },
});

const DESIGN_EDIT = z.object({
  token: z.string().min(1).max(120).describe("A token from site_design, such as color.role.foreground or type.family.display"),
  value: z.unknown().describe('The new value: a palette swatch as "{palette.ink.700}" or a hex color for a color; a list of font names for a family; a number for a weight'),
});

export const siteDesignAction = action({
  id: "site_design",
  title: "Read the site's design",
  description: "Read the design of the person's own site, which they also change in the Customize panel on the site: each color role and type token with its value, the palette swatches a color can take, and whether Virtu's check passes (body text, secondary text and links at 4.5:1 on the background and muted surfaces, button text at 4.5:1, buttons at 3:1 on the background).",
  tier: "read",
  on: ["chat", "mcp"],
  input: z.object({}),
  run: async ({ userId }) => {
    const s = await designState(userId);
    return {
      tokens: s.tokens.map((t) => ({ token: t.path, type: t.type, value: t.values[""]?.value ?? null, css: t.values[""]?.css ?? null, editable: t.editable })),
      swatches: s.swatches.map((w) => ({ token: `{${w.path}}`, css: w.css })),
      verdict: s.verdict,
      failing: s.findings.filter((f) => f.severity === "error").map((f) => f.message),
      customize: `${profileHref({ id: userId, handle: (await profileSettings(userId)).handle })}?customize=1`,
    };
  },
});

export const setSiteDesignAction = action({
  id: "set_site_design",
  title: "Change the site's design",
  description: "Change colors or type of the person's own site, only when they ask. Read site_design first. The change is saved only when Virtu's check passes on the whole design; otherwise it is refused with what fails, so pick another swatch. Undo puts back the design before.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ edits: z.array(DESIGN_EDIT).min(1).max(20) }),
  before: async ({ userId }) => ({ design: await designOf(userId) }),
  run: async ({ userId }, { edits }) => {
    const read = readEdits(edits);
    if (!read.ok) throw new Error(read.error);
    const r = await saveDesign(userId, read.edits);
    if (!r.saved) throw new Error([r.why, ...r.refused.map((x) => `${x.edit.token}: ${x.why}`), ...r.findings.filter((f) => f.severity === "error").map((f) => f.message)].filter(Boolean).join(" "));
    return { saved: true, verdict: r.verdict, changed: read.edits.map((e) => e.token) };
  },
  change: (_r, _i, before) => ({ before }),
  undo: async ({ userId }, c) => {
    const read = readEdits((c.before as { design?: unknown } | null)?.design);
    if (!read.ok) throw new Error("This change cannot be undone.");
    await setDesign(userId, read.edits);
  },
});
