import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { UserPlusIcon } from "lucide-react";
import { PAGE } from "@/components/page-header";
import { ActionRow, COLUMN, Group, Initials, Row } from "@/components/list-rows";
import { requireUser } from "@/server/session";
import { threadsOf, type Thread } from "@/server/messages-store";
import { hrefFor } from "@/server/actions/messages";
import { CopyLink } from "@/app/settings/copy-link";
import { TileHeader } from "../../tile-header";
import { inviteFriendAction } from "../../messages-actions";
import { when } from "./when";

export const metadata: Metadata = { title: "Messages" };
export const dynamic = "force-dynamic";
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/**
 * Messages on the Friends tile (Ask Reflect plan, step 10): everyone the person can message, the latest conversation
 * first; tapping a person opens the conversation. People join by an invite link; household members are already here.
 */
export default async function MessagesPage({ params, searchParams }: { params: Promise<{ app: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  if ((await params).app !== "friends") notFound();
  const link = one((await searchParams).link).replace(/[^A-Za-z0-9_-]/g, "");
  // Before migration 0047 is applied the tables are missing; the page then says so rather than failing.
  const threads: Thread[] | null = await threadsOf(user.id).catch(() => null);
  return (
    <main className={PAGE}>
      <TileHeader tile="friends" label="Friends" part="Messages" />
      <div className={COLUMN}>
        <h1 id="page-title" className="text-center text-xl font-semibold tracking-tight">Messages</h1>
        {link ? (
          <section aria-labelledby="link" className="bg-card grid gap-2 rounded-2xl border p-4">
            <h2 id="link" className="font-medium">Invite link</h2>
            <p className="text-muted-foreground text-sm">Send this to your friend. Once they accept it while signed in to Reflect, you can message each other. It works once, for 14 days, and is shown only now.</p>
            <CopyLink path={`/friends/join/${link}`} />
          </section>
        ) : null}
        {threads === null ? (
          <p className="text-muted-foreground text-center text-sm">Messages are not set up here yet.</p>
        ) : (
          <Group title="People you can message" id="people">
            {threads.length ? null : <li className="text-muted-foreground px-4 py-4 text-sm">Members of your household with their own login are here. Invite a friend to message them too.</li>}
            {threads.map((t) => (
              <Row key={t.id} href={hrefFor(t.id)} icon={<Initials name={t.name} size="size-9 text-sm" />} label={t.name} sub={t.last ? `${t.last.you ? "You: " : ""}${t.last.text}` : t.via === "household" ? "Household" : "Friend"} {...(t.last ? { value: when(t.last.at) } : {})} />
            ))}
            <ActionRow icon={<UserPlusIcon />} label="Invite a friend" action={inviteFriendAction} />
          </Group>
        )}
        <p className="text-muted-foreground text-center text-xs">Only you and the person you write to see a conversation. Reflect reads your messages only when you ask it about them. Your journal is never shared.</p>
      </div>
    </main>
  );
}
