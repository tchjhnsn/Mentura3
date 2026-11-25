import type { ReactNode } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TerminalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PAGE } from "@/components/page-header";
import { listVentures } from "@/app/studio/actions";
import { showUserCode, waitingCode } from "@/server/device-auth";
import { currentUser } from "@/server/session";
import { approveDeviceAction, denyDeviceAction } from "./actions";

export const metadata: Metadata = { title: "Sign in the command line" };
export const dynamic = "force-dynamic";

const FIELD = "border-input bg-background h-9 w-full rounded-md border px-3 text-sm";
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/**
 * Device sign-in (RFC 8628; offline sync, EE-174). The Naive command line prints a code and this address; the person
 * opens it signed in to Mentura, confirms the code, picks the business when the command line named none, and approves.
 * The command line gets its token on its next poll. Approving is the only way a command line token is made.
 */
export default async function DevicePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = await searchParams;
  const typed = one(q.user_code);
  const done = one(q.done);
  const error = one(q.error);
  const here = `/device${typed ? `?user_code=${encodeURIComponent(typed)}` : ""}`;
  if (!(await currentUser())) redirect(`/sign-in?next=${encodeURIComponent(here)}`);

  // Neither line names the business, because this address carries only what the browser was sent here with.
  if (done === "approved" || done === "denied") {
    return (
      <Frame>
        <CardHeader>
          <CardDescription>Mentura</CardDescription>
          <CardTitle className="text-xl">{done === "approved" ? "The command line is signed in" : "Sign-in turned down"}</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-3 text-sm">
          <p>{done === "approved" ? "Go back to your terminal. It can read and write the business you chose, as you." : "Nothing was given out. The command line is told at its next poll."}</p>
          <p>You can take a sign-in back at any time in Settings, under Command line.</p>
        </CardContent>
      </Frame>
    );
  }

  const waiting = typed ? await waitingCode(typed) : null;
  if (!waiting) {
    return (
      <Frame>
        <CardHeader>
          <CardDescription>Mentura</CardDescription>
          <CardTitle className="text-xl">Sign in the command line</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">Type the code your terminal is showing.</p>
          {typed ? <p className="text-destructive text-sm">That code has expired or was already answered. Ask the command line for a new one.</p> : null}
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
          <form method="get" action="/device" className="space-y-3">
            <label htmlFor="user_code" className="sr-only">Code</label>
            <Input id="user_code" name="user_code" required autoFocus autoCapitalize="characters" autoComplete="off" spellCheck={false} placeholder="ABCD-EFGH" maxLength={16} className="text-center font-mono text-lg tracking-widest" />
            <Button type="submit" className="w-full">Continue</Button>
          </form>
        </CardContent>
      </Frame>
    );
  }

  // The businesses the person may choose, read through Naive. When the Studio cannot be reached here, the one the
  // command line named is the only choice, and with none named there is nothing to approve yet.
  const list = await listVentures();
  const businesses = list.ok ? list.value : [];
  const asked = waiting.business;
  const askedIsTheirs = asked !== null && businesses.some((b) => b.id === asked);
  const fixed = asked !== null && (askedIsTheirs || businesses.length === 0);
  const askedName = businesses.find((b) => b.id === asked)?.name ?? asked;
  const choosable = !fixed && businesses.length > 0;

  return (
    <Frame>
      <CardHeader>
        <CardDescription>Mentura</CardDescription>
        <CardTitle className="text-xl">Sign in the command line</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="bg-muted/50 flex items-center gap-3 rounded-lg border p-3">
          <TerminalIcon aria-hidden="true" className="text-muted-foreground size-5 shrink-0" />
          <div className="min-w-0 text-sm">
            <div className="font-medium">{waiting.client}</div>
            <div className="text-muted-foreground font-mono">{showUserCode(waiting.userCode)}</div>
          </div>
        </div>
        <p className="text-muted-foreground text-sm">
          Approving lets this command line read and write one business of yours, as you, until you take the sign-in back in Settings. It is your terminal, so approve it only if you just asked for this code.
        </p>
        {error ? <p className="text-destructive text-sm">{error}</p> : null}
        {asked !== null && !askedIsTheirs && businesses.length > 0 ? (
          <p className="text-destructive text-sm">The command line asked for {asked}, which is not one of your businesses. Pick the one you mean.</p>
        ) : null}
        {!fixed && !choosable ? (
          <p className="text-destructive text-sm">{list.ok ? "You have no business to sign it in to yet. Start one in the console first." : list.error}</p>
        ) : (
          <form action={approveDeviceAction.bind(null, waiting.userCode)} className="space-y-3">
            {fixed ? (
              <>
                <input type="hidden" name="business" value={asked ?? ""} />
                <p className="text-sm">Business: <span className="font-medium">{askedName}</span></p>
              </>
            ) : (
              <div className="space-y-1.5">
                <label htmlFor="business" className="text-sm font-medium">Business</label>
                <select id="business" name="business" defaultValue={askedIsTheirs ? (asked ?? "") : (businesses[0]?.id ?? "")} className={FIELD} required>
                  {businesses.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}
            <Button type="submit" className="w-full">Approve</Button>
          </form>
        )}
        <form action={denyDeviceAction.bind(null, waiting.userCode)}>
          <Button type="submit" variant="ghost" className="text-muted-foreground w-full">This was not me</Button>
        </form>
      </CardContent>
    </Frame>
  );
}

function Frame({ children }: { children: ReactNode }) {
  return (
    <main className={PAGE}>
      <div className="mx-auto mt-16 w-full max-w-md">
        <Card>{children}</Card>
      </div>
    </main>
  );
}
