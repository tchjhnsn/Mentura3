// Checks the Bekker references of the friendship schemes and questions (packages/core/src/friendship.ts) at the page
// and column, against H. Rackham's translation of the Nicomachean Ethics (Loeb, 1934) as Perseus serves it by Bekker
// page. Each check names a citation, the page it falls on and words that page must hold. It reaches the network, so it
// is run by hand, not in CI: `node scripts/check-bekker.ts`. Line numbers within a column are the standard edition's
// (Bywater) and are not checked here, since the translation does not carry them. Exit 1 on any miss.
const CHECKS: [cite: string, page: string, words: RegExp][] = [
  ["goodwill and friendship, VIII.2, 1155b27-1156a5", "1155b", /goodwill/i],
  ["known to both, 1155b34-1156a5", "1155b", /known to its object/i],
  ["friendship of utility, 1156a10-21", "1156a", /useful/i],
  ["friendship of pleasure, 1156a31-b6", "1156a", /pleasure/i],
  ["friendship of virtue, 1156b7-32", "1156b", /perfect/i],
  ["time and salt, 1156b25-32", "1156b", /salt/i],
  ["lover and beloved, 1157a6-14", "1157a", /lover/i],
  ["absence, 1157b5-24", "1157b", /absence/i],
  ["not with many, 1158a10-18", "1158a", /many/i],
  ["equal friendship, 1158b1-11", "1158b", /equal/i],
  ["unequal friendship, 1158b11-28", "1158b", /husband and wife/i],
  ["in proportion, 1158b23-28", "1158b", /proportion/i],
  ["too far apart, 1158b33-1159a5", "1159a", /remote/i],
  ["community, 1159b25-1160a8", "1159b", /partnership/i],
  ["kin friendship, 1161b11-1162a33", "1162a", /brothers/i],
  ["complaints, 1162b5-21", "1162b", /complain/i],
  ["dissolution, 1165a36-b36", "1165b", /pretend/i],
  ["marks of a friend, 1166a1-10", "1166a", /grieve|sorrow/i],
  ["another self, 1166a31-32", "1166a", /another self/i],
  ["goodwill the beginning, 1166b30-1167a21", "1167a", /beginning of friendship/i],
  ["concord, 1167a22-b16", "1167a", /concord/i],
  ["a second self, 1170b6-7", "1170b", /second self/i],
  ["number of friends, 1170b20-1171a20", "1171a", /number of one's friends/i],
  ["good and bad fortune, 1171a21-b28", "1171b", /prosperity/i],
  ["living together, 1171b29-1172a15", "1172a", /together/i],
];

const page = async (p: string): Promise<string> => {
  const r = await fetch(`https://www.perseus.tufts.edu/hopper/text?doc=Perseus:text:1999.01.0054:bekker%20page=${p}`, { headers: { "user-agent": "reflect-bekker-check" } });
  if (!r.ok) throw new Error(`Perseus ${p}: HTTP ${r.status}`);
  const html = await r.text();
  const start = html.indexOf("text_container");
  return html.slice(start, html.indexOf("Aristotle in 23 Volumes", start)).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
};

const cache = new Map<string, string>();
let missed = 0;
for (const [cite, p, words] of CHECKS) {
  if (!cache.has(p)) cache.set(p, await page(p));
  const ok = words.test(cache.get(p)!);
  if (!ok) missed++;
  console.log(`${ok ? "ok  " : "MISS"} ${p}  ${cite}`);
}
console.log(missed ? `${missed} of ${CHECKS.length} missed` : `all ${CHECKS.length} found on their pages`);
process.exit(missed ? 1 : 0);
