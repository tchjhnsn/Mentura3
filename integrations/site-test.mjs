#!/usr/bin/env node
// Tests for the site reader (EE-062), offline: link discovery and text extraction from fixed HTML.
import { links, text } from "./site.mjs";

let failed = 0;
const t = (name, fn) => { try { fn(); console.log(`ok   ${name}`); } catch (e) { failed++; console.log(`FAIL ${name}: ${e.message}`); } };
const ok = (c, m) => { if (!c) throw new Error(m); };

t("the reader keeps links on the site, marks nav links, and skips sign-in and files", () => {
  const html = `<header><nav><a href="/pricing">Pricing</a></nav></header><a href="/about">About</a><a href="/login">Log in</a><a href="/deck.pdf">Deck</a><a href="https://x.com/kept">X</a><script>var a=1</script>`;
  const ls = links(html, "https://kept.example/");
  ok(JSON.stringify(ls.map((l) => [new URL(l.url).pathname, l.in_nav])) === JSON.stringify([["/pricing", true], ["/about", false]]), JSON.stringify(ls));
  ok(!text(html).includes("var a"), "script text kept");
});

if (failed) { console.log(`\n${failed} failing`); process.exit(1); }
console.log("\nall passing");
