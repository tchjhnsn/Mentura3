// Profiles and accounts (doc "Profiles and accounts design guide", 2026-11-18): the pure rules behind a person's profile
// at /p/<handle>: handles, who sees each section, links to other accounts and how they are confirmed, and reading
// LinkedIn's own export of a person's data. Tables: web/src/db/migrations/0051_profile.sql.

/** A handle: 3 to 30 lower-case letters, digits or hyphens, starting and ending with a letter or digit. */
export const HANDLE = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;

/** Words a handle may not be, because they are pages of their own or would mislead. */
const RESERVED = new Set(["admin", "api", "app", "edit", "help", "me", "mentura", "new", "official", "reflect", "settings", "support", "team"]);

/** What is wrong with a handle, or null when it may be used. */
export function handleProblem(raw: string): string | null {
  const h = raw.trim().toLowerCase().replace(/^@/, "");
  if (h.length < 3) return "A handle has at least 3 characters.";
  if (h.length > 30) return "A handle has at most 30 characters.";
  if (!HANDLE.test(h)) return "Use letters, digits and hyphens, starting and ending with a letter or digit.";
  if (RESERVED.has(h)) return "That handle is reserved.";
  return null;
}
export const cleanHandle = (raw: string) => raw.trim().toLowerCase().replace(/^@/, "");

/** Who sees a section: everyone, people the person has met (connected, or checked in to the same event), or only them. */
export const AUDIENCES = [
  { id: "everyone", label: "Everyone" },
  { id: "met", label: "People you've met" },
  { id: "me", label: "Only you" },
] as const;
export type Audience = (typeof AUDIENCES)[number]["id"];
export const isAudience = (v: unknown): v is Audience => AUDIENCES.some((a) => a.id === v);

/** The parts of a profile below the name, face and line, in the order they show. */
export const SECTIONS = [
  { id: "socials", label: "Socials" },
  { id: "building", label: "Building" },
  { id: "qualities", label: "Qualities" },
  { id: "experience", label: "Experience" },
  { id: "events", label: "Events" },
  { id: "interests", label: "Interests" },
] as const;
export type SectionId = (typeof SECTIONS)[number]["id"];
export const isSection = (v: unknown): v is SectionId => SECTIONS.some((s) => s.id === v);

/** How the viewer stands to the profile's owner. */
export type Viewer = "owner" | "met" | "signed-in" | "anyone";

/** Whether a viewer sees a part set to an audience. The owner sees everything. */
export function canSee(audience: Audience, viewer: Viewer): boolean {
  if (viewer === "owner") return true;
  if (audience === "everyone") return true;
  if (audience === "met") return viewer === "met";
  return false;
}

/** The audience of a section: its own setting, else the profile's default. */
export const sectionAudience = (section: SectionId, own: Record<string, unknown>, fallback: Audience): Audience => (isAudience(own[section]) ? own[section] : fallback);

/** The accounts a person can link, each with the hosts its links live on and how a handle becomes a link. */
export const SERVICES = [
  { id: "linkedin", label: "LinkedIn", hosts: ["linkedin.com"], link: (h: string) => `https://www.linkedin.com/in/${h}` },
  { id: "x", label: "X", hosts: ["x.com", "twitter.com"], link: (h: string) => `https://x.com/${h}` },
  { id: "instagram", label: "Instagram", hosts: ["instagram.com"], link: (h: string) => `https://www.instagram.com/${h}` },
  { id: "github", label: "GitHub", hosts: ["github.com"], link: (h: string) => `https://github.com/${h}` },
  { id: "youtube", label: "YouTube", hosts: ["youtube.com"], link: (h: string) => `https://www.youtube.com/@${h}` },
  { id: "tiktok", label: "TikTok", hosts: ["tiktok.com"], link: (h: string) => `https://www.tiktok.com/@${h}` },
  { id: "bluesky", label: "Bluesky", hosts: ["bsky.app"], link: (h: string) => `https://bsky.app/profile/${h}` },
  { id: "threads", label: "Threads", hosts: ["threads.net", "threads.com"], link: (h: string) => `https://www.threads.net/@${h}` },
  { id: "facebook", label: "Facebook", hosts: ["facebook.com"], link: (h: string) => `https://www.facebook.com/${h}` },
  { id: "substack", label: "Substack", hosts: ["substack.com"], link: (h: string) => `https://${h}.substack.com` },
  { id: "mastodon", label: "Mastodon", hosts: [], link: (h: string) => h },
  { id: "website", label: "Website", hosts: [], link: (h: string) => h },
] as const;
export type ServiceId = (typeof SERVICES)[number]["id"];
export const serviceById = (id: string) => SERVICES.find((s) => s.id === id);

