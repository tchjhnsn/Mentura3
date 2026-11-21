import type { ReactNode } from "react";
import { StudioFrame } from "@/components/studio/shell";

/** Screens inside one venture: the frame with the venture nav (C4), led by the venture's agents. */
export default function VenturePages({ children }: { children: ReactNode }) {
  return <StudioFrame>{children}</StudioFrame>;
}
