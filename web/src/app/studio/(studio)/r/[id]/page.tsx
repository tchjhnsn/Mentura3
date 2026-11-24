// A real venture in the Studio: its name and phase from venture.json and what it needs decided next, from Naive's
// docket, read through src/server/naive.ts. The sample venture pages under /studio/v/ stay as the design prototype.
import Link from "next/link";
import { ArrowLeftIcon, FolderIcon } from "lucide-react";
import { ventureWithDocket } from "../../../actions";

export const dynamic = "force-dynamic";

export default async function RealVenture({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await ventureWithDocket(decodeURIComponent(id));
  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-6 md:px-8">
      <Link href="/studio" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs"><ArrowLeftIcon className="size-3.5" />Studio</Link>
      {!r.ok ? (
        <p className="mt-6 text-sm">{r.error}</p>
      ) : (
        <>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">{r.value.venture.name}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            <span className="capitalize">{r.value.venture.phase}</span>
            {r.value.venture.founder ? <> · founded by {r.value.venture.founder}</> : null}
          </p>
          <Link href={`/studio/r/${encodeURIComponent(id)}/files`} className="hover:bg-accent mt-4 inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm"><FolderIcon className="size-4" />Files</Link>

          <section className="mt-8">
            <h2 className="text-sm font-semibold">Needs you next</h2>
            {r.value.docket.next ? (
              <div className="bg-card mt-2 rounded-xl border p-4">
                <div className="text-muted-foreground text-xs">{r.value.docket.next.function}</div>
                <p className="mt-0.5 font-medium">{r.value.docket.next.question}</p>
                {r.value.docket.next.why.length ? <p className="text-muted-foreground mt-2 text-sm">{r.value.docket.next.why.join(" ")}</p> : null}
              </div>
            ) : (
              <p className="text-muted-foreground mt-2 text-sm">Nothing is waiting on you.</p>
            )}
          </section>

          <section className="mt-8">
            <h2 className="text-sm font-semibold">Open decisions by function</h2>
            <p className="text-muted-foreground mt-1 text-xs">{r.value.docket.total} open in all</p>
            <div className="mt-2 space-y-3">
              {r.value.docket.functions.filter((f) => f.decisions.length).map((f) => (
                <div key={f.id} className="rounded-xl border p-4">
                  <div className="text-sm font-semibold">{f.function}</div>
                  <ul className="mt-2 space-y-1.5">
                    {f.decisions.map((d) => <li key={d.id} className="text-sm">{d.question}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
