import type { Metadata } from "next";
import { cookies } from "next/headers";
import { HomeIcon, IdCardIcon, LayoutDashboardIcon, MapPinIcon, PaletteIcon, PlugIcon, ShieldIcon, UserPlusIcon } from "lucide-react";
import { BACKGROUNDS, LOOK_COOKIE, lookOf, seasonalTheme, THEMES } from "@/lib/themes";
import { ARRANGEMENT_LABEL, arrangement } from "@reflect/core/household";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { db } from "@/db/pool";
import { householdOf } from "@/server/household-store";
import { placeRecord } from "@/server/public-data";
import { connections } from "@/server/connections-store";
import { requireUser } from "@/server/session";
import { inviteAction, startHouseholdAction } from "./actions";
import { ActionRow, COLUMN, Group, Initials, Row } from "@/components/list-rows";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

/** Settings (doc "Tiles and their connections"): one vertical list; each row opens its own page. */
export default async function SettingsPage() {
  const user = await requireUser();
  const [who, h] = await Promise.all([db().query(`SELECT name, email FROM "user" WHERE id = $1`, [user.id]).then((r) => r.rows[0] as { name?: string; email?: string } | undefined), householdOf(user.id)]);
  const [place, links] = await Promise.all([placeRecord(user.id), connections(user.id)]);
  const linked = links.filter((l) => l.state === "connected").length;
  const name = who?.name || "You";
  const look = lookOf((await cookies()).get(LOOK_COOKIE)?.value);
  const themeName = look.theme === "season" ? `Season, ${seasonalTheme(new Date().toISOString().slice(0, 10)).label}` : THEMES.find((t) => t.id === look.theme)?.label;
  const lookValue = [themeName, look.bg !== "plain" ? BACKGROUNDS.find((b) => b.id === look.bg)?.label : null].filter(Boolean).join(", ");
  return (
    <main className={PAGE}>
      <ThingHeader search={false} back="/" backLabel="Home" crumbs={[{ label: "Home", href: "/" }]} title="Settings" />
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
          <Row href="/settings/connections" icon={<PlugIcon />} label="Connections" value={linked ? `${linked} connected` : "None yet"} />
        </Group>

        <Group title="Look" id="look">
          <Row href="/settings/appearance" icon={<PaletteIcon />} label="Appearance" value={lookValue} />
          <Row href="/settings/dashboard" icon={<LayoutDashboardIcon />} label="Dashboard" value="Morning brief" />
        </Group>

        <Group title="Account" id="account">
          <Row href="/settings/account" icon={<IdCardIcon />} label="Profile" />
          <Row href="/settings/privacy" icon={<ShieldIcon />} label="Privacy" />
        </Group>
      </div>
    </main>
  );
}
