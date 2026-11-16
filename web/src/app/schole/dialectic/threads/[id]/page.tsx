import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PAGE } from "@/components/page-header";
import { ThingHeader } from "@/components/headers";
import { requireUser } from "@/server/session";
import { getThread, type Post } from "@/server/dialectic-store";
import { LEARN } from "../../../crumbs";
import { postAction, removePostAction } from "../../actions";
import { Face, WorkLine } from "../../parts";

export const metadata: Metadata = { title: "Thread" };
export const dynamic = "force-dynamic";

function Reply({ p, all, thread }: { p: Post; all: Post[]; thread: string }) {
  const kids = all.filter((x) => x.parentId === p.id);
  return (
    <li className="space-y-2">
      <div className="flex gap-3">
        <Face p={p.removed ? null : p.who} size={28} empty={p.removed} />
        <div className="min-w-0 flex-1 space-y-1">
          {p.removed ? <p className="text-muted-foreground text-sm italic">Taken down by its author.</p> : <>
            <p className="text-sm"><span className="font-medium">{p.who.name}</span></p>
            <p className="leading-relaxed whitespace-pre-line">{p.body}</p>
            <div className="flex items-center gap-1">
              <details className="group">
                <summary className="text-muted-foreground cursor-pointer text-sm">Reply</summary>
                <form action={postAction} className="mt-2 space-y-2"><input type="hidden" name="thread" value={thread} /><input type="hidden" name="parent" value={p.id} /><Textarea name="body" required rows={3} maxLength={4000} aria-label={`Reply to ${p.who.name}`} /><Button type="submit" variant="outline" size="sm">Reply</Button></form>
              </details>
              {p.mine ? <form action={removePostAction}><input type="hidden" name="thread" value={thread} /><input type="hidden" name="post" value={p.id} /><Button type="submit" variant="ghost" size="icon" className="size-7" aria-label="Take it down" title="Take it down"><Trash2Icon /></Button></form> : null}
            </div>
          </>}
        </div>
      </div>
      {kids.length ? <ul className="ml-6 space-y-4 border-l pl-4">{kids.map((k) => <Reply key={k.id} p={k} all={all} thread={thread} />)}</ul> : null}
    </li>
  );
}

/** A thread: a question answered in writing, with replies to replies. */
export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const t = await getThread(user.id, id);
  if (!t) notFound();
  const top = t.posts.filter((p) => !p.parentId);
  return (
    <main className={PAGE}>
      <ThingHeader back="/schole/dialectic" crumbs={[LEARN, { label: "Dialectic", href: "/schole/dialectic" }]} title={t.thread.question} />
      <div className="mt-6 max-w-2xl space-y-6">
        <header className="space-y-2">
          <p className="text-muted-foreground text-sm">Asked by {t.thread.who.name}</p>
          <h1 id="page-title" className="text-3xl leading-tight font-semibold tracking-tight">{t.thread.question}</h1>
          <WorkLine workId={t.thread.workId} />
          {t.thread.body ? <p className="leading-relaxed whitespace-pre-line">{t.thread.body}</p> : null}
        </header>
        <form action={postAction} className="space-y-2">
          <input type="hidden" name="thread" value={t.thread.id} />
          <Textarea name="body" required rows={4} maxLength={4000} placeholder="Your answer" aria-label="Your answer" />
          <Button type="submit">Answer</Button>
        </form>
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">{top.length ? (t.posts.length === 1 ? "1 reply" : `${t.posts.length} replies`) : "No answers yet"}</h2>
          <ul className="space-y-5">{top.map((p) => <Reply key={p.id} p={p} all={t.posts} thread={t.thread.id} />)}</ul>
        </section>
      </div>
    </main>
  );
}
