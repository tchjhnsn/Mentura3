import type { Metadata } from "next";
import { AtSignIcon, DownloadIcon, EyeIcon, IdCardIcon, KeyRoundIcon, ShieldIcon, Trash2Icon, UserIcon, UserRoundIcon } from "lucide-react";
import { AUDIENCES } from "@reflect/core/profile";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { COLUMN, Group, Row } from "@/components/list-rows";
import { requireUser } from "@/server/session";
import { profileSettings } from "@/server/profile-store";
import { nameOf, signInLabel, signInMethods } from "@/server/account-store";

export const metadata: Metadata = { title: "Account" };
export const dynamic = "force-dynamic";

/** Settings, Account (doc "Profiles and accounts design guide", 2026-11-18): one row per part of the account; each opens its own page. */
export default async function AccountPage() {
  const user = await requireUser();
  const [s, name, methods] = await Promise.all([profileSettings(user.id), nameOf(user.id), signInMethods(user.id)]);
  const address = `/p/${encodeURIComponent(s.handle ?? user.id)}`;
  return (
    <main className={PAGE}>
      <ThingHeader search={false} back="/settings" backLabel="Settings" crumbs={[{ label: "Settings", href: "/settings" }]} title="Account" />
      <div className={COLUMN}>
        <h1 id="page-title" className="text-center text-xl font-semibold tracking-tight">Account</h1>

        <Group title="Profile" id="profile">
          <Row href={address} icon={<UserRoundIcon />} label="Profile" value={<span className="block max-w-40 truncate sm:max-w-64">{address}</span>} />
          <Row href="/settings/account/handle" icon={<AtSignIcon />} label="Handle" value={s.handle ? `@${s.handle}` : "Not set"} />
          <Row href="/settings/account/name" icon={<UserIcon />} label="Name and face" value={<span className="block max-w-40 truncate sm:max-w-64">{name || "Not set"}</span>} />
          <Row href="/settings/account/audience" icon={<EyeIcon />} label="Who sees your profile" sub={AUDIENCES.find((a) => a.id === s.audience)?.label} />
          <Row href="/settings/profile?back=/settings/account" icon={<IdCardIcon />} label="What people see at events" />
        </Group>

        <Group title="Sign-in and data" id="data">
          <Row href="/settings/account/sign-in" icon={<KeyRoundIcon />} label="Sign-in" value={signInLabel(methods)} />
          <Row href="/settings/privacy" icon={<ShieldIcon />} label="Privacy" />
          <li>
            <a href="/api/account/export" download className="hover:bg-accent flex min-h-14 w-full items-center gap-4 px-4 py-3 text-left transition">
              <span className="text-muted-foreground grid min-w-6 shrink-0 place-items-center [&>svg]:size-5"><DownloadIcon /></span>
              <span className="grid min-w-0 flex-1">
                <span className="truncate text-base">Download your data</span>
                <span className="text-muted-foreground truncate text-sm">A zip of what you keep in Reflect</span>
              </span>
            </a>
          </li>
        </Group>

        <Group title="Delete" id="delete">
          <Row href="/settings/account/delete" icon={<Trash2Icon />} label="Delete account" sub="Your sign-in and the teams only you are on" />
        </Group>
      </div>
    </main>
  );
}
