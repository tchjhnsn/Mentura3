// A real business used to open here; it now opens in the business console, inside its team.
import { toPersonalTeam } from "../../redirect";

export const dynamic = "force-dynamic";

export default async function OldRealVenture({ params }: { params: Promise<{ id: string }> }) {
  return toPersonalTeam((await params).id);
}
