// Audits every stored life record against its kind's JSON Schema, read only: per kind, how many bodies pass and which
// fields fail, never a value. Exits 1 when any body fails.
//   pnpm check:life
// Needs DATABASE_URL and REFLECT_DATA_KEY for the branch it runs against (bodies are sealed, so it opens each one).
import { db } from "../src/db/pool";
import { auditLifeRecords } from "../src/server/life-store";
import { auditLines } from "../src/server/life-validate";

if (!process.env.DATABASE_URL || !process.env.REFLECT_DATA_KEY) {
  console.error("check-life-records needs DATABASE_URL and REFLECT_DATA_KEY");
  process.exit(2);
}
try {
  const audit = await auditLifeRecords();
  for (const line of auditLines(audit)) console.log(line);
  if (audit.some((k) => k.pass < k.records)) process.exitCode = 1;
} finally {
  await db().end();
}
