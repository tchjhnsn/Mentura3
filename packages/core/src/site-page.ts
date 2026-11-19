// A site page (plan "Appearance, Virtu and the site editor", 2026-11-18, sections "The Markdown site editor" and
// "System design"). A page is one Markdown document. Components from the library sit on their own lines as MDX tags
// with literal values only: strings, numbers and lists of them, such as <Photo src="https://..." alt="At the lake" />,
// <PostList limit={3} /> or <Part source="adventures/big-bend" view="card" />. Nothing else that MDX allows is
// allowed here: no expressions, no imports or exports, no tags outside the library, no children. This file is the one
// strict parser and serializer of that subset; the editor's round trip and the public renderer both use it. Pure.
import { isSlug, RESERVED_SLUGS } from "./site";

// The library.

export type PropKind = "text" | "url" | "number" | "urls" | "choice";
/** `look` marks a value the Virtu plugin sets from the block's options bar (shape, frame), not from the block's fields. */
export type PropSpec = { kind: PropKind; label: string; required?: boolean; max?: number; min?: number; choices?: readonly string[]; look?: boolean };
export type GroupId = "media" | "writing" | "you" | "tiles" | "household" | "shared";
export type ComponentSpec = { name: string; label: string; group: GroupId; line: string; props: Record<string, PropSpec> };

/** The library's groups, in the order the editor shows them. */
export const LIBRARY_GROUPS: readonly { id: GroupId; label: string }[] = [
  { id: "media", label: "Media" },
  { id: "writing", label: "Writing" },
  { id: "you", label: "You" },
  { id: "tiles", label: "From your tiles" },
  { id: "household", label: "Household" },
  { id: "shared", label: "Shared domains" },
];

const text = (label: string, required = false, max = 500): PropSpec => ({ kind: "text", label, required, max });
const url = (label: string, required = false): PropSpec => ({ kind: "url", label, required, max: 2000 });

/*
 * Per-block shape and frame (plan, "Virtu as a plugin": the editor.component-option slot). The names are the site's
 * Virtu catalog (packages/virtu/site/looks.loaded.json: its shapes, and its ornaments as frames); a test in
 * web/src/server/site-design.test.ts holds the two lists to the catalog. A visual block may carry shape="<name>" and
 * frame="<name>" as literal values; any other name is refused here with the reason, and the renderer draws them with
 * Virtu's own CSS (packages/virtu/src/blocks.ts).
 */
export const BLOCK_SHAPES = ["pill", "round", "sharp", "soft", "squircle"] as const;
export const BLOCK_FRAMES = ["dotted-frame", "halo-around", "holly-corners", "leaf-corners", "snow-corners", "spark-traveller", "sprig-corners"] as const;
/** The components a shape and a frame can dress: the ones that draw a surface. */
export const VISUAL_COMPONENTS = ["Photo", "Gallery", "Quote", "Callout", "ProfileCard", "Part"] as const;
const LOOK_PROPS: Record<string, PropSpec> = {
  shape: { kind: "choice", label: "Shape", choices: BLOCK_SHAPES, look: true },
  frame: { kind: "choice", label: "Frame", choices: BLOCK_FRAMES, look: true },
};
const dressed = (c: ComponentSpec): ComponentSpec => ((VISUAL_COMPONENTS as readonly string[]).includes(c.name) ? { ...c, props: { ...c.props, ...LOOK_PROPS } } : c);

