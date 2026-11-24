import type { ReactNode } from "react";
import { NumProvider } from "@/components/studio/bits";

export const metadata = { title: "Business Studio" };

/** The Venture Studio: an app of its own inside Mentura. The home screen reads and creates real Naive ventures (src/server/naive.ts); the screens inside a sample venture are still mock data (README, "Venture Studio"). */
export default function StudioLayout({ children }: { children: ReactNode }) {
  return <NumProvider>{children}</NumProvider>;
}
