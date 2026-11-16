// A person's works from their public ORCID record (pub.orcid.org, no key), for scholars' pages: the full article list
// beside the few Reflect lists by hand. Empty when ORCID cannot be reached.

export type OrcidWork = { title: string; year: number | null; venue: string | null; doi: string | null; type: string };

type Summary = {
  title?: { title?: { value?: string } | null } | null;
  "publication-date"?: { year?: { value?: string } | null } | null;
  "journal-title"?: { value?: string } | null;
  "external-ids"?: { "external-id"?: { "external-id-type"?: string; "external-id-value"?: string }[] } | null;
  type?: string;
};

/** Every work on an ORCID record, newest first, one per group (ORCID groups the same work from several sources). */
export async function orcidWorks(orcid: string): Promise<OrcidWork[]> {
  if (!/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(orcid)) return [];
  try {
    const r = await fetch(`https://pub.orcid.org/v3.0/${orcid}/works`, { headers: { Accept: "application/json" }, next: { revalidate: 60 * 60 * 24 } });
    if (!r.ok) return [];
    const d = (await r.json()) as { group?: { "work-summary"?: Summary[] }[] };
    return (d.group ?? []).flatMap((g) => {
      const w = g["work-summary"]?.[0];
      const title = w?.title?.title?.value?.replace(/\s+/g, " ").trim();
      if (!w || !title) return [];
      const y = Number(w["publication-date"]?.year?.value);
      const doi = w["external-ids"]?.["external-id"]?.find((x) => x["external-id-type"] === "doi")?.["external-id-value"] ?? null;
      return [{ title, year: Number.isFinite(y) && y > 0 ? y : null, venue: w["journal-title"]?.value ?? null, doi, type: w.type ?? "other" }];
    }).sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
  } catch {
    return [];
  }
}