/** Every component a page may hold. Anything else is refused. */
const BASE_COMPONENTS: ComponentSpec[] = [
  { name: "Photo", label: "Photo", group: "media", line: "One picture, from its web address", props: { src: url("Address", true), alt: text("Description", false, 300), caption: text("Caption", false, 300) } },
  { name: "Gallery", label: "Gallery", group: "media", line: "Several pictures in a grid", props: { images: { kind: "urls", label: "Addresses", required: true, max: 24 }, caption: text("Caption", false, 300) } },
  { name: "Video", label: "Video", group: "media", line: "A video file or a YouTube or Vimeo link", props: { src: url("Address", true), caption: text("Caption", false, 300) } },
  { name: "Audio", label: "Audio", group: "media", line: "A sound file", props: { src: url("Address", true), title: text("Title", false, 200) } },
  { name: "Embed", label: "Embed", group: "media", line: "A link that shows a preview", props: { url: url("Address", true), title: text("Title", false, 200) } },
  { name: "Quote", label: "Quote", group: "writing", line: "A passage and who said it", props: { text: text("Quote", true, 2000), cite: text("Who said it", false, 200) } },
  { name: "Callout", label: "Callout", group: "writing", line: "A note set apart from the text", props: { text: text("Text", true, 1000) } },
  { name: "Divider", label: "Divider", group: "writing", line: "A line between parts", props: {} },
  { name: "Button", label: "Button", group: "writing", line: "A link drawn as a button", props: { label: text("Label", true, 60), href: url("Address", true) } },
  { name: "PostList", label: "Post list", group: "writing", line: "Your latest posts", props: { limit: { kind: "number", label: "How many", min: 1, max: 50 } } },
  { name: "ProfileCard", label: "Profile card", group: "you", line: "Your face, name and handle", props: {} },
  { name: "Links", label: "Links", group: "you", line: "Your socials", props: {} },
  { name: "Now", label: "Now", group: "you", line: "What you are doing these days", props: { text: text("What you are doing", true, 500) } },
  { name: "Part", label: "Part", group: "tiles", line: "A part of a tile, your household or a shared domain", props: { source: { kind: "text", label: "Source", required: true, max: 200 }, view: { kind: "choice", label: "View", choices: ["card", "list"] } } },
];
export const COMPONENTS: readonly ComponentSpec[] = BASE_COMPONENTS.map(dressed);

/** Whether a component takes a shape and a frame. */
export const isVisual = (name: string) => (VISUAL_COMPONENTS as readonly string[]).includes(name);

export const componentByName = (name: string): ComponentSpec | null => COMPONENTS.find((c) => c.name === name) ?? null;

export type PropValue = string | number | (string | number)[];
export type Props = Record<string, PropValue>;
export type Component = { name: string; props: Props };
export type Block = { kind: "markdown"; text: string } | { kind: "component"; name: string; props: Props };

// Values.

