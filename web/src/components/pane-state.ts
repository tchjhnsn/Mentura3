// The second pane's cookie and sizes, shared by the server (app/layout.tsx) and the pane itself.

/** The cookie that keeps the pane open or shut and its width across reloads: `<1|0>.<width>`. */
export const PANE_COOKIE = "reflect.pane";
export const PANE_DEFAULT = 400;
export const PANE_MIN = 320;
export const PANE_MAX = 720;

export type PaneState = { open: boolean; width: number };

/** The cookie's value as a state; shut at the default width when there is none. */
export function paneOf(raw: string | undefined): PaneState {
  const [o, w] = (raw ?? "").split(".");
  const width = Number(w);
  return { open: o === "1", width: Number.isFinite(width) && width >= PANE_MIN && width <= PANE_MAX ? Math.round(width) : PANE_DEFAULT };
}
