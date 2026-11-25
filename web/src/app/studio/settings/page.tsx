// The old /studio/settings: the page now belongs to a team (/studio/<team>/settings).
import { toLandingTeam } from "../redirect";

export const dynamic = "force-dynamic";

export default async function Old() {
  return toLandingTeam("settings");
}
