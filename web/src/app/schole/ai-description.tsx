import type { ReactNode } from "react";
import { ensureDescription } from "@/server/ai-text";

/** The article title in a Wikipedia link about a debate itself (not about one speaker), to write from that article. */
export const debateArticle = (url?: string | null): string | null => {
  const m = url?.match(/^https:\/\/en\.wikipedia\.org\/wiki\/(.+)$/);
  const title = m?.[1] ? decodeURIComponent(m[1]).replace(/_/g, " ") : null;
  return title && /debate/i.test(title) ? title : null;
};

/** Where a model's text came from, under it: always labelled as written by AI, with its sources linked. */
export function AiLabel({ sources }: { sources: { label: string; url: string }[] }) {
  return (
    <p className="text-muted-foreground text-xs">
      Written by AI from{" "}
      {sources.map((s, i) => (
        <span key={s.url}>{i ? ", " : ""}<a href={s.url} target="_blank" rel="noreferrer" className="underline underline-offset-2">{s.label}</a></span>
      ))}
      . It may be wrong; check the source.
    </p>
  );
}

/**
 * A recording's description, written by a model from Wikipedia the first time anyone opens it and kept for everyone.
 * Shows `fallback` (the curated line, if any) when there is no source or no model. Render it inside Suspense.
 */
export async function AiDescription({ thing, fallback }: { thing: { key: string; title: string; by?: string | null; kind: string; article?: string | null }; fallback?: ReactNode }) {
  const d = await ensureDescription(thing);
  if (!d) return <>{fallback ?? null}</>;
  return (
    <div className="space-y-1.5">
      <p>{d.body}</p>
      <AiLabel sources={d.sources} />
    </div>
  );
}
