// The person's site as a Next.js project they can host themselves (doc "Personal site and blog design guide",
// 2026-11-18, Export). Pure: given what anyone may see on the profile and the published posts, it returns each file
// of the project by path. Posts are Markdown files in content/posts/ with a small front matter; the profile is
// content/profile.json. The App Router pages read them at build time, so the site is static.
import type { TemplateId } from "./site";

export type ExportProfile = {
  name: string;
  line: string | null;
  handle: string | null;
  socials: { label: string; url: string }[];
  building: { name: string; line: string | null; url: string | null }[];
  experience: { title: string | null; org: string; years: string | null }[];
  interests: string[];
};
export type ExportPost = { slug: string; title: string; kind: string; body: string; publishedAt: string; updatedAt: string };

const yamlString = (s: string) => JSON.stringify(s);

/** One post as a Markdown file with front matter. */
export function postFile(p: ExportPost): string {
  return `---
title: ${yamlString(p.title)}
kind: ${p.kind}
published: ${p.publishedAt}
updated: ${p.updatedAt}
---

${p.body.trim()}
`;
}

/** The project's folder name: the handle, else a slug of the name. */
export const exportName = (p: ExportProfile) => `${(p.handle ?? p.name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "my"}-site`;

/** Vercel's Deploy button for a repository the person pushed the project to. */
export const deployUrl = (repoUrl: string, name: string) => `https://vercel.com/new/clone?repository-url=${encodeURIComponent(repoUrl)}&repository-name=${encodeURIComponent(name)}`;

