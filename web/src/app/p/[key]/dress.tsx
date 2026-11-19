import type { ReactNode } from "react";
import { blockFrameClass, blockShapeClass } from "@reflect/virtu/blocks";
import { cn } from "@/lib/utils";

/**
 * A block's shape and frame (the Virtu plugin's per-block options, plan "Appearance, Virtu and the site editor"): the
 * wrapper carries the scope classes Virtu's block CSS matches (packages/virtu/src/blocks.ts), and the component puts
 * the surface classes on what it draws. With neither, the block is drawn as it is.
 */
export function Dress({ shape, frame, children }: { shape: unknown; frame: unknown; children: ReactNode }) {
  const s = typeof shape === "string" ? shape : null;
  const f = typeof frame === "string" ? frame : null;
  if (!s && !f) return <>{children}</>;
  return <div data-block-look="" className={cn(s && blockShapeClass(s), f && blockFrameClass(f))}>{children}</div>;
}
