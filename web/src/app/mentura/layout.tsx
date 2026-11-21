import type { ReactNode } from "react";
import { NumProvider } from "@/components/studio/bits";
import { MenturaFrame } from "@/components/mentura/frame";

export const metadata = { title: "Mentura" };

/** Mentura: where founders and investors meet and talk in public about what they make and do, after Contra. A
 * clickable prototype on mock data for now (src/components/mentura/data.ts; README, "Mentura"). */
export default function MenturaLayout({ children }: { children: ReactNode }) {
  return <NumProvider><MenturaFrame>{children}</MenturaFrame></NumProvider>;
}
