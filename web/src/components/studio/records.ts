// Every document is a view of a record. The record (JSON) is the source of truth; the document, deck or sheet is
// how a person reads it. These helpers give each file its record.
import { businessHref } from "./data";
import { fileAt, mdBlocks, titleOf, type VFile } from "./files-data";

/** A file's path from a piece of evidence text such as "a/b.md and four more". */
const pathIn = (text: string) => text.split(" ")[0] ?? text;
export const fileHrefOf = (team: string, slug: string, evidence: string) => businessHref(team, slug, `files/${pathIn(evidence)}`);

/** The JSON record behind a file. A markdown document's record holds its title and sections; the markdown is
 * rendered from it. */
export function recordOf(slug: string, f: VFile): Record<string, unknown> {
  const base = { id: f.path.replace(/\.[a-z]+$/, ""), venture: slug, type: f.path.split("/")[0], kind: f.kind, written_by: f.by, edited_by: f.editors, updated: f.updated };
  if (f.kind === "doc" && f.body) {
    const sections: { heading: string; text: string[] }[] = [];
    for (const b of mdBlocks(f.body)) {
      if (b.t === "h1") continue;
      if (b.t === "h2" || b.t === "h3" || !sections.length) sections.push({ heading: b.t === "h2" || b.t === "h3" ? b.text : "", text: b.t === "h2" || b.t === "h3" ? [] : [b.text] });
      else sections[sections.length - 1]!.text.push(b.text);
    }
    return { ...base, title: titleOf(f), sections };
  }
  if (f.kind === "deck") return { ...base, title: titleOf(f), deck: f.deckId ?? "investor", note: "Each slide is a record field; the deck is its view." };
  return { ...base, title: titleOf(f), status: "current" };
}

export const recordAt = (slug: string, path: string) => { const f = fileAt(slug, path); return f ? recordOf(slug, f) : null; };
