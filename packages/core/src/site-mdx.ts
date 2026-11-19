// A site page as MDX, for the exported Next.js project (plan "Appearance, Virtu and the site editor", PR 5: "MDX
// export"). Reflect stores a page as Markdown with library tags (site-page.ts); MDX reads the same tags, but it also
// reads `{` as the start of code and `<` as the start of a tag anywhere in the text. So the prose between components is
// escaped first, and each <Part> becomes a snapshot taken at export (the exported site does not call Reflect). Pure.
import { looseTag, parsePage, serializeTag, type Block, type Props } from "./site-page";

/** What a shared part shows, as the renderer draws it: a title, a few short lines and a list. */
export type PartSnapshot = { title: string; lines: string[]; items: string[] };

const ASCII_PUNCT = /[!-/:-@[-`{-~]/;

/** One line of prose with `{`, `}` and `<` escaped outside inline code. A backslash stays a backslash, as on Reflect. */
function escapeLine(line: string): string {
  let out = "";
  for (let i = 0; i < line.length; i++) {
    const c = line[i]!;
    if (c === "`") {
      // Inline code as Reflect reads it: one backtick, words, one backtick. MDX takes what is inside literally.
      const end = line.indexOf("`", i + 1);
      if (end > i + 1) {
        out += line.slice(i, end + 1);
        i = end;
        continue;
      }
      out += c;
      continue;
    }
    if (c === "\\") out += ASCII_PUNCT.test(line[i + 1] ?? "") ? "\\\\" : "\\";
    else if (c === "{" || c === "}" || c === "<") out += `\\${c}`;
    else out += c;
  }
  return out;
}

/**
 * Markdown prose made safe for MDX: `{`, `}` and `<` outside code are escaped with a backslash, so MDX reads them as
 * the characters they are, not as code or a tag. Fenced code is left as it is. The text reads the same.
 */
export function escapeMdxProse(md: string): string {
  let fence: string | null = null;
  return md
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => {
      const f = /^\s{0,3}(```|~~~)/.exec(line);
      if (fence) {
        if (f && f[1] === fence) fence = null;
        return line;
      }
      if (f) {
        fence = f[1]!;
        return line;
      }
      return escapeLine(line);
    })
    .join("\n");
}

/** A short id for a snapshot, the same for the same content: the file name under content/parts/. */
export function snapshotId(s: PartSnapshot): string {
  const text = JSON.stringify([s.title, s.lines, s.items]);
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, "0") + (h1 >>> 0).toString(16).padStart(8, "0");
}

/**
 * A page as MDX: the prose escaped, each component as its tag, and each <Part> as <Part snapshot="<id>" ...> when its
 * source is in `parts` (the parts the access rule, mayShowPart, lets show). A part not in `parts` is dropped, as a
 * visitor sees nothing in its place on Reflect. A line the strict parser refuses is left out, as the renderer does.
 */
export function pageToMdx(body: string, parts: ReadonlyMap<string, PartSnapshot>): { mdx: string; parts: Record<string, PartSnapshot> } {
  const { blocks } = parsePage(body);
  const used: Record<string, PartSnapshot> = {};
  const out: string[] = [];
  for (const b of blocks) {
    if (b.kind === "markdown") {
      out.push(escapeMdxProse(b.text));
      continue;
    }
    if (b.name !== "Part") {
      out.push(serializeTag(b.name, b.props));
      continue;
    }
    const snap = typeof b.props.source === "string" ? parts.get(b.props.source) : undefined;
    if (!snap) continue;
    const id = snapshotId(snap);
    used[id] = snap;
    const { source: _source, ...rest } = b.props;
    out.push(looseTag("Part", { snapshot: id, ...rest }));
  }
  return { mdx: out.length ? `${out.join("\n\n")}\n` : "", parts: used };
}

/** The shapes and frames a page's blocks name, for the CSS the page needs. */
export function looksUsed(blocks: readonly Block[]): { shapes: string[]; frames: string[] } {
  const pick = (k: keyof Props & string) => [...new Set(blocks.flatMap((b) => (b.kind === "component" && typeof b.props[k] === "string" ? [b.props[k] as string] : [])))].sort();
  return { shapes: pick("shape"), frames: pick("frame") };
}
