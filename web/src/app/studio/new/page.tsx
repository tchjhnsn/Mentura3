// The old /studio/new: the page now belongs to a team (/studio/<team>/new).
import { toLandingTeam } from "../redirect";

export const dynamic = "force-dynamic";

export default async function Old() {
  return toLandingTeam("new");
}
