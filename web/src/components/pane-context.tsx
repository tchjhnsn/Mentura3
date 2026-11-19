"use client";

import { createContext, useContext } from "react";

export type PaneCtxValue = { open: boolean; openChat: (from?: { ask?: string; chatId?: string }) => void; close: () => void };
export const PaneCtx = createContext<PaneCtxValue | null>(null);

/** Open or close the second pane from anywhere; null where there is none (signed out). Kept apart from ./pane.tsx so the sidebar can use it without importing the chat. */
export function usePane(): PaneCtxValue | null {
  return useContext(PaneCtx);
}
