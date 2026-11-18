import type { Metadata } from "next";
import { CheckIcon } from "lucide-react";
import { AUDIENCES } from "@reflect/core/profile";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { COLUMN, Group } from "@/components/list-rows";
import { requireUser } from "@/server/session";
import { profileSettings } from "@/server/profile-store";
import { chooseAudienceAction } from "../actions";

export const metadata: Metadata = { title: "Who sees your profile" };
export const dynamic = "force-dynamic";

const SUB: Record<string, string> = {
  everyone: "Anyone, signed in or not",
  met: "People you connected with, or checked in to an event with",
  me: "Nobody but you",
};

/** Settings, Account, Who sees your profile: the default audience, one tap. A section given its own audience keeps it. */
export default async function AudiencePage() {
  const user = await requireUser();
  const s = await profileSettings(user.id);
  return (
    <main className={PAGE}>
      <ThingHeader search={false} back="/settings/account" backLabel="Account" crumbs={[{ label: "Settings", href: "/settings" }, { label: "Account", href: "/settings/account" }]} title="Who sees your profile" />
      <div className={COLUMN}>
        <h1 id="page-title" className="text-center text-xl font-semibold tracking-tight">Who sees your profile</h1>
        <Group>
          {AUDIENCES.map((a) => (
            <li key={a.id}>
              <form action={chooseAudienceAction.bind(null, a.id)}>
                <button type="submit" aria-pressed={s.audience === a.id} className="hover:bg-accent flex min-h-14 w-full items-center gap-4 px-4 py-3 text-left transition">
                  <span className="grid min-w-0 flex-1">
                    <span className="truncate text-base">{a.label}</span>
                    <span className="text-muted-foreground text-sm">{SUB[a.id]}</span>
                  </span>
                  {s.audience === a.id ? <CheckIcon aria-label="Chosen" className="text-primary size-5 shrink-0" /> : <span className="size-5 shrink-0" />}
                </button>
              </form>
            </li>
          ))}
        </Group>
        <p className="text-muted-foreground text-center text-xs">Your name, face and line always show. Each section of your profile can have its own audience; set it with the eye on your profile.</p>
      </div>
    </main>
  );
}
