#!/usr/bin/env node
// Read a venture's website (platform, EE-041; EE-062): the home page and the pages it links to, as
// text, with where each page sits (the home page, one click away in the header or nav, or one click
// away elsewhere). Firecrawl renders the pages when FIRECRAWL_API_KEY is set; otherwise a plain fetch
// reads the HTML, which misses sites that render only in the browser. It reads public pages only,
// stays on the site's own origin, and sends nothing but the requests themselves.
//
//   node platform/integrations/site.mjs <url> [--pages 10]     prints {site, via, pages:[...]}

const UA = "Mozilla/5.0 (compatible; NaiveSiteReader/0.1; +https://github.com/tchjhnsn/everything-ecosystem)";
const FIRECRAWL = "https://api.firecrawl.dev/v1";
// Pages a marketing site usually has; a link whose path or text names one is read first.
const LIKELY = /about|team|company|story|mission|pricing|plans|careers|jobs|hiring|join|investor|ir\b|community|contribut|open-source|press|news|media|blog|contact|security|privacy|trust|product|features|how-it-works|customers|case-stud|faq/i;

const decode = (s) => s.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&#x27;|&rsquo;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));
export function text(html) {
  return decode(html.replace(/<(script|style|noscript|svg|template)[\s\S]*?<\/\1>/gi, " ").replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<\/(p|div|li|h[1-6]|section|article|br|tr|header|footer|nav)>/gi, "\n").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " "))
    .replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim();
}
export function links(html, base) {
  const out = [], seen = new Set();
  const navHtml = (html.match(/<(nav|header)[\s\S]*?<\/\1>/gi) ?? []).join(" ");
  const navHrefs = new Set([...navHtml.matchAll(/href\s*=\s*["']([^"'#]+)/gi)].map((m) => m[1]));
  for (const m of html.matchAll(/<a\b[^>]*href\s*=\s*["']([^"'#]+)[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    let u;
    try { u = new URL(m[1], base); } catch { continue; }
    if (u.origin !== new URL(base).origin || /^\/(log-?in|sign-?in|sign-?up|register|auth|app|dashboard|homepage)\b/i.test(u.pathname) || /\.(png|jpe?g|gif|svg|webp|pdf|zip|mp4|css|js|xml|ico)$/i.test(u.pathname)) continue;
    u.hash = ""; u.search = "";
    const key = u.href.replace(/\/$/, "");
    if (seen.has(key) || key === new URL(base).href.replace(/\/$/, "")) continue;
    seen.add(key);
    out.push({ url: u.href, label: text(m[2]).slice(0, 60), in_nav: navHrefs.has(m[1]) });
  }
  return out;
}

async function plain(url) {
  const r = await fetch(url, { headers: { "user-agent": UA, accept: "text/html" }, redirect: "follow", signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error(`${url} answered ${r.status}`);
  const html = await r.text();
  return { url: r.url, html, title: decode((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "").trim()), text: text(html) };
}
async function firecrawl(url) {
  const r = await fetch(`${FIRECRAWL}/scrape`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}` },
    body: JSON.stringify({ url, formats: ["markdown", "html"], onlyMainContent: false }), signal: AbortSignal.timeout(60000) });
  if (!r.ok) throw new Error(`Firecrawl answered ${r.status} for ${url}`);
  const d = (await r.json()).data ?? {};
  return { url: d.metadata?.sourceURL ?? url, html: d.html ?? "", title: d.metadata?.title ?? "", text: d.markdown ?? text(d.html ?? "") };
}

export async function read(site, { pages = 10, chars = 6000 } = {}) {
  const url = /^https?:\/\//.test(site) ? site : `https://${site}`;
  const via = process.env.FIRECRAWL_API_KEY ? "firecrawl" : "fetch";
  const get = via === "firecrawl" ? firecrawl : plain;
  const home = await get(url);
  const ls = links(home.html, home.url);
  // Links that name a page marketing sites usually have first (about, careers, pricing...), header and nav links next, then the rest.
  const score = (l) => (LIKELY.test(`${new URL(l.url).pathname} ${l.label}`) ? 2 : 0) + (l.in_nav ? 1 : 0);
  // One page per section first (/customers, not every /customers/<name>), then the rest if room is left.
  const ranked = ls.map((l, i) => [l, i]).sort(([a, i], [b, j]) => score(b) - score(a) || i - j).map(([l]) => l);
  const section = (l) => new URL(l.url).pathname.split("/")[1];
  const firsts = ranked.filter((l, k) => ranked.findIndex((m) => section(m) === section(l)) === k);
  const pick = [...firsts, ...ranked.filter((l) => !firsts.includes(l))].slice(0, pages - 1);
  const rest = await Promise.all(pick.map(async (l) => { try { return { ...(await get(l.url)), link: l }; } catch (e) { return { url: l.url, error: e.message, link: l }; } }));
  const page = (p, depth) => ({ url: p.url, path: new URL(p.url).pathname, title: p.title ?? "", depth, in_nav: depth === 0 ? true : !!p.link?.in_nav, label: p.link?.label ?? "", ...(p.error ? { error: p.error } : { text: p.text.slice(0, chars) }) });
  return { site: new URL(home.url).origin, via, read_at: new Date().toISOString().replace(/\.\d+Z$/, "Z"), links_found: ls.length, links: ls.map((l) => ({ path: new URL(l.url).pathname, label: l.label, in_nav: l.in_nav })), pages: [page(home, 0), ...rest.map((p) => page(p, 1))] };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const site = process.argv[2];
  if (!site) { console.error("usage: node platform/integrations/site.mjs <url> [--pages 10]"); process.exit(2); }
  const i = process.argv.indexOf("--pages");
  read(site, { pages: i > 0 ? Number(process.argv[i + 1]) : 10 }).then((r) => console.log(JSON.stringify(r)), (e) => { console.error(e.message); process.exit(1); });
}
