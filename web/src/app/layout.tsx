import "./globals.css";
import type { CSSProperties, ReactNode } from "react";
import { Inter, Newsreader } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, type SidebarGroup } from "@/components/sidebar";
import { CHAT_PROMPT, readChatPart } from "@reflect/core/chat-journal";
import { GROUPS } from "@reflect/core/plan";
import { listEntries } from "@/server/journal-store";
import { currentUser } from "@/server/session";
import { cookies } from "next/headers";
import { LOOK_COOKIE, lookOf, themeOf, themeVars } from "@/lib/themes";
import { GLYPHS, hrefOf, MINE } from "./home-tiles";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
// The journal's writing face.
const serif = Newsreader({ subsets: ["latin"], variable: "--font-serif", display: "swap", style: ["normal", "italic"] });

export const metadata = { title: "Reflect", description: "Your life, in your own records." };

// The sidebar's tiles, in the main dashboard's three groups.
const GROUPED: SidebarGroup[] = GROUPS.map((g) => ({ label: g.label, tiles: g.tiles.flatMap((id) => { const t = MINE.find((x) => x.id === id); const href = t && hrefOf(t); return t && href ? [{ id, label: t.label, href, glyph: GLYPHS[id] ?? "" }] : []; }) }));

/** Every page in shadcn's look (src/app/globals.css), with the sidebar kept once for the whole app when someone is signed in. */
export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await currentUser().catch(() => null);
  const chats = user ? (await listEntries(user.id, 40).catch(() => [])).filter((e) => e.promptId === CHAT_PROMPT).slice(0, 5).map((c) => ({ id: c.id, title: c.parts.map((p) => readChatPart(p.text)).find((m) => m.who === "you")?.text ?? "A chat" })) : [];
  // The person's theme and background (src/lib/themes.ts), painted by the server so the first frame is already theirs.
  const look = lookOf((await cookies()).get(LOOK_COOKIE)?.value);
  const theme = themeOf(look.theme, new Date().toISOString().slice(0, 10));
  return (
    <html lang="en" data-theme={theme.id} data-bg={look.bg} data-mode={look.mode} style={themeVars(theme) as CSSProperties}
      className={`${sans.variable} ${serif.variable}${look.mode === "dark" ? " dark" : ""}`} suppressHydrationWarning>
      <head>
        {look.mode === "system" ? <script dangerouslySetInnerHTML={{ __html: "(()=>{const m=matchMedia('(prefers-color-scheme: dark)');const s=()=>document.documentElement.classList.toggle('dark',m.matches);s();m.addEventListener('change',s)})()" }} /> : null}
      </head>
      <body className="min-h-screen">
        <TooltipProvider>{user ? <SidebarProvider groups={GROUPED} chats={chats}>{children}</SidebarProvider> : children}</TooltipProvider>
      </body>
    </html>
  );
}
