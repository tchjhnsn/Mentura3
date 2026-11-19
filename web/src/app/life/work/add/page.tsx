import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireUser } from "@/server/session";
import { addOwnAction } from "../space-actions";

export const metadata: Metadata = { title: "Add an aim" };
export const dynamic = "force-dynamic";
const SELECT = "border-input bg-background h-9 rounded-md border px-3 text-sm";

/** Add an aim (doc "Work design guide", Interactions): browse work, imagine work, or name your own. Roles are Lives in Scholē (doc "Qualities design guide"). */
export default async function AddAimPage() {
  await requireUser();
  return (
    <main className={PAGE}>
      <ThingHeader back="/life/work" backLabel="Ergon" crumbs={[{ label: "Home", href: "/" }, { label: "Ergon", href: "/life/work" }]} title="Add an aim" />
      <div className="mt-4 grid max-w-3xl grid-cols-[minmax(0,1fr)] gap-8">
        <div className="grid gap-1">
          <h1 id="page-title" className="text-3xl font-semibold tracking-tight">Add an aim</h1>
          <p className="text-muted-foreground">Work you want to become able to do, paid or not. Star one as your main aim on its page.</p>
        </div>

        <section className="grid gap-2">
          <h2 className="text-lg font-semibold tracking-tight">Browse work</h2>
          <p className="text-muted-foreground text-sm">Jobs that exist, existed or are forming, and companies. Press It inspires me on one to keep it as an aim.</p>
          <div><Button asChild variant="outline"><Link href="/life/work/browse">Browse work</Link></Button></div>
        </section>

        <section className="grid gap-2">
          <h2 className="text-lg font-semibold tracking-tight">Imagine work</h2>
          <p className="text-muted-foreground text-sm">Work that does not exist yet, as you imagine it.</p>
          <div><Button asChild variant="outline"><Link href="/life/work?k=imagined">Imagine work</Link></Button></div>
        </section>

        <section id="own" className="grid scroll-mt-20 gap-2">
          <h2 className="text-lg font-semibold tracking-tight">Name your own</h2>
          <form action={addOwnAction} className="flex flex-wrap items-center gap-2">
            <Input name="title" placeholder="A job, a career or a venture" aria-label="Name of the work" className="h-9 max-w-sm" required />
            <select name="type" aria-label="Kind of work" className={SELECT} defaultValue="venture">
              <option value="job">Job</option><option value="career">Career</option><option value="venture">Venture</option><option value="other">Other</option>
            </select>
            <Button type="submit" variant="outline" size="icon" className="size-9 rounded-full" aria-label="Add it" title="Add it"><PlusIcon /></Button>
          </form>
        </section>
      </div>
    </main>
  );
}
