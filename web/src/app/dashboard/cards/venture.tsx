import Link from "next/link";
import { rankBuilders } from "@reflect/core/build";
import { buildCandidates, buildStatuses, incomingBuildRequests } from "@/server/build-store";
import { lifeRecords } from "@/server/life-store";
import { ventureFileCount } from "@/server/venture-files-store";
import { MemberFace } from "@/components/dash";
import { safe, Section, type Ctx } from "../parts";
import { ventureInProgress, ventureNext } from "../tiles";

const STAGE: Record<string, string> = { idea: "An idea", starting: "Starting", operating: "Operating" };

/** Venture: the one in progress, its next step, and up to three faces of people to build with. Nothing without one. */
export async function VentureCard({ ctx }: { ctx: Ctx }) {
  const v = ventureInProgress(await safe(lifeRecords(ctx.userId, "ventures"), []));
  if (!v) return null;
  const [files, candidates, status, asked] = await Promise.all([
    safe(ventureFileCount(ctx.userId, v.id), 0),
    safe(buildCandidates(ctx.userId), { interests: [], list: [] }),
    safe(buildStatuses(ctx.userId, v.id), new Map()),
    safe(incomingBuildRequests(ctx.userId), []),
  ]);
  const people = rankBuilders(ctx.userId, candidates.interests, candidates.list, status);
  const notAsked = people.filter((p) => p.status !== "yes" && p.status !== "requested").length;
  const next = ventureNext(v, { files, notAsked });
  const href = `/life/ventures/${v.id}`;
  return (
    <Section title="Venture" href="/life/ventures" more="Ventures">
      <Link href={href} className="bg-card hover:bg-accent grid gap-3 rounded-xl border p-4 transition">
        <span className="grid gap-0.5">
          <span className="text-muted-foreground text-sm font-medium">{STAGE[v.state ?? ""] ?? "Venture"}</span>
          <span className="text-xl font-semibold break-words">{String(v.body.name || "A venture")}</span>
          {next ? <span className="text-muted-foreground text-sm">{next}</span> : null}
        </span>
        {people.length ? (
          <span className="flex items-center gap-3">
            <span className="flex -space-x-2">
              {people.slice(0, 3).map((p) => <span key={p.id} className="ring-card rounded-full ring-2" title={p.name}><MemberFace name={p.name} image={p.image} size={36} /></span>)}
            </span>
            <span className="text-muted-foreground min-w-0 truncate text-sm">
              {people.length === 1 ? `${people[0]!.name} builds too` : `${people.length} people to build with`}
            </span>
          </span>
        ) : null}
      </Link>
      {asked.length ? (
        <Link href="/v/people" className="text-muted-foreground hover:text-foreground px-2 text-sm">
          {asked.length === 1 ? `${asked[0]!.from.name} asked you to build ${asked[0]!.venture.name}` : `${asked.length} people asked you to build with them`}
        </Link>
      ) : null}
    </Section>
  );
}
