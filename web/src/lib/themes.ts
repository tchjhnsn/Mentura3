// Themes and backgrounds (Torian, 2026-11-17 20:11Z): they change colors only, never the layout. A theme is a hue and
// how strongly it colors the primary act and the surfaces; globals.css turns those numbers into shadcn's tokens for
// light and dark. A background is a quiet pattern behind the page, drawn in the theme's color. Both are kept in a
// cookie, so the server paints the page in them from the first frame.

export type Theme = { id: string; label: string; season?: string; hue: number; chroma: number; tint: number; light: number };

export const THEMES: readonly Theme[] = [
  { id: "reflect", label: "Reflect", hue: 0, chroma: 0, tint: 0, light: 0.205 },
  { id: "thanksgiving", label: "Thanksgiving", season: "November", hue: 52, chroma: 0.16, tint: 0.016, light: 0.55 },
  { id: "autumn", label: "Autumn", season: "Fall", hue: 33, chroma: 0.15, tint: 0.012, light: 0.52 },
  { id: "advent", label: "Advent", season: "December", hue: 155, chroma: 0.11, tint: 0.01, light: 0.45 },
  { id: "winter", label: "Winter", season: "Winter", hue: 240, chroma: 0.11, tint: 0.012, light: 0.5 },
  { id: "spring", label: "Spring", season: "Spring", hue: 355, chroma: 0.13, tint: 0.012, light: 0.55 },
  { id: "summer", label: "Summer", season: "Summer", hue: 215, chroma: 0.13, tint: 0.012, light: 0.52 },
  { id: "olive", label: "Olive", hue: 120, chroma: 0.08, tint: 0.012, light: 0.48 },
  { id: "sepia", label: "Sepia", hue: 75, chroma: 0.06, tint: 0.03, light: 0.38 },
];

/** "season" follows the calendar; the rest are themes by id. */
export const THEME_CHOICES = ["season", ...THEMES.map((t) => t.id)] as const;

export const MODES = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "system", label: "Same as device" },
] as const;

/** Backgrounds, drawn in the theme's color at low strength (globals.css, `[data-bg]`). */
export const BACKGROUNDS = [
  { id: "plain", label: "Plain" },
  { id: "wash", label: "Wash" },
  { id: "dots", label: "Dots" },
  { id: "grid", label: "Grid" },
  { id: "paper", label: "Paper" },
  { id: "leaves", label: "Leaves" },
  { id: "snow", label: "Snow" },
  { id: "waves", label: "Waves" },
] as const;

export type Look = { theme: string; mode: string; bg: string };
export const DEFAULT_LOOK: Look = { theme: "reflect", mode: "light", bg: "plain" };
export const LOOK_COOKIE = "reflect-look";

/** The seasonal theme for a day: Thanksgiving in November, Advent in December, then winter, spring, summer, autumn. */
export function seasonalTheme(day: string): Theme {
  const md = day.slice(5, 10);
  const id = md >= "11-01" && md <= "11-30" ? "thanksgiving" : md >= "12-01" && md <= "12-31" ? "advent"
    : md < "03-20" ? "winter" : md < "06-21" ? "spring" : md < "09-22" ? "summer" : "autumn";
  return THEMES.find((t) => t.id === id)!;
}

/** The theme a choice comes to on a day. */
export function themeOf(choice: string, day: string): Theme {
  return choice === "season" ? seasonalTheme(day) : THEMES.find((t) => t.id === choice) ?? THEMES[0]!;
}

/** A look as kept in the cookie, every part checked. */
export function lookOf(raw: string | undefined): Look {
  let v: Partial<Look> = {};
  try { v = JSON.parse(raw ?? "{}") as Partial<Look>; } catch { /* the default look */ }
  return {
    theme: THEME_CHOICES.includes(v.theme as never) ? v.theme! : DEFAULT_LOOK.theme,
    mode: MODES.some((m) => m.id === v.mode) ? v.mode! : DEFAULT_LOOK.mode,
    bg: BACKGROUNDS.some((b) => b.id === v.bg) ? v.bg! : DEFAULT_LOOK.bg,
  };
}

/** The CSS variables a theme sets on the page (globals.css reads them). */
export function themeVars(t: Theme): Record<string, string> {
  return { "--h": String(t.hue), "--c": String(t.chroma), "--t": String(t.tint), "--pl": String(t.light) };
}

/** A swatch color for a theme, for pickers. */
export const swatchOf = (t: Theme) => (t.chroma ? `oklch(${t.light} ${t.chroma} ${t.hue})` : "oklch(0.205 0 0)");
