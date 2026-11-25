// Everything the business store changed since a point a working copy keeps (the offline sync contract,
// 2026-11-25). The bearer token names the business and the person (src/server/sync-token.ts); the records come
// from the account's tenant rows, bound to that account by the database (src/server/sync-store.ts).
import { serveChanges } from "@/server/sync-api";
import { hostedSyncBackend } from "@/server/sync-store";

export const dynamic = "force-dynamic";

export const GET = (req: Request) => serveChanges(req, { backend: hostedSyncBackend() });
