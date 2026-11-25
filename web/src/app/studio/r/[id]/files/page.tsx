// A real business's Files used to open here; they now open in the business console, inside its team. ./raw stays: it
// carries the bytes.
import { toPersonalTeam } from "../../../redirect";

export const dynamic = "force-dynamic";

export default async function OldRealFiles({ params }: { params: Promise<{ id: string }> }) {
  return toPersonalTeam(`${(await params).id}/files`);
}
