import type { ReactNode } from "react";
import { NumProvider } from "@/components/studio/bits";

export const metadata = { title: "Venture Studio" };

/** The Venture Studio: an app of its own inside Mentura, with mock data for now (README, "Venture Studio"). */
export default function StudioLayout({ children }: { children: ReactNode }) {
  return <NumProvider>{children}</NumProvider>;
}