/** Services whose pages never mark a person's links `rel="me"`, so a link to them cannot be confirmed by link-back. */
export const NO_LINK_BACK: readonly ServiceId[] = ["linkedin", "instagram", "tiktok", "facebook", "threads", "x"];

const hostOf = (u: URL) => u.hostname.toLowerCase().replace(/^www\./, "").replace(/^m\./, "");

/**
 * A pasted link or handle as a link Reflect keeps: the service it belongs to, an https url, and the handle when one
 * is in it. `service` is a hint for a bare handle ("anaruiz" under LinkedIn). Null when it is neither.
 */
export function normalizeLink(raw: string, service?: string): { service: ServiceId; url: string; handle: string | null } | null {
  const s = raw.trim();
  if (!s || s.length > 300) return null;
  const hinted = service ? serviceById(service) : undefined;
  const bare = s.replace(/^@/, "");
  if (hinted && hinted.hosts.length && /^[A-Za-z0-9._-]{1,100}$/.test(bare)) return { service: hinted.id, url: hinted.link(bare), handle: bare };
  let u: URL;
  try {
    u = new URL(/^[a-z]+:\/\//i.test(s) ? s : `https://${s}`);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  if (!u.hostname.includes(".")) return null;
  u.protocol = "https:";
  u.hash = "";
  const host = hostOf(u);
  const known = SERVICES.find((x) => x.hosts.some((h) => host === h || host.endsWith(`.${h}`)));
  const parts = u.pathname.split("/").filter(Boolean);
  const first = parts[0]?.replace(/^@/, "") ?? null;
  if (known?.id === "linkedin") {
    const slug = linkedinSlug(u.toString());
    return slug ? { service: "linkedin", url: `https://www.linkedin.com/in/${slug}`, handle: slug } : null;
  }
  if (known?.id === "substack") return { service: "substack", url: `https://${u.hostname}`, handle: u.hostname.split(".")[0] ?? null };
  if (known?.id === "bluesky") return { service: "bluesky", url: u.toString().replace(/\/$/, ""), handle: parts[1] ?? null };
  if (known) {
    u.search = "";
    return { service: known.id, url: u.toString().replace(/\/$/, ""), handle: first };
  }
  if (/^@[^/]+$/.test(parts[0] ?? "")) return { service: hinted?.id === "website" ? "website" : "mastodon", url: u.toString().replace(/\/$/, ""), handle: first };
  return { service: "website", url: u.toString().replace(/\/$/, ""), handle: null };
}

/** The person part of a LinkedIn profile link (linkedin.com/in/<slug>), lower case, or null. */
export function linkedinSlug(url: string): string | null {
  const m = /linkedin\.com\/in\/([^/?#\s]+)/i.exec(url.trim());
  if (!m) return null;
  let slug = m[1]!;
  try {
    slug = decodeURIComponent(slug);
  } catch {
    // kept as written
  }
  slug = slug.toLowerCase();
  return slug.length <= 100 ? slug : null;
}

/**
 * The links in a page marked as the same person's (`rel="me"` on an a or link tag), as written. The check Mastodon
 * uses (docs.joinmastodon.org/user/profile): a page that links back to a profile with rel="me" is that person's.
 */
export function relMeLinks(html: string): string[] {
  const out: string[] = [];
  for (const m of html.matchAll(/<(?:a|link)\b[^>]*>/gi)) {
    const tag = m[0];
    const rel = /\brel\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(tag);
    const relWords = (rel?.[1] ?? rel?.[2] ?? rel?.[3] ?? "").toLowerCase().split(/\s+/);
    if (!relWords.includes("me")) continue;
    const href = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(tag);
    const v = href?.[1] ?? href?.[2] ?? href?.[3];
    if (v) out.push(v.replace(/&amp;/g, "&"));
  }
  return out;
}

/** Whether one of a page's rel="me" links points at this profile: a /p/<handle> or /p/<id> path on one of `hosts`. */
export function linksBack(hrefs: readonly string[], hosts: readonly string[], keys: readonly string[]): boolean {
  const want = new Set(keys.filter(Boolean).map((k) => k.toLowerCase()));
  return hrefs.some((h) => {
    try {
      const u = new URL(h);
      if (!hosts.includes(u.hostname.toLowerCase())) return false;
      const m = /^\/p\/([^/]+)\/?$/.exec(u.pathname);
      return !!m && want.has(decodeURIComponent(m[1]!).toLowerCase());
    } catch {
      return false;
    }
  });
}

/** Rows of a CSV file (RFC 4180: quoted fields, doubled quotes, line breaks inside quotes). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const s = text.replace(/^﻿/, "");
  for (let i = 0; i < s.length; i++) {
    const c = s[i]!;
    if (quoted) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && s[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/**
 * The records of one of LinkedIn's export files as objects by column name. The file may start with notes (Connections
 * does), so the header is the first row that holds `first`; rows before it are skipped. Empty when there is none.
 */
export function csvRecords(text: string, first: string): Record<string, string>[] {
  const rows = parseCsv(text);
  const at = rows.findIndex((r) => r.map((x) => x.trim()).includes(first));
  if (at < 0) return [];
  const head = rows[at]!.map((x) => x.trim());
  return rows.slice(at + 1).filter((r) => r.some((x) => x.trim())).map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? "").trim()])));
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** A LinkedIn date such as "12 Mar 2023" or "2023-03-12" as YYYY-MM-DD, or null. */
export function linkedinDay(raw: string): string | null {
  const s = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = /^(\d{1,2})\s+([A-Za-z]{3})[a-z]*\s+(\d{4})$/.exec(s);
  if (!m) return null;
  const mon = MONTHS.indexOf(m[2]!.toLowerCase());
  return mon < 0 ? null : `${m[3]}-${String(mon + 1).padStart(2, "0")}-${m[1]!.padStart(2, "0")}`;
}

