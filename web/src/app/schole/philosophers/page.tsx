import type { Metadata } from "next";
import Link from "next/link";
import { PHILOSOPHERS } from "@reflect/core/philosophers";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { requireUser } from "@/server/session";
import { facesOf } from "@/server/topics";
import { LEARN } from "../crumbs";
import { CoverImg } from "../cover-img";

export const metadata: Metadata = { title: "Philosophers" };
export const dynamic = "force-dynamic";

/** Every philosopher with a page of their own. */
export default async function Philosophers() {
  await requireUser();
  const faces = await facesOf(PHILOSOPHERS);
  return (
    <main className={PAGE}>
      <ThingHeader back="/schole/browse" crumbs={[LEARN, { label: "Browse", href: "/schole/browse" }]} title="Philosophers" />
      <h1 id="page-title" className="mt-6 text-3xl font-semibold tracking-tight">Philosophers</h1>
      <ul className="mt-6 max-w-3xl divide-y">
        {PHILOSOPHERS.map((x, n) => (
          <li key={x.id}>
            <Link href={`/schole/philosophers/${x.id}`} className="hover:bg-muted/60 -mx-2 flex items-center gap-3 rounded-lg px-2 py-3">
              <span className="bg-muted relative block size-12 shrink-0 overflow-hidden rounded-full border">{faces[n]?.image ? <CoverImg src={faces[n]!.image!} className="absolute inset-0 size-full object-cover object-top" /> : null}</span>
              <span className="min-w-0">
                <span className="block font-medium">{x.name}</span>
                <span className="text-muted-foreground block truncate text-[13px]">{x.born} to {x.died} · {x.what}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
