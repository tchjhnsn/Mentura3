import type { Metadata } from "next";
import { HomeIcon, MapPinIcon, PlugIcon, ShieldIcon, UserPlusIcon } from "lucide-react";
import { ARRANGEMENT_LABEL, arrangement } from "@reflect/core/household";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { db } from "@/db/pool";
import { householdOf } from "@/server/household-store";
import { placeRecord } from "@/server/public-data";
import { requireUser } from "@/server/session";
import { inviteAction, startHouseholdAction } from "./actions";
import { ActionRow, COLUMN, Group, Initials, Row } from "@/components/list-rows";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

/** Settings (doc "Tiles and their connections"): one vertical list; each row opens its own page. */
export default async function SettingsPage() {
  const user = await requireUser();
  const [who, h] = await Promise.all([db().query(`SELECT name, email FROM "user" WHERE id = $1`, [user.id]).then((r) => r.rows[0] as { name?: string; email?: string } | undefined), householdOf(user.id)]);
  const place = await placeRecord(user.id);
  const name = who?.name || "You";
  return (
    <main className={PAGE}>
      <ThingHeader back="/" backLabel="Home" crumbs={[{ label: "Home", href: "/" }]} title="Settings" />
      <div className={COLUMN}>
        <h1 id="page-title" className="text-center text-xl font-semibold tracking-tight">Settings</h1>

        <Group>
          <li className="flex items-center gap-4 px-4 py-4">
            <Initials name={name} size="size-14 text-lg" />
            <span className="grid min-w-0">
              <span className="truncate text-lg font-medium">{name}</span>
              <span className="text-muted-foreground truncate text-sm">{who?.email || "No email given"}</span>
            </span>
          </li>
          {h ? <ActionRow icon={<UserPlusIcon />} label="Invite someone to your household" action={inviteAction.bind(null, undefined)} /> : <ActionRow icon={<UserPlusIcon />} label="Set up your household" action={startHouseholdAction} />}
        </Group>

        <Group title="Your life" id="life">
          <Row href="/settings/household" icon={<HomeIcon />} label="Household" value={h ? `${ARRANGEMENT_LABEL[arrangement(h.members)]}, ${h.members.length}` : "Not set up"} />
          <Row href="/settings/place" icon={<MapPinIcon />} label="Where you live" value={place?.county ? `${place.county}, ${place.state}` : "Not set"} />
          <Row href="/settings/connections" icon={<PlugIcon />} label="Connections" value="None yet" />
        </Group>

        <Group title="Account" id="account">
          <Row href="/settings/privacy" icon={<ShieldIcon />} label="Privacy" />
        </Group>
      </div>
    </main>
  );
}
