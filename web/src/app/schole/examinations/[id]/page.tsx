import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PAGE } from "@/components/page-header";
import { requireUser } from "@/server/session";
import { getExamination } from "@/server/examination-store";
import { TaskHeader } from "@/components/headers";
import { closeExaminationAction } from "../actions";
import { CopyLink } from "../copy-link";
import { ExamRecord } from "../record";

export const metadata: Metadata = { title: "Examination" };
export const dynamic = "force-dynamic";

/** Your examination: the link to invite examiners and the record as it stands. */
export default async function ExaminationPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const e = await getExamination(user.id, id);
  if (!e) notFound();
  return (
    <main className={PAGE}>
      <TaskHeader back={{ href: `/schole/courses?u=${encodeURIComponent(e.courseUrl)}&t=${encodeURIComponent(e.courseTitle)}`, label: "Back to the course" }} title={e.courseTitle} position={`Examination, ${e.status === "open" ? "open" : "closed"}`} />
      <div className="mt-6 max-w-3xl space-y-8">
        <header className="space-y-1">
          <h1 id="page-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">Your examination</h1>
          <p className="text-muted-foreground text-[13px]">{e.courseTitle} · {e.status === "open" ? "Open" : "Closed"} · {e.examiners.length} {e.examiners.length === 1 ? "examiner" : "examiners"}</p>
        </header>
        {e.status === "open" ? (
          <>
            <section className="space-y-2">
              <h2 className="text-base font-semibold">Invite your examiners</h2>
              <p className="text-muted-foreground max-w-prose text-[13px]">Send this link to the people you ask to examine you. They sign in, give their name and join; up to 12 can. You meet and talk it through in person, and each attests here afterwards.</p>
              <CopyLink path={`/schole/examine/${e.token}`} />
            </section>
          </>
        ) : null}
        <ExamRecord e={e} me={user.id} />
        {e.status === "open" ? (
          <form action={closeExaminationAction} className="space-y-2 border-t pt-6">
            <input type="hidden" name="id" value={e.id} />
            <p className="text-muted-foreground text-[13px]">Closing keeps the record as it stands; nobody can join or attest after.</p>
            <Button type="submit" variant="ghost" size="sm" className="-ml-3">Close the examination</Button>
          </form>
        ) : null}
      </div>
    </main>
  );
}
