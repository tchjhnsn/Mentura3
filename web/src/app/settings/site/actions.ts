"use server";

import { resolve4, resolveCname } from "node:dns/promises";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CNAME_TARGET, cleanDomain, isTemplate } from "@reflect/core/site";
import { requireUser } from "@/server/session";
import { fromPage } from "@/server/actions/page";
import { setSiteTemplateAction } from "@/server/actions/site";
import { markDomainChecked, setDomain, siteOf } from "@/server/site-store";
import { siteProject } from "@/server/site-export";
import { deployWithVercelConnector, pushWithGithubConnector } from "@/server/site-connectors";

// Settings, Your site (doc "Personal site and blog design guide", page 4). The template runs the registry's entry;
// the domain's steps check public DNS and the host, so they are taps on this page only (page-actions.test.ts).

/** Pick the site's template. */
export async function setTemplateFromSettings(template: string): Promise<void> {
  const user = await requireUser();
  if (!isTemplate(template)) return;
  await fromPage(setSiteTemplateAction, user.id, { template });
  revalidatePath("/settings/site");
}

const back = (q: string) => redirect(`/settings/site/domain?${q}`);

/** Step 1: the domain the person owns. */
export async function saveDomainAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const d = cleanDomain(form.get("domain"));
  if (!d) back("error=That+is+not+a+domain+name.");
  try {
    await setDomain(user.id, d);
  } catch (e) {
    back(`error=${encodeURIComponent(e instanceof Error ? e.message : "Could not save it.")}`);
  }
  revalidatePath("/settings/site");
  back("step=2");
}

/** Stop using the domain; the site stays at its Reflect address. */
export async function removeDomainAction(): Promise<void> {
  const user = await requireUser();
  await setDomain(user.id, null);
  revalidatePath("/settings/site");
  redirect("/settings/site");
}

/** Vercel's address for a domain at the zone's root, where a CNAME is not allowed. */
const APEX_A = "76.76.21.21";

async function pointsHere(domain: string): Promise<boolean> {
  const cname = await resolveCname(domain).catch(() => [] as string[]);
  if (cname.some((c) => c.replace(/\.$/, "").toLowerCase() === CNAME_TARGET)) return true;
  const a = await resolve4(domain).catch(() => [] as string[]);
  return a.includes(APEX_A);
}

/** Adds the domain to this deployment's Vercel project, when VERCEL_TOKEN and VERCEL_PROJECT_ID are set. */
async function addToHost(domain: string): Promise<"added" | "no-keys" | "refused"> {
  const token = process.env.VERCEL_TOKEN;
  const project = process.env.VERCEL_PROJECT_ID;
  if (!token || !project) return "no-keys";
  const team = process.env.VERCEL_TEAM_ID ? `?teamId=${encodeURIComponent(process.env.VERCEL_TEAM_ID)}` : "";
  const r = await fetch(`https://api.vercel.com/v10/projects/${encodeURIComponent(project)}/domains${team}`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ name: domain }),
    cache: "no-store",
  }).catch(() => null);
  if (!r) return "refused";
  if (r.ok) return "added";
  const j = (await r.json().catch(() => ({}))) as { error?: { code?: string } };
  return j.error?.code === "domain_already_in_use" || j.error?.code === "domain_already_exists" ? "added" : "refused";
}

/** Step 3: check the record points here, then connect it. */
export async function checkDomainAction(): Promise<void> {
  const user = await requireUser();
  const { domain } = await siteOf(user.id);
  if (!domain) back("");
  if (!(await pointsHere(domain!))) back("step=2&check=dns");
  const host = await addToHost(domain!);
  if (host !== "added") back(`step=2&check=${host}`);
  await markDomainChecked(user.id);
  revalidatePath("/settings/site");
  back("step=3");
}

/** Push the site to the person's GitHub through their GitHub connector, then show the Deploy button. */
export async function pushSiteAction(): Promise<void> {
  const user = await requireUser();
  let repo = "";
  try {
    const { name, files } = await siteProject(user.id);
    repo = await pushWithGithubConnector(user.id, name, files, "My site and blog, exported from Reflect");
  } catch (e) {
    redirect(`/settings/site/export?error=${encodeURIComponent(e instanceof Error ? e.message : "Could not push.")}`);
  }
  redirect(`/settings/site/export?pushed=${encodeURIComponent(repo)}`);
}

export async function deploySiteAction(): Promise<void> {
  const user = await requireUser();
  let url = "";
  try {
    const { name, files } = await siteProject(user.id);
    url = await deployWithVercelConnector(user.id, name, files);
  } catch (e) {
    redirect(`/settings/site/export?error=${encodeURIComponent(e instanceof Error ? e.message : "Could not deploy.")}`);
  }
  redirect(`/settings/site/export?deployed=${encodeURIComponent(url)}`);
}