export type ExperienceIn = { kind: "position" | "school"; organisation: string; title: string | null; starts: string | null; ends: string | null };
export type ConnectionIn = { name: string; slug: string; company: string | null; position: string | null; connectedOn: string | null };
export type LinkedinExport = { positions: ExperienceIn[]; schools: ExperienceIn[]; skills: string[]; connections: ConnectionIn[]; headline: string | null };

/** The files of LinkedIn's export that Reflect reads, by their names in the zip. Nothing else is read. */
export const LINKEDIN_FILES = ["Positions.csv", "Education.csv", "Skills.csv", "Connections.csv", "Profile.csv"] as const;
export type LinkedinFiles = Partial<Record<(typeof LINKEDIN_FILES)[number], string>>;

const orNull = (v: string | undefined) => (v && v.trim() ? v.trim().slice(0, 200) : null);

/**
 * What a LinkedIn export holds that a profile uses: positions, schools, skills, first-degree connections and the
 * headline. Profile.csv also holds an address and a birth date, which are never read.
 */
export function readLinkedin(files: LinkedinFiles): LinkedinExport {
  const positions = csvRecords(files["Positions.csv"] ?? "", "Company Name").flatMap((r): ExperienceIn[] => {
    const org = orNull(r["Company Name"]);
    return org ? [{ kind: "position", organisation: org, title: orNull(r["Title"]), starts: orNull(r["Started On"]), ends: orNull(r["Finished On"]) }] : [];
  });
  const schools = csvRecords(files["Education.csv"] ?? "", "School Name").flatMap((r): ExperienceIn[] => {
    const org = orNull(r["School Name"]);
    return org ? [{ kind: "school", organisation: org, title: orNull(r["Degree Name"]), starts: orNull(r["Start Date"]), ends: orNull(r["End Date"]) }] : [];
  });
  const skills = [...new Set(csvRecords(files["Skills.csv"] ?? "", "Name").map((r) => orNull(r["Name"])).filter((x): x is string => x !== null))];
  const seen = new Set<string>();
  const connections = csvRecords(files["Connections.csv"] ?? "", "First Name").flatMap((r): ConnectionIn[] => {
    const slug = linkedinSlug(r["URL"] ?? "");
    const name = [r["First Name"], r["Last Name"]].filter((x) => x && x.trim()).join(" ").trim();
    if (!slug || !name || seen.has(slug)) return [];
    seen.add(slug);
    return [{ name: name.slice(0, 200), slug, company: orNull(r["Company"]), position: orNull(r["Position"]), connectedOn: linkedinDay(r["Connected On"] ?? "") }];
  });
  const headline = orNull(csvRecords(files["Profile.csv"] ?? "", "First Name")[0]?.["Headline"]);
  return { positions, schools, skills, connections, headline: headline ? headline.slice(0, 120) : null };
}