/** A web address a page may point to: https or http, or a path on this site. Nothing that runs. */
export function safeUrl(u: unknown): string | null {
  if (typeof u !== "string") return null;
  const t = u.trim();
  if (!t || t.length > 2000 || /[\s<>"]/.test(t)) return null;
  return /^(https?:\/\/[^/]|\/(?!\/))/i.test(t) ? t : null;
}

/** A part's source: a domain and a path inside it, such as "adventures/<id>" or "household/members". */
export const PART_DOMAINS = ["adventures", "ventures", "household"] as const;
export type PartDomain = (typeof PART_DOMAINS)[number];
export function parseSource(s: unknown): { domain: PartDomain; path: string } | null {
  if (typeof s !== "string" || s.length > 200 || !/^[a-z]+(\/[A-Za-z0-9_-]+)*$/.test(s)) return null;
  const [domain, ...rest] = s.split("/");
  return (PART_DOMAINS as readonly string[]).includes(domain!) ? { domain: domain as PartDomain, path: rest.join("/") } : null;
}

/** Checks one value against its spec. Returns the cleaned value, or an error in plain words. */
function checkValue(spec: PropSpec, key: string, v: PropValue): { value: PropValue } | { error: string } {
  const bad = (why: string) => ({ error: `${spec.label}: ${why}` });
  switch (spec.kind) {
    case "text":
      if (typeof v !== "string") return bad("must be words in quotes.");
      if (spec.max && v.length > spec.max) return bad(`at most ${spec.max} characters.`);
      if (key === "source" && !parseSource(v)) return bad("not a part Reflect knows.");
      return { value: v };
    case "url":
      if (typeof v !== "string") return bad("must be an address in quotes.");
      { const u = safeUrl(v); return u ? { value: u } : bad("must start with https:// or /."); }
    case "number":
      if (typeof v !== "number" || !Number.isInteger(v)) return bad("must be a whole number.");
      if ((spec.min !== undefined && v < spec.min) || (spec.max !== undefined && v > spec.max)) return bad(`from ${spec.min} to ${spec.max}.`);
      return { value: v };
    case "urls": {
      if (!Array.isArray(v)) return bad("must be a list of addresses.");
      if (spec.max && v.length > spec.max) return bad(`at most ${spec.max}.`);
      const out: string[] = [];
      for (const x of v) {
        const u = safeUrl(x);
        if (!u) return bad("every address must start with https:// or /.");
        out.push(u);
      }
      return { value: out };
    }
    case "choice":
      if (typeof v === "string" && spec.choices?.includes(v)) return { value: v };
      return spec.look && typeof v === "string" ? bad(`no ${spec.label.toLowerCase()} is named ${v}. One of ${spec.choices?.join(", ")}.`) : bad(`one of ${spec.choices?.join(", ")}.`);
  }
}

/** A component's props checked against the library. Throws a plain-words error on anything not allowed. */
export function checkComponent(name: string, props: Props): Component {
  const spec = componentByName(name);
  if (!spec) throw new Error(`<${name}> is not in the library.`);
  const out: Props = {};
  for (const [k, v] of Object.entries(props)) {
    const p = spec.props[k];
    if (!p) throw new Error(`<${name}> has no ${k}.`);
    const c = checkValue(p, k, v);
    if ("error" in c) throw new Error(`<${name}> ${c.error}`);
    out[k] = c.value;
  }
  for (const [k, p] of Object.entries(spec.props)) if (p.required && !(k in out)) throw new Error(`<${name}> needs ${p.label.toLowerCase()} (${k}).`);
  return { name, props: out };
}

// Parsing one tag.

const NAME = /^[A-Z][A-Za-z0-9]*$/;
const KEY = /^[a-z][A-Za-z0-9]*$/;

/** The index just past a JSON literal starting at i (a string, a number or a list), or -1. Strings may hold any brace. */
function literalEnd(s: string, i: number): number {
  let depth = 0;
  let inStr = false;
  for (let j = i; j < s.length; j++) {
    const c = s[j]!;
    if (inStr) {
      if (c === "\\") j++;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === "[") depth++;
    else if (c === "]") depth--;
    else if (c === "}" && depth === 0) return j;
    if (depth < 0) return -1;
  }
  return -1;
}

/** A literal inside braces: a number, a string, or a flat list of them. Anything else (an expression, an object) is refused. */
function literal(src: string): PropValue {
  const t = src.trim();
  if (!t) throw new Error("An empty {} is not allowed.");
  let v: unknown;
  try {
    v = JSON.parse(t);
  } catch {
    throw new Error(`{${t.length > 40 ? `${t.slice(0, 40)}...` : t}} is not a literal value. Only words, numbers and lists are allowed.`);
  }
  const ok = (x: unknown) => typeof x === "string" || (typeof x === "number" && Number.isFinite(x));
  if (ok(v)) return v as string | number;
  if (Array.isArray(v) && v.every(ok)) return v as (string | number)[];
  throw new Error("Only words, numbers and lists are allowed.");
}

/**
 * Parses one self-closing tag, `<Name key="words" key={3} key={["a", "b"]} />`, starting at `src[0] === "<"`.
 * Returns the component and how many characters it used. Throws a plain-words error on anything else.
 */
export function parseTag(src: string): { component: Component; length: number } {
  if (src[0] !== "<") throw new Error("A component starts with <.");
  let i = 1;
  const name = /^[A-Za-z0-9]*/.exec(src.slice(i))![0];
  if (!NAME.test(name)) throw new Error("A component's name starts with a capital letter.");
  if (!componentByName(name)) throw new Error(`<${name}> is not in the library.`);
  i += name.length;
  const props: Props = {};
  for (;;) {
    const ws = /^\s*/.exec(src.slice(i))![0];
    i += ws.length;
    if (src.startsWith("/>", i)) {
      i += 2;
      break;
    }
    if (src[i] === ">") throw new Error(`<${name}> must close itself with />. Components hold no text inside.`);
    if (src[i] === "{") throw new Error("Spreading values with {...} is not allowed.");
    if (!ws && Object.keys(props).length) throw new Error(`<${name}> needs a space between values.`);
    const key = /^[A-Za-z0-9_$:-]*/.exec(src.slice(i))![0];
    if (!key) throw new Error(i >= src.length ? `<${name}> is not closed with />.` : `<${name}> has something that is not a value.`);
    if (!KEY.test(key)) throw new Error(`${key} is not a value name.`);
    if (key in props) throw new Error(`<${name}> sets ${key} twice.`);
    i += key.length;
    if (src[i] !== "=") throw new Error(`${key} needs a value (${key}="...").`);
    i++;
    if (src[i] === '"') {
      const end = src.indexOf('"', i + 1);
      if (end < 0) throw new Error(`The value of ${key} is not closed with ".`);
      const raw = src.slice(i + 1, end);
      if (raw.includes("\n")) throw new Error(`The value of ${key} runs over a line.`);
      props[key] = raw.replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
      i = end + 1;
    } else if (src[i] === "{") {
      const end = literalEnd(src, i + 1);
      if (end < 0) throw new Error(`The value of ${key} is not closed with }.`);
      props[key] = literal(src.slice(i + 1, end));
      i = end + 1;
    } else throw new Error(`The value of ${key} goes in quotes or braces.`);
  }
  return { component: checkComponent(name, props), length: i };
}

// Serializing.

const quotable = (s: string) => !/["\n\\{}]/.test(s) && !/&(quot|lt|gt|amp);/.test(s);

function serializeValue(v: PropValue): string {
  if (typeof v === "string") return quotable(v) ? `"${v}"` : `{${JSON.stringify(v)}}`;
  if (typeof v === "number") return `{${v}}`;
  return `{${JSON.stringify(v)}}`;
}

/** One component as its tag, on one line, values in the library's order. Checks it first. */
export function serializeTag(name: string, props: Props): string {
  const c = checkComponent(name, props);
  const spec = componentByName(name)!;
  const keys = Object.keys(spec.props).filter((k) => k in c.props);
  return `<${name}${keys.map((k) => ` ${k}=${serializeValue(c.props[k]!)}`).join("")} />`;
}

/**
 * A component as a tag without checking it, for an editor holding a component the person is still filling in (a
 * Photo with no address yet). The draft it writes is refused on save with the reason, so it never goes live.
 */
export function looseTag(name: string, props: Record<string, unknown>): string {
  const vals = Object.entries(props).filter(([k, v]) => KEY.test(k) && (typeof v === "string" || typeof v === "number" || Array.isArray(v)));
  return `<${NAME.test(name) ? name : "Unknown"}${vals.map(([k, v]) => ` ${k}=${serializeValue(v as PropValue)}`).join("")} />`;
}

// Parsing a page.

const FENCE = /^\s{0,3}(```|~~~)/;
const TAG_LINE = /^ {0,3}<[A-Za-z]/;
const COMPONENT_LINE = /^ {0,3}<[A-Z]/;
const ESM = /^(import|export)\s/;

export type PageError = { line: number; message: string };

/**
 * A page as blocks: Markdown between components, and each component on its own line(s). Strict: an unknown tag, an
 * expression, an import or an export is an error, with the line it is on. Lines inside code fences are left as text.
 * A lowercase tag such as <div> stays text and is escaped when drawn.
 */
export function parsePage(md: string): { blocks: Block[]; errors: PageError[] } {
  const lines = md.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  const errors: PageError[] = [];
  let buf: string[] = [];
  let fence: string | null = null;
  const flush = () => {
    const t = buf.join("\n").replace(/^\n+|\n+$/g, "");
    if (t.trim()) blocks.push({ kind: "markdown", text: t });
    buf = [];
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const f = FENCE.exec(line);
    if (fence) {
      buf.push(line);
      if (f && f[1] === fence) fence = null;
      continue;
    }
    if (f) {
      fence = f[1]!;
      buf.push(line);
      continue;
    }
    if (ESM.test(line)) {
      errors.push({ line: i + 1, message: "A page cannot import or export code." });
      continue;
    }
    if (COMPONENT_LINE.test(line)) {
      // A tag may run over several lines until it closes with />.
      let src = line.trimStart();
      let j = i;
      while (!src.includes("/>") && !/>\s*$/.test(src) && j + 1 < lines.length && j - i < 20) src += `\n${lines[++j]!}`;
      try {
        const { component, length } = parseTag(src);
        if (src.slice(length).trim()) throw new Error("A component sits on its own line.");
        flush();
        blocks.push({ kind: "component", ...component });
      } catch (e) {
        errors.push({ line: i + 1, message: e instanceof Error ? e.message : "Not a component." });
      }
      i = j;
      continue;
    }
    if (TAG_LINE.test(line) && /^ {0,3}<[a-z][\w-]*[\s/>]/.test(line) && /\{/.test(line)) {
      errors.push({ line: i + 1, message: "Braces in a tag are code, which a page cannot hold." });
      continue;
    }
    buf.push(line);
  }
  flush();
  return { blocks, errors };
}

/** The page back as Markdown: blocks separated by a blank line, each component as its tag. */
export function serializePage(blocks: readonly Block[]): string {
  return `${blocks.map((b) => (b.kind === "markdown" ? b.text : serializeTag(b.name, b.props))).join("\n\n")}\n`;
}

/** The errors in a page, or none. A page with errors is not saved. */
export function checkPage(md: string): PageError[] {
  return parsePage(md).errors;
}

/** The parts a page shows, by source. */
export function partsOf(blocks: readonly Block[]): string[] {
  return [...new Set(blocks.flatMap((b) => (b.kind === "component" && b.name === "Part" && typeof b.props.source === "string" ? [b.props.source] : [])))];
}

// Pages and their paths.

export const HOME = "";
export const WRITING = "writing";
/** Home and Writing are always there, in that order; added pages follow. */
export const FIXED_PAGES: readonly { path: string; title: string }[] = [
  { path: HOME, title: "Home" },
  { path: WRITING, title: "Writing" },
];

/** A path an added page may take: a slug that the site's own pages do not use. */
/** "home" and "parts" name Home and the parts list in the JSON API (/api/site/pages/home, /api/site/pages/parts). */
export const PAGE_RESERVED = [WRITING, "home", "parts"];
export const isPagePath = (p: unknown): p is string => isSlug(p) && !RESERVED_SLUGS.includes(p) && !PAGE_RESERVED.includes(p);

/** The Home page a site starts with, the same parts as the profile layout: the card, a short paragraph, the latest posts and links. */
export function homeTemplate(o: { line?: string | null } = {}): string {
  const line = o.line?.replace(/\s+/g, " ").trim();
  return serializePage([
    { kind: "component", name: "ProfileCard", props: {} },
    ...(line ? [{ kind: "markdown" as const, text: line }] : []),
    { kind: "markdown", text: "## Writing" },
    { kind: "component", name: "PostList", props: { limit: 3 } },
    { kind: "component", name: "Links", props: {} },
  ]);
}

/** The Writing page a site starts with: every post. */
export function writingTemplate(): string {
  return serializePage([{ kind: "component", name: "PostList", props: { limit: 50 } }]);
}

/** The starting text of a page by its path. */
export const templateFor = (path: string, o: { line?: string | null } = {}) => (path === HOME ? homeTemplate(o) : path === WRITING ? writingTemplate() : "");

// Sharing parts on a site.

export type PartShare = { ownerId: string; source: string; createdBy: string };

/**
 * Whether a part may show on a public page of `ownerId`'s site: the owner marked it shareable, and a household part
 * also has the OK of the household member who created it (`creatorId`, the household's creator). The one access rule
 * every site page follows (web/src/server/part-share.ts reads the rows; the renderer asks here).
 */
export function mayShowPart(source: string, ownerId: string, shares: readonly PartShare[], creatorId: string | null): boolean {
  const s = parseSource(source);
  if (!s) return false;
  const live = shares.filter((x) => x.source === source && x.ownerId === ownerId);
  if (!live.some((x) => x.createdBy === ownerId)) return false;
  if (s.domain !== "household") return true;
  if (!creatorId) return false;
  return live.some((x) => x.createdBy === creatorId);
}
