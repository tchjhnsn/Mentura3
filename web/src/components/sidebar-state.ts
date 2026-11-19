// The sidebar's cookie and sizes, shared by the server (app/layout.tsx) and the sidebar itself (./sidebar.tsx).

/** Open or shut and the width, kept across reloads: `<1|0>.<width>`. */
export const SIDE_COOKIE = "reflect.side";
export const SIDE_DEFAULT = 272;
export const SIDE_MIN = 220;
export const SIDE_MAX = 420;

export type SideState = { open: boolean; width: number };

/** The cookie's value as a state; open at the default width when there is none, so a first visit sees the sidebar. */
export function sideOf(raw: string | undefined): SideState {
  if (!raw) return { open: true, width: SIDE_DEFAULT };
  const [o, w] = raw.split(".");
  const width = Number(w);
  return { open: o === "1", width: Number.isFinite(width) && width >= SIDE_MIN && width <= SIDE_MAX ? Math.round(width) : SIDE_DEFAULT };
}
