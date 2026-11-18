import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { appOf, isLifeApp, kindOf, titleOf } from "@reflect/core/life";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { requireUser } from "@/server/session";
import { lifeActs, lifeRecord } from "@/server/life-store";
import { draftVenture } from "@reflect/core/naive-venture";
import { seedOf } from "@/server/actions/ventures";
import { ventureFiles } from "@/server/venture-files-store";
import { RecordPanel } from "../../record";
import { VentureFiles } from "../../venture-files";
import { BuildPeople } from "../../build-people";
import { peopleToBuildWith } from "@/server/actions/build";

export const metadata: Metadata = { title: "Reflect" };
export const dynamic = "force-dynamic";

/** One record in an app: its state, its fields, what was done with it, and writing about it in the journal. */
export default async function LifeRecordPage({ params }: { params: Promise<{ app: string; id: string }> }) {
  const user = await requireUser();
  const { app, id } = await params;
  if (!isLifeApp(app)) notFound();
  const record = await lifeRecord(user.id, id);
  if (!record || record.app !== app) notFound();
  const kind = kindOf(app, record.kind);
  if (!kind) notFound();
  const acts = await lifeActs(user.id, id);
  // A venture keeps its files in Naive's layout (2026-11-18); before it is started, the draft Keep would keep.
  const venture = app === "ventures" && kind.id === "venture";
  const files = venture ? await ventureFiles(user.id, id) : [];
  // People to build with (Events and connections, 2026-11-18), under Files.
  const builders = venture ? (await peopleToBuildWith(user.id, id)).people : [];
  const title = titleOf(kind, record.body);
  const list = `/life/${app}?k=${kind.id}`;
  return (
    <main className={PAGE}>
      <ThingHeader back={list} backLabel={kind.plural} crumbs={[{ label: "Home", href: "/" }, { label: appOf(app).label, href: `/life/${app}` }, { label: kind.plural, href: list }]} title={title} />
      <div className="mt-4 grid max-w-4xl gap-6">
        <div>
          <p className="text-muted-foreground text-xs tracking-wide uppercase">{kind.label}</p>
          <h1 id="page-title" className="mt-1 scroll-mt-20 text-3xl font-semibold tracking-tight">{title}</h1>
        </div>
        <RecordPanel app={app} kind={kind} record={record} acts={acts} back={`/life/${app}/${id}`} />
        {venture ? <VentureFiles venture={id} files={files} draft={files.length ? [] : draftVenture(seedOf(record))} /> : null}
        {venture ? <BuildPeople venture={id} people={builders} /> : null}
      </div>
    </main>
  );
}
