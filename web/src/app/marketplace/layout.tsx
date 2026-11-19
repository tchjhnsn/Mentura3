import type { ReactNode } from "react";
import { SettingsPanel } from "@/components/settings-panel";

/** A full load of a Settings address: the Settings panel on its own (soft navigation opens it over the page, app/@modal). */
export default function Layout({ children }: { children: ReactNode }) {
  return <SettingsPanel>{children}</SettingsPanel>;
}
