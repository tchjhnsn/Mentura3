import "./globals.css";
import type { CSSProperties, ReactNode } from "react";
import { Inter, Newsreader } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RememberPage } from "@/components/settings-panel";
import { SidebarProvider, type SidebarGroup, type SidebarPlaces, type SidebarTile } from "@/components/sidebar";
import { SIDE_COOKIE, sideOf } from "@/components/sidebar-state";
import { CHAT_PROMPT, readChatPart } from "@reflect/core/chat-journal";
import { GROUPS } from "@reflect/core/plan";
import { listEntries } from "@/server/journal-store";
import { currentUser, isGuest } from "@/server/session";
import { PATH_HEADER } from "@/server/guest-wall";
import { selfOf } from "@/server/profile-store";
import { cookies, headers } from "next/headers";
import { cookieDomain, polisOrigin, siteUrl } from "@/server/site";
import { APPEARANCE_BUTTON_COOKIE, LOOK_COOKIE, appearanceButtonOn, lookOf, themeOf, themeVars } from "@/lib/themes";
import { AppearanceButton } from "@/components/appearance-button";
import { AppearanceSlot } from "@/components/slots";
import { FOLDED, GLYPHS, hrefOf, MINE } from "./home-tiles";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
// The journal's writing face.
const serif = Newsreader({ subsets: ["latin"], variable: "--font-serif", display: "swap", style: ["normal", "italic"] });

export const metadata = { title: "Reflect", description: "Your life, in your own records." };

const tileOf = (id: string): SidebarTile[] => { const t = MINE.find((x) => x.id === id); const href = t && hrefOf(t); return t && href ? [{ id, label: t.label, href, glyph: GLYPHS[id] ?? "" }] : []; };
/** Standing and Polis live on the shared side (doc "Private and shared Reflect plan", 2026-11-19). */
// The village and polis group lives only on the shared side's sidebar (Torian, 2026-11-19: "I don't know why Village
// and Polis is still in the Home app"); Home's sidebar keeps the person and the household.
const POLIS_TILES = GROUPS.find((g) => g.id === "village")?.tiles ?? [];
// Home's sidebar keeps the main dashboard's groups, less the tiles that moved to Village and polis.
const GROUPED: SidebarGroup[] = GROUPS.filter((g) => g.id !== "village").map((g) => ({ label: g.label, tiles: g.tiles.filter((id) => !FOLDED.includes(id)).flatMap(tileOf) }));
const POLIS: SidebarTile[] = POLIS_TILES.flatMap(tileOf);

/** Every page in shadcn's look (src/app/globals.css), with the sidebar kept once for the whole app when someone is signed in. */
export default async function RootLayout({ children, modal }: { children: ReactNode; /** Settings over the page (app/@modal). */ modal: ReactNode }) {
  const user = await currentUser().catch(() => null);
  const head = await headers();
  // A guest account (made from a meeting invite) and an invite link (/m/<token>) get no sidebar: they show only the
  // meeting (the guest wall, src/server/guest-wall.ts).
  const path = head.get(PATH_HEADER) ?? "";
  const bare = !user || path === "/m" || path.startsWith("/m/") || (await isGuest(user.id));
  const chats = user && !bare ? (await listEntries(user.id, 40).catch(() => [])).filter((e) => e.promptId === CHAT_PROMPT).slice(0, 5).map((c) => ({ id: c.id, title: c.parts.map((p) => readChatPart(p.text)).find((m) => m.who === "you")?.text ?? "A chat" })) : [];
  // Their face at the foot of the sidebar opens their own profile (Profiles, 2026-11-18).
  const me = user && !bare ? await selfOf(user.id).catch(() => ({ name: "You", href: `/p/${encodeURIComponent(user.id)}` })) : null;
  // The person's theme and background (src/lib/themes.ts), painted by the server so the first frame is already theirs.
  const jar = await cookies();
  const look = lookOf(jar.get(LOOK_COOKIE)?.value);
  // The sidebar, open or shut and how wide (src/components/sidebar.tsx), so the first frame is painted with them.
  const side = sideOf(jar.get(SIDE_COOKIE)?.value);
  // Which host this page came in on: Home's, or the shared side's own (src/lib/sides.ts).
  const polis = polisOrigin();
  const host = (head.get("host") ?? "").split(":")[0]!.toLowerCase();
  const places: SidebarPlaces = { hostSide: polis && host === new URL(polis).hostname ? "polis" : "home", home: siteUrl(), polis, cookieDomain: cookieDomain() };
  const today = new Date().toISOString().slice(0, 10);
  const theme = themeOf(look.theme, today);
  // The Appearance button (src/components/appearance-button.tsx): on this device when turned on, and only for someone signed in.
  const button = user && appearanceButtonOn(jar.get(APPEARANCE_BUTTON_COOKIE)?.value) ? <AppearanceButton look={look} today={today} site={<AppearanceSlot userId={user.id} />} /> : null;
  return (
    <html lang="en" data-theme={theme.id} data-bg={look.bg} data-mode={look.mode} style={themeVars(theme) as CSSProperties}
      className={`${sans.variable} ${serif.variable}${look.mode === "dark" ? " dark" : ""}`} suppressHydrationWarning>
      <head>
        {look.mode === "system" ? <script dangerouslySetInnerHTML={{ __html: "(()=>{const m=matchMedia('(prefers-color-scheme: dark)');const s=()=>document.documentElement.classList.toggle('dark',m.matches);s();m.addEventListener('change',s)})()" }} /> : null}
      </head>
      <body className="min-h-screen">
        <TooltipProvider>{user && !bare ? <SidebarProvider groups={GROUPED} polisTiles={POLIS} places={places} chats={chats} me={me} initial={side}>{children}{modal}</SidebarProvider> : <>{children}{modal}</>}<RememberPage />{button}</TooltipProvider>
      </body>
    </html>
  );
}
