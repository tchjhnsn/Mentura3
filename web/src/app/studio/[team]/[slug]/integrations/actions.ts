"use server";

// The Integrations screens' acts (V24, V26). Connecting is the marketplace's own sign-in at the service
// (startConnect); a short-lived cookie names the console page to come back to, which /api/connectors/callback reads.
// Disconnecting clears the sign-in. Both are the person's taps, as in the marketplace (page-actions.test.ts).
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { businessHref } from "@/components/studio/data";
import { CONNECT_BACK_COOKIE, consoleBack } from "@/components/studio/connect-back";
import { accountProblem, SERVICE_CAPABILITIES } from "@/components/studio/integrations";
import { adapterFor, RECORD_KINDS, sourceEntryOf } from "@/components/studio/integrations-sources";
import { naive } from "@/server/naive";
import { connectionsOf, disconnect, setBusinesses, startConnect } from "@/server/mcp-connections";
import { requireUser } from "@/server/session";

const page = (team: string, slug: string, id: string) => businessHref(team, slug, `integrations/${encodeURIComponent(id)}`);

/** Continue on V24: off to the service's sign-in, or straight back when it needs none. With `scope` "this" only this
 * business may use the connection; otherwise every business may. `account` names which of the person's accounts of
 * the service to sign in (empty for the first), so Finish and Reconnect reach the right one. */
export async function connectIntegration(team: string, slug: string, id: string, form?: FormData): Promise<void> {
  const user = await requireUser();
  const back = page(team, slug, id);
  let to: string | null = null;
  try {
    const started = await startConnect(user.id, { connector: id }, String(form?.get("account") ?? "") || null);
    to = started.redirect;
    if (form?.get("scope") === "this") await setBusinesses(user.id, started.id, [decodeURIComponent(slug)]);
  } catch (e) {
    // The service did not answer as a connector should, or refused to register Reflect: M2 unreachable.
    redirect(`${back}/connect?failed=unreachable&error=${encodeURIComponent(e instanceof Error ? e.message : "Could not connect.")}`);
  }
  await goTo(team, slug, id, to);
}

/** Connect another account on V26 (R18, P26): a second sign-in to the same service under the name the person gives
 * it. It starts kept to this business, so a new account never reaches the others without a tick. */
export async function connectAnother(team: string, slug: string, id: string, form: FormData): Promise<void> {
  const user = await requireUser();
  const back = page(team, slug, id);
  const label = String(form.get("account") ?? "").trim();
  let to: string | null = null;
  try {
    const held = (await connectionsOf(user.id)).filter((c) => c.connector === id && c.status !== "pending").map((c) => c.account);
    const problem = accountProblem(label, held);
    if (problem) throw new Error(problem);
    const started = await startConnect(user.id, { connector: id }, label);
    to = started.redirect;
    await setBusinesses(user.id, started.id, [decodeURIComponent(slug)]);
  } catch (e) {
    redirect(`${back}?error=${encodeURIComponent(e instanceof Error ? e.message : "Could not connect.")}`);
  }
  await goTo(team, slug, id, to);
}

async function goTo(team: string, slug: string, id: string, to: string | null): Promise<never> {
  const back = page(team, slug, id);
  if (to) {
    const at = consoleBack(back);
    if (at) (await cookies()).set(CONNECT_BACK_COOKIE, at, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 600 });
    redirect(to);
  }
  revalidatePath(back);
  redirect(`${back}?connected=1`);
}

/** Disconnect on V26: Reflect forgets the sign-in, for this business and every other. */
export async function disconnectIntegration(team: string, slug: string, id: string, connection: string): Promise<void> {
  const user = await requireUser();
  await disconnect(user.id, connection);
  revalidatePath(businessHref(team, slug, "integrations"), "layout");
  redirect(`${page(team, slug, id)}?disconnected=1`);
}

/** Access on V26: every business, or the ones ticked. Ticking none keeps it to this business, so it never vanishes
 * from the page it was set on. */
export async function saveBusinesses(team: string, slug: string, id: string, connection: string, form: FormData): Promise<void> {
  const user = await requireUser();
  const all = form.get("all") === "on";
  const picked = form.getAll("business").map(String);
  try {
    await setBusinesses(user.id, connection, all ? null : picked.length ? picked : [decodeURIComponent(slug)]);
  } catch (e) {
    redirect(`${page(team, slug, id)}?error=${encodeURIComponent(e instanceof Error ? e.message : "Could not save.")}`);
  }
  revalidatePath(businessHref(team, slug, "integrations"), "layout");
  redirect(`${page(team, slug, id)}?saved=1`);
}

/** Use it here (V23): add this business to a connection kept to others. */
export async function useHere(team: string, slug: string, id: string, connection: string, current: string[]): Promise<void> {
  const user = await requireUser();
  try {
    await setBusinesses(user.id, connection, [...current, decodeURIComponent(slug)]);
  } catch (e) {
    redirect(`${page(team, slug, id)}?error=${encodeURIComponent(e instanceof Error ? e.message : "Could not save.")}`);
  }
  revalidatePath(businessHref(team, slug, "integrations"), "layout");
  redirect(`${page(team, slug, id)}?saved=1`);
}

/** Choose where one kind of this business's records is kept on V27 (M4 choose outside, choose reflect). A connection
 * may be named only when it is the person's, connected, open to this business, holds the kind's capability and has an
 * adapter: the guard M4 names. An empty choice is Use Reflect. Nothing is moved or copied; the bridge writes the rule. */
export async function chooseSource(team: string, slug: string, record: string, form: FormData): Promise<void> {
  const user = await requireUser();
  const business = decodeURIComponent(slug);
  const back = businessHref(team, slug, "integrations/sources");
  const pick = String(form.get("connection") ?? "");
  let error: string | null = null;
  try {
    const kind = RECORD_KINDS.find((k) => k.type === record);
    if (!kind) throw new Error("That is not a kind of record Mentura keeps.");
    let source = null;
    if (pick) {
      const c = (await connectionsOf(user.id)).find((x) => x.id === pick);
      if (!c || c.status !== "connected" || !(c.businesses === null || c.businesses.includes(business))) {
        throw new Error("That connection is not open to this business, so nothing changed. Choose again.");
      }
      if (!kind.capabilities.some((k) => SERVICE_CAPABILITIES[c.connector]?.includes(k)) || !adapterFor(c.connector, record)) {
        throw new Error(`Mentura cannot read ${kind.name.toLowerCase()} from that service yet, so nothing changed.`);
      }
      source = sourceEntryOf(c.connector, c.id);
    }
    await naive("source", { venture: business, record, source }, decodeURIComponent(team));
  } catch (e) {
    error = e instanceof Error ? e.message : "Nothing changed. Try again.";
  }
  revalidatePath(back);
  redirect(error ? `${back}?error=${encodeURIComponent(error)}` : back);
}
