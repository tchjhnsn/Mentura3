import type { Metadata } from "next";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { COLUMN, Group, InfoRow } from "@/components/list-rows";
import { requireUser } from "@/server/session";
import { googleSignInReady, signInMethods } from "@/server/account-store";
import { GoogleLink } from "./google-link";

export const metadata: Metadata = { title: "Sign-in" };
export const dynamic = "force-dynamic";

/**
 * Settings, Account, Sign-in: the ways the person signs in. Email and password always; Google only once the deployment
 * holds GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET (checked by name), else the row is left out.
 */
export default async function SignInPage() {
  const user = await requireUser();
  const methods = await signInMethods(user.id);
  const google = googleSignInReady();
  return (
    <main className={PAGE}>
      <ThingHeader search={false} back="/settings/account" backLabel="Account" crumbs={[{ label: "Settings", href: "/settings" }, { label: "Account", href: "/settings/account" }]} title="Sign-in" />
      <div className={COLUMN}>
        <h1 id="page-title" className="text-center text-xl font-semibold tracking-tight">Sign-in</h1>
        <Group>
          <InfoRow label="Email and password" value={methods.includes("credential") ? "On" : "Not set"} />
          {google ? methods.includes("google") ? <InfoRow label="Google" value="Linked" /> : <GoogleLink /> : null}
        </Group>
        <p className="text-muted-foreground text-center text-xs">Your email is never shown to anyone.</p>
      </div>
    </main>
  );
}
