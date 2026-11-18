// The person's own site and blog as actions (doc "Personal site and blog design guide", 2026-11-18): Ask Reflect
// reads what is on the site (its template, address, posts and subscriber count) and changes its template. Publishing
// and unpublishing are a tap on the work's page only, never offered to a model (page-actions.test.ts says why).
import { z } from "zod";
import { TEMPLATES, isTemplate, readingMinutes, type TemplateId } from "@reflect/core/site";
import { profileSettings } from "../profile-store";
import { postsOf, setTemplate, siteOf, subscriberCount } from "../site-store";
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
