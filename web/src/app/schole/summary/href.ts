/** A book's summary page, for any book, on Reflect or not. */
export const summaryHref = (title: string, by?: string | null) =>
  `/schole/summary?t=${encodeURIComponent(title)}${by ? `&by=${encodeURIComponent(by)}` : ""}`;
