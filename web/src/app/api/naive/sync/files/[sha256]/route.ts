// One file of a business, by its sha256 (the offline sync contract, 2026-11-25). PUT uploads the bytes and the
// server checks they hash to the name; GET hands them back, checked again. The key carries the account and the
// business, so one business never reads another's bytes by naming a hash (src/server/sync-files.ts).
import { serveFileGet, serveFilePut } from "@/server/sync-api";
import { syncBlobs } from "@/server/sync-files";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ sha256: string }> }) {
  const { sha256 } = await params;
  return await serveFileGet(req, sha256, { files: syncBlobs() });
}

export async function PUT(req: Request, { params }: { params: Promise<{ sha256: string }> }) {
  const { sha256 } = await params;
  return await serveFilePut(req, sha256, { files: syncBlobs() });
}
