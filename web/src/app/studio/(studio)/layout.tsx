import type { ReactNode } from "react";
import { StudioFrame } from "@/components/studio/shell";

/** Studio screens (S1 to S7): the frame with the studio nav (C3), no agent panel. */
export default function StudioPages({ children }: { children: ReactNode }) {
  return <StudioFrame>{children}</StudioFrame>;
}
