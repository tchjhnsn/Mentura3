"use client";

// Settings as one panel over the page (Torian, 2026-11-19, from Claude's Settings modal): a list of sections on the
// left, the section on the right, Close at the top. Soft navigation to /settings/* or /marketplace/* opens it over the
// page the person was on (the @modal slot's intercepting routes); a full load shows the same panel on its own. Pages
// inside it keep their own header only below a section's root, and drop the sidebar and search buttons.
import { createContext, useContext, useEffect, type ComponentType, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BlocksIcon, GlobeIcon, HouseIcon, IdCardIcon, LayoutGridIcon, MapPinIcon, PaletteIcon, ShieldIcon, UserIcon, XIcon, HourglassIcon, WrenchIcon } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

type Section = { href: string; label: string; icon: ComponentType<{ className?: string }>; under: string[] };

/** The panel's sections, in groups, each with the paths that belong to it. */
export const SECTIONS: Section[][] = [
  [
    { href: "/settings/account", label: "Account", icon: UserIcon, under: ["/settings/account"] },
    { href: "/settings/profile", label: "Profile", icon: IdCardIcon, under: ["/settings/profile"] },
    { href: "/settings/privacy", label: "Privacy", icon: ShieldIcon, under: ["/settings/privacy"] },
    { href: "/settings/legacy", label: "Legacy", icon: HourglassIcon, under: ["/settings/legacy"] },
  ],
  [
    { href: "/settings/household", label: "Household", icon: HouseIcon, under: ["/settings/household", "/settings/member"] },
    { href: "/settings/place", label: "Where you live", icon: MapPinIcon, under: ["/settings/place"] },
  ],
  [
    { href: "/settings/appearance", label: "Appearance", icon: PaletteIcon, under: ["/settings/appearance"] },
    { href: "/settings/dashboard", label: "Dashboard", icon: LayoutGridIcon, under: ["/settings/dashboard"] },
    { href: "/settings/tools", label: "Tools", icon: WrenchIcon, under: ["/settings/tools"] },
  ],
  [
    { href: "/settings/site", label: "Your site", icon: GlobeIcon, under: ["/settings/site"] },
    { href: "/marketplace", label: "Marketplace", icon: BlocksIcon, under: ["/marketplace", "/settings/connections"] },
  ],
];
const ALL = SECTIONS.flat();

/** The section a path belongs to; /settings itself is Account. */
export const sectionOf = (path: string): Section | undefined => (path === "/settings" ? ALL[0] : ALL.find((s) => s.under.some((u) => path === u || path.startsWith(`${u}/`))));
/** Whether a path is a section's own page (its header is left out: the list on the left is the way back). */
export const isSectionRoot = (path: string) => path === "/settings" || ALL.some((s) => s.href === path);

const InPanel = createContext(false);
/** True inside the Settings panel: headers drop the sidebar and search buttons. */
export const useInPanel = () => useContext(InPanel);

// The last page outside Settings, where Close goes back to.
let behind = "/";
/** Kept in the root layout: remembers the last page outside Settings. */
export function RememberPage() {
  const path = usePathname();
  useEffect(() => {
    if (!path.startsWith("/settings") && !path.startsWith("/marketplace")) behind = `${path}${window.location.search}`;
  }, [path]);
  return null;
}

/** The panel. `modal`: over the page behind; otherwise on its own (a full load of a Settings address). */
export function SettingsPanel({ children, modal = false }: { children: ReactNode; modal?: boolean }) {
  const router = useRouter();
  const path = usePathname();
  const here = sectionOf(path);
  const close = () => router.push(behind);
  return (
    <DialogPrimitive.Root open modal onOpenChange={(o) => { if (!o) close(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={cn("fixed inset-0 z-50", modal ? "bg-black/50 backdrop-blur-[2px]" : "bg-background")} />
        <DialogPrimitive.Content aria-describedby={undefined} onOpenAutoFocus={(e) => e.preventDefault()}
          className="bg-background fixed inset-0 z-50 flex flex-col overflow-hidden outline-none sm:inset-auto sm:top-1/2 sm:left-1/2 sm:h-[min(85vh,860px)] sm:w-[min(94vw,1120px)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border sm:shadow-2xl">
          <div className="flex h-14 shrink-0 items-center justify-between border-b px-4 sm:px-5">
            <DialogPrimitive.Title className="text-base font-semibold">Settings</DialogPrimitive.Title>
            <button type="button" onClick={close} aria-label="Close settings" className="hover:bg-accent -mr-2 grid size-9 place-items-center rounded-lg"><XIcon className="size-5" /></button>
          </div>
          <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
            <nav aria-label="Settings" className="shrink-0 border-b sm:w-60 sm:overflow-y-auto sm:border-r sm:border-b-0 sm:p-3">
              <ul className="flex gap-1 overflow-x-auto px-3 py-2 sm:block sm:space-y-0.5 sm:overflow-visible sm:p-0">
                {SECTIONS.map((group, i) => [
                  i > 0 ? <li key={`sep${i}`} aria-hidden className="bg-border mx-2 my-2 hidden h-px sm:block" /> : null,
                  ...group.map((s) => {
                    const on = here?.href === s.href;
                    return (
                      <li key={s.href} className="shrink-0">
                        <Link href={s.href} aria-current={on ? "page" : undefined}
                          className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm whitespace-nowrap", on ? "bg-accent text-foreground font-medium" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground")}>
                          <s.icon className="size-4 shrink-0" />{s.label}
                        </Link>
                      </li>
                    );
                  }),
                ])}
              </ul>
            </nav>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <InPanel.Provider value>{children}</InPanel.Provider>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
