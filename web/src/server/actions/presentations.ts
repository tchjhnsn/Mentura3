// The presentation gate in the app (Reflect framework plan, step 6): drafting and checking a presentation record, the
// core's two actions (@reflect/core/vault-actions) over the app's Postgres presentations (../presentation-store.ts),
// and publishing a journal work to the person's own site, the first action that `publishes` (channel personal-site).
// Publishing is always held, from any source: the run's host (./run.ts) asks the gate for the record the input names
// in `presentation`, and only the person approves, on a page (the Publish sheet, or Send on its card in Ask). Chat and
// MCP may draft, check and ask to publish; their request waits for the person. What reaches the person's own repository
// is the post file and the manifest that @reflect/core/published makes through the gate, the same bytes a vault writes
// to published/ (../site-repo.ts delivers them into the repository's content folders only). Reflect never edits the
// site's code: Ask may read the repository (site_files), and a connector write to it is refused (./marketplace.ts).
import { z } from "zod";
import { CHECK_PRESENTATION, checkPresentationIn, DRAFT_PRESENTATION, draftPresentationIn } from "@reflect/core/vault-actions";
import { ID, OCCASIONS, VIRTUE_IDS, type Occasion, type VirtueId } from "@reflect/core/presentation";
import type { Approval } from "@reflect/core/published";
import { excerpt } from "@reflect/core/site";
import { postgresPresentations, type Presentations } from "../presentation-store";
import { getWork } from "../work-store";
import { profileSettings, profilePage } from "../profile-store";
import { publishWork, siteOf, subscribersToMail } from "../site-store";
import { publishToRepo } from "../site-repo";
import { sendSiteMail } from "../site-connectors";
import { siteUrl } from "../site";
import { profileHref } from "./profiles";
import { action, type ActionContext } from "./types";

/** The person's presentations: the test's when it gives one, else Postgres. */
export const presentationsOf = (ctx: ActionContext): Presentations => ctx.presentations ?? postgresPresentations(ctx.userId);

/** The channel the site publish goes out on, in the person's presentation policy. */
export const SITE_CHANNEL = "personal-site";

export const PRESENTATION_ID = z.string().regex(ID, "lower case letters, digits and hyphens");

export const draftPresentationAction = action({
  ...DRAFT_PRESENTATION,
  input: z.object({
    channel: z.string().min(1).describe("a channel id from the presentation policy, such as personal-site, reflect-profile, social, email or in-person"),
    id: PRESENTATION_ID.optional().describe("a draft's id, to update it"),
    who: z.string().optional().describe("who acts, when not the person"),
    role: z.string().optional().describe("the role they speak in, such as founder, friend, citizen or son"),
    what: z.string().optional().describe("what is done or said"),
    about: z.string().optional().describe("about what, or to whom"),
    means: z.string().optional().describe("by what means: the medium, what one wears or carries"),
    end: z.string().optional().describe("for what end: what the appearance is for"),
    how: z.string().optional().describe("how: the manner and bearing"),
    occasion: z.enum(OCCASIONS as unknown as [Occasion, ...Occasion[]]).optional().describe("Rhetoric I.3"),
    audience: z.string().optional().describe("who will see or hear it"),
    relation: z.string().optional().describe("the person's relation to the audience"),
    virtue: z.enum(VIRTUE_IDS as unknown as [VirtueId, ...VirtueId[]]).optional().describe("the virtue at stake (Nicomachean Ethics IV.3, IV.6-9)"),
  }),
  run: async (ctx, input) => draftPresentationIn(presentationsOf(ctx), input, ctx.now ?? new Date()),
  change: (r) => ({ after: { id: r.id } }),
});

export const checkPresentationAction = action({
  ...CHECK_PRESENTATION,
  input: z.object({ id: PRESENTATION_ID }),
  run: async (ctx, { id }) => checkPresentationIn(presentationsOf(ctx), id),
});

/**
 * What the Publish sheet needs to draft a record on the site's channel: the channel's rules (each a role and an end the
 * gate accepts), its audience, where it lands, and the last record on the channel, to start the next one from.
 */
export type SitePresenting = {
  rules: { role: string; end: string; content: string }[];
  audience: string;
  destination: string;
  repo: string | null;
  last: { role: string; end: string; audience: string; relation: string } | null;
};

export async function sitePresenting(userId: string, store: Presentations = postgresPresentations(userId)): Promise<SitePresenting | null> {
  const [policy, all, site] = await Promise.all([store.policy(), store.list(), siteOf(userId).catch(() => null)]);
  const channel = policy.channels.find((c) => c.id === SITE_CHANNEL);
  if (!channel) return null;
  const last = all.find((p) => p.channel === SITE_CHANNEL);
  return {
    rules: channel.rules.map((r) => ({ role: r.role, end: r.end, content: r.content })),
    audience: channel.audience ?? "",
    destination: channel.destination ?? "",
    repo: site?.repo?.repo ?? null,
    last: last ? { role: last.circumstances.who.role ?? "", end: last.circumstances.end ?? "", audience: last.audience?.who ?? "", relation: last.audience?.relation ?? "" } : null,
  };
}

