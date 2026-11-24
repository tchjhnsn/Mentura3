import type { ReactNode } from "react";
import { ventureDetail } from "@/app/studio/actions";
import { BusinessSeen } from "@/components/studio/business";
import { realBusiness } from "@/components/studio/business-data";
import { isSample } from "@/components/studio/data";
import { StudioFrame } from "@/components/studio/shell";

export const dynamic = "force-dynamic";

/** Screens inside one business: the frame, and for a real business its name and functions read from Naive once, for
 * the sidebar (C4, C25) and the top bar. A sample business is known to them already. */
export default async function VenturePages({ children, params }: { children: ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const real = isSample(slug) ? null : await ventureDetail(decodeURIComponent(slug));
  return (
    <StudioFrame>
      {real?.ok ? <BusinessSeen value={realBusiness(real.value)} /> : null}
      {children}
    </StudioFrame>
  );
}
