"use client";

import { useEffect } from "react";
import { mountVirtuEditor } from "@reflect/virtu/editor-ui";

/**
 * The Virtu editor on the owner's own site (Torian, 2026-11-18 23:45Z): Customize, bottom right, opens the theme panel
 * beside the site. Changes show on the page at once, Virtu checks every one, and Publish saves only a design that
 * passes (src/app/api/site/design). ?customize=1 opens it at once, as Settings, Your site links it.
 *
 * The saved design's <style data-site-design> sits in the body, after the panel's preview in <head>, so it would win.
 * While the editor is mounted a copy goes first in <head>, under the preview, and the one in the body is switched off.
 */
export function SiteDesignEditor() {
  useEffect(() => {
    const open = new URLSearchParams(window.location.search).get("customize") === "1";
    const saved = document.querySelector<HTMLStyleElement>("style[data-site-design]");
    const editor = mountVirtuEditor({ endpoint: "/api/site/design", publishLabel: "Publish", open });
    const copy = saved ? (saved.cloneNode(true) as HTMLStyleElement) : null;
    if (saved && copy) {
      document.head.prepend(copy);
      saved.media = "not all";
    }
    return () => {
      editor.destroy();
      copy?.remove();
      if (saved) saved.media = "";
    };
  }, []);
  return null;
}
