import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import { slotFill, type SlotName } from "@reflect/core/marketplace";
import { pluginsOf } from "@/server/plugins";
import { VirtuColour, VirtuDesign, VirtuDesignSections, VirtuLooks, VirtuShape, VirtuType } from "@/components/virtu-sections";

/*
 * Slots (Torian, 2026-11-19, "Appearance, Virtu and the site editor: plan"): named places in Reflect's interface that
 * plugins fill (packages/core/src/marketplace.ts, MarketPlugin.slots). A surface asks which sections to draw for a slot
 * from the person's added plugins and draws them from this map. Only plugins whose code ships in Reflect fill slots:
 * the ones in the map. Server only; the sections themselves are client components.
 */

type PluginCode = {
  /** Wraps one plugin's sections, holding what they share (Virtu: the design being edited, its check and Publish). */
  frame?: ComponentType<{ children: ReactNode }>;
  sections: Partial<Record<string, ComponentType>>;
};

/** The code for each plugin that fills slots, by plugin, then section. */
export const SLOT_CODE: Record<string, PluginCode> = {
  // `design` is the site editor's Design panel (editor.panel): the same four sections, always on the person's site.
  virtu: { frame: VirtuDesign, sections: { shape: VirtuShape, type: VirtuType, colour: VirtuColour, looks: VirtuLooks, design: VirtuDesignSections } },
};

/**
 * The options each plugin adds to a selected component in the site editor (editor.component-option). They are not
 * drawn by <Slot>: the editor draws them in the block's options bar and stores them as literal values on the tag
 * (shape="round", frame="holly-corners"), which @reflect/core/site-page checks against Virtu's catalog.
 */
export const COMPONENT_OPTIONS: Record<string, readonly string[]> = { virtu: ["shape", "frame"] };

const SHIPPED = new Set(Object.keys(SLOT_CODE));

/** The sections to draw in a slot for the person: their added plugins that fill it and ship in Reflect, in catalog order. */
export async function slotSections(userId: string, slot: SlotName): Promise<{ plugin: string; sections: string[] }[]> {
  const added = await pluginsOf(userId).catch(() => []);
  const known = (plugin: string, s: string) => (slot === "editor.component-option" ? COMPONENT_OPTIONS[plugin]?.includes(s) : SLOT_CODE[plugin]?.sections[s]);
  return slotFill(added, slot, SHIPPED).map((f) => ({ ...f, sections: f.sections.filter((s) => known(f.plugin, s)) })).filter((f) => f.sections.length > 0);
}

/** The options a selected component gets in the site editor from the person's added plugins, such as ["shape", "frame"]. */
export async function componentOptions(userId: string): Promise<string[]> {
  return [...new Set((await slotSections(userId, "editor.component-option")).flatMap((f) => f.sections))];
}

/**
 * Draws a slot for the person. With nothing to draw it shows `empty`. For the Appearance slot, `AppearanceSlot` below
 * gives the muted line that points to Virtu.
 */
export async function Slot({ userId, name, empty = null }: { userId: string; name: SlotName; empty?: ReactNode }) {
  const fill = await slotSections(userId, name);
  if (!fill.length) return <>{empty}</>;
  return (
    <>
      {fill.map(({ plugin, sections }) => {
        const code = SLOT_CODE[plugin]!;
        const Frame = code.frame ?? (({ children }: { children: ReactNode }) => <>{children}</>);
        return (
          <Frame key={plugin}>
            {sections.map((s) => {
              const Section = code.sections[s]!;
              return <Section key={s} />;
            })}
          </Frame>
        );
      })}
    </>
  );
}

/** Appearance's slot: the sections plugins add, or, with none added, a muted line to Virtu in the Marketplace. */
export function AppearanceSlot({ userId }: { userId: string }) {
  return (
    <Slot userId={userId} name="appearance.section"
      empty={<Link href="/marketplace/plugins/virtu" className="text-muted-foreground hover:text-foreground block px-4 text-sm underline-offset-4 hover:underline">More options with Virtu</Link>} />
  );
}