/** What a publish did: where the post is, and whether it reached the person's repository and their subscribers. */
export type Published = { slug: string; href: string; updatedAt: string; emailed?: number; repo?: string | null; repoError?: string };

/** The gate's inputs for a publish the person approved now: their policy and the record the input names. */
async function approvalOf(ctx: ActionContext, presentation: string): Promise<Approval> {
  const store = presentationsOf(ctx);
  const [policy, record] = await Promise.all([store.policy(), ID.test(presentation) ? store.get(presentation) : Promise.resolve(null)]);
  return { policy, record, channel: SITE_CHANNEL, at: ctx.now ?? new Date() };
}

/** Publish the work as it is now: its post on the person's site, its files in their linked repository, and the email. */
async function publishNow(userId: string, workId: string, slug: string | null, email: boolean, approval: Approval): Promise<Published> {
  const p = await publishWork(userId, workId, slug);
  const site = profileHref({ id: userId, handle: (await profileSettings(userId)).handle });
  // A site the person hosts themselves gets the post file and the manifest in its content folders; their host redeploys.
  let repo: string | null = null;
  let repoError: string | undefined;
  try {
    repo = await publishToRepo(userId, p, approval);
  } catch (e) {
    repoError = e instanceof Error ? e.message.slice(0, 300) : "Could not write it to your repository.";
  }
  // With "Email it to subscribers" on, each confirmed subscriber gets the post's opening and its link, through the
  // person's own email connector (or Reflect's sender), with their own link to leave.
  let emailed = 0;
  if (email) {
    const who = await profilePage(userId, null);
    const url = `${siteUrl()}${site}/${p.slug}`;
    for (const s of await subscribersToMail(userId, 500)) {
      const how = await sendSiteMail(userId, {
        to: s.email,
        subject: p.title,
        text: `${p.title}\nby ${who?.name ?? "Reflect"}\n\n${excerpt(p.body, 600)}\n\nRead it: ${url}\n\nLeave: ${siteUrl()}${site}/subscribe?t=${s.token}&leave=1\n`,
      });
      if (!how) break;
      emailed++;
    }
  }
  return { slug: p.slug, href: `${site}/${p.slug}`, updatedAt: p.updatedAt, emailed, repo, ...(repoError ? { repoError } : {}) };
}

export const publishToSiteAction = action({
  id: "publish_to_site",
  title: "Publish a work to the person's site",
  description:
    "Ask to publish one of the person's journal works (an essay, letter, plan or memoir) to their own site: its post on their site, the post file and Reflect's manifest committed to the content folders of the repository they linked in Settings, Your site, Your own site on GitHub, and, with email, a note to their subscribers. Draft its presentation record first with draft_presentation on channel personal-site (the role, the end, the audience) and name it in presentation. It always waits: only the person approves, on the work's Publish sheet or with Send on its card, and only once the record passes the gate. The text published is the work as it is when they approve.",
  tier: "outside",
  on: ["chat", "mcp"],
  publishes: SITE_CHANNEL,
  input: z.object({
    work_id: z.string().uuid().describe("the journal work's id"),
    slug: z.string().max(60).optional().describe("the post's address on the site; left out, its own or one made from the title"),
    email: z.boolean().default(false).describe("also email the post's opening to the site's confirmed subscribers"),
    presentation: PRESENTATION_ID.describe("the id of the presentation record on channel personal-site, from draft_presentation"),
  }),
  preview: async ({ userId }, { work_id, slug, email }) => {
    const [w, repo] = await Promise.all([getWork(userId, work_id), siteOf(userId).then((s) => s.repo).catch(() => null)]);
    return [
      `Publish "${w?.title.trim() || "Untitled"}" to your site${slug ? ` at /${slug}` : ""}, as the work reads when you approve.`,
      repo ? `Its file and Reflect's manifest are committed to the content folders of ${repo.repo} on ${repo.branch}; your host deploys it.` : null,
      email ? "Its opening is emailed to your subscribers." : null,
    ].filter(Boolean).join("\n");
  },
  run: async (ctx, { work_id, slug, email, presentation }) => publishNow(ctx.userId, work_id, slug?.trim() || null, email, await approvalOf(ctx, presentation)),
  change: (r, input) => ({ after: { slug: r.slug, href: r.href, repo: r.repo ?? null, presentation: input.presentation } }),
});
