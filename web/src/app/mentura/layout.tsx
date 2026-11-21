import type { ReactNode } from "react";
import { NumProvider } from "@/components/studio/bits";
import { MenturaFrame } from "@/components/mentura/frame";
import { MenturaStore } from "@/components/mentura/store";

export const metadata = { title: "Mentura" };

/** Mentura: where founders and investors meet and talk in public about what they make and do, after Contra. A
 * clickable prototype on mock data for now (src/components/mentura/data.ts; README, "Mentura"); what you do in it is
 * kept in this browser (store.tsx). The AI chat (M3) talks to the real model through /api/chat. */
export default function MenturaLayout({ children }: { children: ReactNode }) {
  return <NumProvider><MenturaStore><MenturaFrame>{children}</MenturaFrame></MenturaStore></NumProvider>;
}
