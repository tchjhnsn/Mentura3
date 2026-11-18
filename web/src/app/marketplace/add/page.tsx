import type { Metadata } from "next";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireUser } from "@/server/session";
import { addCustomAction } from "../actions";

export const metadata: Metadata = { title: "Add a connector" };
export const dynamic = "force-dynamic";
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** Add any remote MCP server by its address, the way Claude's custom connectors work. */
export default async function AddConnector({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireUser();
  const error = one((await searchParams).error);
  return (
    <main className={PAGE}>
      <ThingHeader back="/marketplace" backLabel="Marketplace" crumbs={[{ label: "Marketplace", href: "/marketplace" }]} title="Add a connector" />
      <div className="mx-auto mt-8 grid w-full max-w-md gap-6 pb-16">
        <div className="grid gap-1 text-center">
          <h1 id="page-title" className="text-2xl font-semibold tracking-tight">Add a connector</h1>
          <p className="text-muted-foreground text-sm">Any service with a remote MCP server. You sign in on its own page.</p>
        </div>
        <form action={addCustomAction} className="grid gap-3">
          <Input name="url" type="url" required placeholder="https://example.com/mcp" aria-label="Server address" autoCapitalize="none" spellCheck={false} />
          <Input name="name" placeholder="Name (optional)" aria-label="Name" maxLength={60} />
          {error ? <p className="text-destructive text-sm" role="alert">{error}</p> : null}
          <Button type="submit" size="lg" className="w-full">Connect</Button>
        </form>
        <p className="text-muted-foreground text-center text-xs">Only add servers you trust. Reflect asks before any of its tools changes something.</p>
      </div>
    </main>
  );
}