/** Every file of the exported project, by path. */
export function exportFiles(profile: ExportProfile, posts: readonly ExportPost[], template: TemplateId, siteUrl: string): Record<string, string> {
  const name = exportName(profile);
  const files: Record<string, string> = {};
  files["package.json"] = JSON.stringify(
    {
      name,
      private: true,
      scripts: { dev: "next dev", build: "next build", start: "next start" },
      dependencies: { next: "16.4.5", react: "19.3.1", "react-dom": "19.3.1", marked: "15.0.12" },
      devDependencies: { typescript: "5.9.3", "@types/node": "22.10.2", "@types/react": "19.3.0" },
    },
    null,
    2,
  ) + "\n";
  files["next.config.mjs"] = "/** @type {import('next').NextConfig} */\nexport default {};\n";
  files["tsconfig.json"] = JSON.stringify(
    {
      compilerOptions: {
        target: "ES2022", lib: ["dom", "dom.iterable", "esnext"], allowJs: false, skipLibCheck: true, strict: true, noEmit: true, esModuleInterop: true,
        module: "esnext", moduleResolution: "bundler", resolveJsonModule: true, isolatedModules: true, jsx: "preserve", incremental: true, plugins: [{ name: "next" }], paths: { "@/*": ["./*"] },
      },
      include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
      exclude: ["node_modules"],
    },
    null,
    2,
  ) + "\n";
  files[".gitignore"] = "node_modules\n.next\nout\n.vercel\n";
  files["content/profile.json"] = JSON.stringify({ ...profile, template, siteUrl }, null, 2) + "\n";
  for (const p of posts) files[`content/posts/${p.slug}.md`] = postFile(p);
  files["lib/content.ts"] = `import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import profileJson from "@/content/profile.json";

export type Post = { slug: string; title: string; kind: string; published: string; updated: string; body: string };
export const profile = profileJson;

const DIR = join(process.cwd(), "content", "posts");

function parse(slug: string, text: string): Post {
  const m = /^---\\n([\\s\\S]*?)\\n---\\n?/.exec(text);
  const meta: Record<string, string> = {};
  for (const line of (m?.[1] ?? "").split("\\n")) {
    const i = line.indexOf(":");
    if (i > 0) {
      const v = line.slice(i + 1).trim();
      meta[line.slice(0, i).trim()] = v.startsWith('"') ? JSON.parse(v) : v;
    }
  }
  return { slug, title: meta.title ?? slug, kind: meta.kind ?? "essay", published: meta.published ?? "", updated: meta.updated ?? "", body: m ? text.slice(m[0].length) : text };
}

/** Every post, newest first. */
export function posts(): Post[] {
  let names: string[] = [];
  try {
    names = readdirSync(DIR).filter((n) => n.endsWith(".md"));
  } catch {
    return [];
  }
  return names.map((n) => parse(n.replace(/\\.md$/, ""), readFileSync(join(DIR, n), "utf8"))).sort((a, b) => b.published.localeCompare(a.published));
}

export const post = (slug: string) => posts().find((p) => p.slug === slug) ?? null;
export const minutes = (body: string) => Math.max(1, Math.round(body.split(/\\s+/).filter(Boolean).length / 230));
export const day = (iso: string) => (iso ? new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "");
`;
  files["app/globals.css"] = `:root { --fg: #1a1a1a; --muted: #6b6b6b; --line: #e6e6e6; --bg: #fff; --accent: #1a1a1a; }
@media (prefers-color-scheme: dark) { :root { --fg: #ededed; --muted: #9a9a9a; --line: #2a2a2a; --bg: #111; --accent: #ededed; } }
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--fg); font: 16px/1.6 system-ui, -apple-system, "Segoe UI", sans-serif; }
body.notebook, .post { font-family: Georgia, "Iowan Old Style", serif; }
main { max-width: 680px; margin: 0 auto; padding: 48px 16px 64px; }
a { color: inherit; }
h1 { font-size: 2rem; line-height: 1.2; margin: 0 0 8px; }
h2 { font-size: 1.1rem; margin: 40px 0 12px; }
.muted { color: var(--muted); }
.small { font-size: 0.875rem; }
ul.plain { list-style: none; padding: 0; margin: 0; }
ul.plain li { padding: 12px 0; border-bottom: 1px solid var(--line); }
.post { font-size: 1.125rem; line-height: 1.75; }
.post h1 { font-size: 2.25rem; }
.post blockquote { margin: 0; padding-left: 16px; border-left: 3px solid var(--line); color: var(--muted); }
footer { margin-top: 64px; padding-top: 16px; border-top: 1px solid var(--line); }
`;
  files["app/layout.tsx"] = `import type { Metadata } from "next";
import type { ReactNode } from "react";
import { profile } from "@/lib/content";
import "./globals.css";

export const metadata: Metadata = {
  title: profile.name,
  description: profile.line ?? undefined,
  alternates: { types: { "application/rss+xml": "/feed.xml" } },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={profile.template}>{children}</body>
    </html>
  );
}
`;
  files["app/page.tsx"] = `import Link from "next/link";
import { day, minutes, posts, profile } from "@/lib/content";

export default function Home() {
  const all = posts();
  const writing = (
    <section>
      <h2>Writing</h2>
      {all.length ? (
        <ul className="plain">
          {all.map((p) => (
            <li key={p.slug}>
              <Link href={\`/\${p.slug}\`}>{p.title}</Link>
              <div className="muted small">{day(p.published)} · {minutes(p.body)} min read</div>
            </li>
          ))}
        </ul>
      ) : <p className="muted">Nothing published yet.</p>}
    </section>
  );
  const building = profile.building.length ? (
    <section>
      <h2>Building</h2>
      <ul className="plain">
        {profile.building.map((b) => (
          <li key={b.name}>{b.url ? <a href={b.url}>{b.name}</a> : b.name}{b.line ? <div className="muted small">{b.line}</div> : null}</li>
        ))}
      </ul>
    </section>
  ) : null;
  return (
    <main>
      <h1>{profile.name}</h1>
      {profile.line ? <p className="muted">{profile.line}</p> : null}
      {profile.template === "builder" ? <>{building}{writing}</> : <>{writing}{building}</>}
      {profile.experience.length ? (
        <section>
          <h2>Experience</h2>
          <ul className="plain small">
            {profile.experience.map((e, i) => <li key={i}>{e.title ? \`\${e.title}, \` : ""}{e.org}{e.years ? <span className="muted"> · {e.years}</span> : null}</li>)}
          </ul>
        </section>
      ) : null}
      {profile.socials.length ? (
        <p className="small">{profile.socials.map((s, i) => <span key={s.url}>{i ? " · " : ""}<a href={s.url} rel="me">{s.label}</a></span>)}</p>
      ) : null}
      <footer className="muted small"><a href="/feed.xml">RSS</a></footer>
    </main>
  );
}
`;
  files["app/[slug]/page.tsx"] = `import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { marked } from "marked";
import { day, minutes, post, posts, profile } from "@/lib/content";

export const dynamicParams = false;
export const generateStaticParams = () => posts().map((p) => ({ slug: p.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = post((await params).slug);
  return { title: p ? \`\${p.title} · \${profile.name}\` : profile.name };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = post((await params).slug);
  if (!p) notFound();
  return (
    <main className="post">
      <p className="small"><Link href="/">{profile.name}</Link></p>
      <h1>{p.title}</h1>
      <p className="muted small">{day(p.published)} · {minutes(p.body)} min read</p>
      <article dangerouslySetInnerHTML={{ __html: marked.parse(p.body, { async: false }) as string }} />
      <footer className="muted small"><Link href="/">More writing</Link> · <a href="/feed.xml">RSS</a></footer>
    </main>
  );
}
`;
  files["app/feed.xml/route.ts"] = `import { posts, profile } from "@/lib/content";

export const dynamic = "force-static";
const x = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function GET() {
  const base = (profile.siteUrl ?? "").replace(/\\/+$/, "");
  const items = posts().map((p) => \`<item><title>\${x(p.title)}</title><link>\${x(base + "/" + p.slug)}</link><guid>\${x(base + "/" + p.slug)}</guid><pubDate>\${new Date(p.published).toUTCString()}</pubDate></item>\`).join("");
  const xml = \`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>\${x(profile.name)}</title><link>\${x(base)}</link><description>\${x(profile.line ?? "")}</description>\${items}</channel></rss>\`;
  return new Response(xml, { headers: { "content-type": "application/rss+xml; charset=utf-8" } });
}
`;
  files["README.md"] = `# ${profile.name}

Your site and blog, exported from Reflect as a Next.js project (App Router).

- Posts are Markdown files in \`content/posts/\`. Add one by adding a file with the same front matter.
- Your name, line, links, what you are building and your experience are in \`content/profile.json\`.
- Set \`siteUrl\` in \`content/profile.json\` to your own address so the feed links to it.

## Run it

\`\`\`
npm install
npm run dev
\`\`\`

## Host it

Push this folder to a GitHub repository, then import it on Vercel (vercel.com/new), or use the Deploy button:
\`https://vercel.com/new/clone?repository-url=<your repository URL>&repository-name=${name}\`.
Any host that runs Next.js works too; \`npm run build\` makes it.
`;
  return files;
}
