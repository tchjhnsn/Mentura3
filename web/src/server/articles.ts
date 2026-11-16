// Articles read inside Scholē from Wikipedia, as plain text (kept a day). Nothing here calls a model.
import { readArticle, readsArticle, type Article } from "@reflect/core/articles";

/** One article a person page names, or null when it is not one of them or Wikipedia does not answer. */
export async function articleFor(title: string): Promise<Article | null> {
  if (!readsArticle(title)) return null;
  const q = new URLSearchParams({ action: "query", prop: "extracts|info", explaintext: "1", inprop: "url", redirects: "1", titles: title, format: "json", formatversion: "2" });
  try {
    const r = await fetch(`https://en.wikipedia.org/w/api.php?${q}`, { headers: { "user-agent": "reflect-app" }, next: { revalidate: 86400 }, signal: AbortSignal.timeout(8000) });
    return readArticle(r.ok ? await r.text() : null);
  } catch { return null; }
}
