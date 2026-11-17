import type { Metadata } from "next";
import { CheckIcon, DropletsIcon, ShieldAlertIcon } from "lucide-react";
import { NRI_SOURCE, SDWIS_SOURCE, STATES } from "@reflect/core/public-data";
import { FieldInput } from "@/app/life/record";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { placeRecord, waterSystems } from "@/server/public-data";
import { requireUser } from "@/server/session";
import { chooseWaterAction, savePlaceAction } from "../actions";
import { COLUMN, Group, Row } from "../list";

export const metadata: Metadata = { title: "Where you live" };
export const dynamic = "force-dynamic";
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** Settings, Where you live: the county and state, then the water system, chosen from EPA's list for the county. */
export default async function PlacePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const error = one((await searchParams).error).slice(0, 200);
  const p = await placeRecord(user.id);
  const systems = p?.state && p.county ? await waterSystems(p.state, p.county) : [];
  const body = { county: p?.county ?? "", state: p?.state ?? "" };
  return (
    <main className={PAGE}>
      <ThingHeader back="/settings" backLabel="Settings" crumbs={[{ label: "Settings", href: "/settings" }]} title="Where you live" />
      <div className={COLUMN}>
        <div className="grid gap-1 text-center">
          <h1 id="page-title" className="text-xl font-semibold tracking-tight">Where you live</h1>
          <p className="text-muted-foreground text-sm">Public data about your county and your water, read from FEMA and the EPA.</p>
        </div>

        <Group title="County" id="county">
          <li className="px-4 py-4">
            <form action={savePlaceAction} className="grid gap-4">
              <FieldInput f={{ key: "state", label: "State", kind: "choice", options: STATES.map(([id, label]) => ({ id, label })) }} body={body} />
              <FieldInput f={{ key: "county", label: "County", kind: "text", hint: "Travis" }} body={body} />
              {error ? <p role="alert" className="text-destructive text-sm">{error}</p> : null}
              <div><Button type="submit" variant={p ? "outline" : "default"}>{p ? "Change" : "Save"}</Button></div>
            </form>
          </li>
        </Group>

        {p?.county ? (
          <Group title="Your water system" id="water">
            {systems.length ? systems.slice(0, 12).map((s) => (
              <li key={s.pwsid}>
                <form action={chooseWaterAction.bind(null, s.pwsid, s.name, s.served)}>
                  <button type="submit" className="hover:bg-accent flex min-h-14 w-full items-center gap-4 px-4 py-3 text-left transition" aria-pressed={p.pwsid === s.pwsid}>
                    <span className="grid min-w-0 flex-1">
                      <span className="truncate text-base">{s.name}</span>
                      <span className="text-muted-foreground text-sm">{s.served ? `Serves ${s.served.toLocaleString("en-US")}` : s.pwsid}</span>
                    </span>
                    {p.pwsid === s.pwsid ? <CheckIcon aria-label="Chosen" className="text-primary size-5 shrink-0" /> : null}
                  </button>
                </form>
              </li>
            )) : <li className="text-muted-foreground px-4 py-4 text-sm">The EPA lists no community water system for {p.county} County. A private well has no public record.</li>}
          </Group>
        ) : null}

        {p?.county ? (
          <Group title="What it feeds" id="feeds">
            <Row href="/life/home?k=safety" icon={<ShieldAlertIcon />} label="Safety" sub={NRI_SOURCE.name} />
            <Row href="/life/home?k=water" icon={<DropletsIcon />} label="Water" sub={SDWIS_SOURCE.name} />
          </Group>
        ) : null}
      </div>
    </main>
  );
}
