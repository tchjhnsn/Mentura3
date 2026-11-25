import type { Metadata } from "next";
import { TerminalIcon } from "lucide-react";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { COLUMN, Group } from "@/components/list-rows";
import { Button } from "@/components/ui/button";
import { cliTokens } from "@/server/device-auth";
import { requireUser } from "@/server/session";
import { revokeCliTokenAction } from "./actions";

export const metadata: Metadata = { title: "Command line" };
export const dynamic = "force-dynamic";

const day = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

/**
 * Settings, Command line (device sign-in, RFC 8628; offline sync, EE-174): every command line signed in to one of
 * your businesses, and Revoke. Revoking signs that command line out at its next sync call. Before migration 0069 is
 * applied the table is missing, and the list then reads as empty.
 */
export default async function CommandLinePage() {
  const user = await requireUser();
  const tokens = await cliTokens(user.id).catch(() => []);
  return (
    <main className={PAGE}>
      <ThingHeader search={false} back="/settings" backLabel="Settings" crumbs={[{ label: "Settings", href: "/settings" }]} title="Command line" />
      <div className={COLUMN}>
        <div className="grid gap-1 text-center">
          <h1 id="page-title" className="text-xl font-semibold tracking-tight">Command line</h1>
          <p className="text-muted-foreground text-sm">The Naive command line signs in to one business at a time and keeps its own records as files. Each sign-in below can read and write that business, as you.</p>
        </div>

        <Group title="Signed in" id="tokens">
          {tokens.length === 0 ? (
            <li className="text-muted-foreground px-4 py-4 text-sm">No command line is signed in. Run <code className="font-mono">naive sync link</code> in your terminal, then type the code it prints at /device.</li>
          ) : (
            tokens.map((t) => (
              <li key={t.id} className="flex min-h-14 items-center gap-3 px-4 py-2">
                <span className="text-muted-foreground grid min-w-6 shrink-0 place-items-center [&>svg]:size-5"><TerminalIcon /></span>
                <span className="grid min-w-0 flex-1">
                  <span className="truncate text-base">{t.business}</span>
                  <span className="text-muted-foreground truncate text-sm">{t.client} · signed in {day(t.createdAt)} · {t.lastUsedAt ? `last used ${day(t.lastUsedAt)}` : "not used yet"}</span>
                </span>
                <form action={revokeCliTokenAction.bind(null, t.id)}>
                  <Button type="submit" variant="ghost" size="sm" className="text-destructive">Revoke</Button>
                </form>
              </li>
            ))
          )}
        </Group>
      </div>
    </main>
  );
}
