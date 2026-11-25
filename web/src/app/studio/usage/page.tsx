// The old /studio/usage: the page now belongs to a team (/studio/<team>/usage).
import { toLandingTeam } from "../redirect";

export const dynamic = "force-dynamic";

export default async function Old() {
  return toLandingTeam("usage");
}
