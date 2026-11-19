import type { ReactNode } from "react";
import { SettingsPanel } from "@/components/settings-panel";

/** Settings opened from a page: the panel over that page. Each page here is the real one, re-exported. */
export default function Layout({ children }: { children: ReactNode }) {
  return <SettingsPanel modal>{children}</SettingsPanel>;
}
