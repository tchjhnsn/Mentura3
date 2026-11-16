import type { Metadata } from "next";
import { rankDialectics } from "@reflect/core/dialectics";
import { PAGE } from "@/components/page-header";
import { ThingHeader } from "@/components/headers";
import { requireUser } from "@/server/session";
import { keptWorks } from "@/server/kept-works";
import { listItems } from "@/server/ways-store";
import { LEARN } from "../../crumbs";
import { QuestionsGrid } from "../questions-grid";

export const metadata: Metadata = { title: "Questions" };
export const dynamic = "force-dynamic";

/** Every standing question Dialectic is arranged by, those drawing on works the person keeps first. */
export default async function QuestionsPage() {
  const user = await requireUser();
  const ranked = rankDialectics(keptWorks(await listItems(user.id).catch(() => [])));
  return (
    <main className={PAGE}>
      <ThingHeader back="/schole/dialectic" crumbs={[LEARN, { label: "Dialectic", href: "/schole/dialectic" }]} title="Questions" />
      <div className="mt-6 space-y-6">
        <header className="space-y-1">
          <h1 id="page-title" className="text-3xl font-semibold tracking-tight">Questions</h1>
          <p className="text-muted-foreground">Standing questions, with the recordings that argue them and where each side is argued in the works.</p>
        </header>
        <QuestionsGrid ranked={ranked} />
      </div>
    </main>
  );
}
