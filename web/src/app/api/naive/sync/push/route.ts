// What a working copy changed while it was offline (the offline sync contract, 2026-11-25). All or none: every
// change names the version it was based on, and one base the store has moved past refuses the whole push with 409.
// Each accepted change goes through Naive's router as the token's person, so the gate and the provenance log apply.
import { servePush } from "@/server/sync-api";
import { hostedSyncBackend } from "@/server/sync-store";

export const dynamic = "force-dynamic";

export const POST = (req: Request) => servePush(req, { backend: hostedSyncBackend() });
