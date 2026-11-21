import { NumProvider } from "@/components/studio/bits";
import { ScholeFrame } from "@/components/schole/frame";
import { ScholeStore } from "@/components/schole/store";
import { ListenProvider } from "./player";

/** Scholē, rebuilt after Uxcel (2026-11-21): its own frame (src/components/schole/frame.tsx) around every Scholē page,
 * one shared audio player so a book keeps playing from page to page, and the course state (store.tsx). */
export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return <ListenProvider><NumProvider><ScholeStore><ScholeFrame>{children}</ScholeFrame></ScholeStore></NumProvider></ListenProvider>;
}
