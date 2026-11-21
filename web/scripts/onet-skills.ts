// Writes src/data/onet-skills.json: for each O*NET occupation in onet.json, its most important skills and knowledge
// areas (importance scale IM, 3.5 or more on 1 to 5, at most six skills and four knowledge areas, most important first).
// Work's job matching uses them to say which skills a job shares with the work a person practises toward.
//   npx tsx scripts/onet-skills.ts
// O*NET 29.0 Database by the U.S. Department of Labor, Employment and Training Administration, CC BY 4.0.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const UA = { headers: { "user-agent": "reflect-app/1.0" } };
const base = "https://www.onetcenter.org/dl_files/database/db_29_0_text/";
const data = join(import.meta.dirname, "../src/data");
const codes = new Set((JSON.parse(readFileSync(join(data, "onet.json"), "utf8")) as { code: string }[]).map((j) => j.code));

async function top(file: string, max: number): Promise<{ names: string[]; jobs: Record<string, number[]> }> {
  const rows = (await (await fetch(base + file, UA)).text()).trim().split(/\r?\n/).slice(1).map((l) => l.split("\t"));
  const by = new Map<string, [string, number][]>();
  for (const [code, , name, scale, value] of rows) {
    if (!code || !codes.has(code) || scale !== "IM" || Number(value) < 3.5) continue;
    by.set(code, [...(by.get(code) ?? []), [name!, Number(value)]]);
  }
  const names: string[] = [];
  const jobs: Record<string, number[]> = {};
  for (const [code, list] of by) {
    jobs[code] = list.sort((a, b) => b[1] - a[1]).slice(0, max).map(([n]) => {
      if (!names.includes(n)) names.push(n);
      return names.indexOf(n);
    });
  }
  return { names, jobs };
}

const skills = await top("Skills.txt", 6);
const knowledge = await top("Knowledge.txt", 4);
writeFileSync(join(data, "onet-skills.json"), JSON.stringify({ skills, knowledge }));
console.log(`skills for ${Object.keys(skills.jobs).length} jobs, knowledge for ${Object.keys(knowledge.jobs).length}`);
