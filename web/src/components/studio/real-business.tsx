// A real business's Decisions (V15), read from Naive through src/app/studio/actions.ts: its open decisions from Naive's
// docket, each row with an anchor (#decision-<id>) that "Needs you" and the bottom bar's Stream open. Its Home (V1) is in
// ./needs.tsx. Server components; the prototype's sample businesses keep their own screens (sample.tsx beside each page).
import { ventureWithDocket } from "@/app/studio/actions";
import { ScreenHead } from "./shell";

export async function RealDecisions({ id, team }: { id: string; team: string }) {
  const r = await ventureWithDocket(id, team);
  if (!r.ok) return <Unreachable error={r.error} />;
  return (
    <div className="pb-16">
      <ScreenHead n="V15" title="Decisions" job="Calls only you can make, ranked by Naive's docket." />
      <div className="max-w-3xl px-4 md:px-8"><OpenByFunction docket={r.value.docket} /></div>
    </div>
  );
}

type Docket = Extract<Awaited<ReturnType<typeof ventureWithDocket>>, { ok: true }>["value"]["docket"];

function OpenByFunction({ docket }: { docket: Docket }) {
  const open = docket.functions.filter((f) => f.decisions.length);
  return (
    <section>
      <h2 className="text-sm font-semibold">Open decisions by function</h2>
      <p className="text-muted-foreground mt-1 text-xs">{docket.total} open in all</p>
      <div className="mt-2 space-y-3">
        {open.map((f) => (
          <div key={f.id} className="rounded-xl border p-4">
            <div className="text-sm font-semibold">{f.function}</div>
            <ul className="mt-2 space-y-1.5">{f.decisions.map((d) => <li key={d.id} id={`decision-${d.id}`} className="target:bg-accent -mx-2 scroll-mt-4 rounded-md px-2 py-0.5 text-sm">{d.question}</li>)}</ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function Unreachable({ error }: { error: string }) {
  return <p className="px-4 pt-8 text-sm md:px-8">{error}</p>;
}
