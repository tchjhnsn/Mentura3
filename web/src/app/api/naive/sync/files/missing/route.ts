// Which of these file hashes the business store does not hold yet, so a push uploads only those (the offline sync
// contract, 2026-11-25). A file is named by its sha256, so a file never conflicts.
import { serveMissing } from "@/server/sync-api";
import { syncBlobs } from "@/server/sync-files";

export const dynamic = "force-dynamic";

export const POST = (req: Request) => serveMissing(req, { files: syncBlobs() });
