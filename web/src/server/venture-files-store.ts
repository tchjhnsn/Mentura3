import { db } from "@/db/pool";
import type { VentureFile } from "@reflect/core/naive-venture";
import { open, seal } from "./crypto";
import { tx } from "./learn-store";

// A venture's files (migration 0049): each file's text is sealed with the person's key and kept as a JSON string.

const UUID = /^[0-9a-f-]{36}$/;

/** Every file a venture keeps, by path. */
export async function ventureFiles(userId: string, ventureId: string): Promise<VentureFile[]> {
  if (!UUID.test(ventureId)) return [];
  const r = await db().query("SELECT path, body FROM venture_file WHERE user_id = $1 AND venture_id = $2 ORDER BY path", [userId, ventureId]);
  return r.rows.map((x) => ({ path: x.path as string, body: typeof x.body === "string" ? open(userId, x.body) : "" }));
}

/** Keeps these files, replacing any already kept at the same paths, in one transaction. */
export async function putVentureFiles(userId: string, ventureId: string, files: readonly VentureFile[]): Promise<void> {
  if (!UUID.test(ventureId)) throw new Error("No such venture.");
  await tx(async (c) => {
    for (const f of files) {
      await c.query(
        `INSERT INTO venture_file (user_id, venture_id, path, body) VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, venture_id, path) DO UPDATE SET body = EXCLUDED.body, updated_at = now()`,
        [userId, ventureId, f.path, JSON.stringify(seal(userId, f.body))],
      );
    }
  });
}

/** Removes the files at these paths. */
export async function removeVentureFiles(userId: string, ventureId: string, paths: readonly string[]): Promise<void> {
  if (!UUID.test(ventureId) || !paths.length) return;
  await db().query("DELETE FROM venture_file WHERE user_id = $1 AND venture_id = $2 AND path = ANY($3)", [userId, ventureId, [...paths]]);
}
