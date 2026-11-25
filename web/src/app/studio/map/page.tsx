// The old /studio/map: the page now belongs to a team (/studio/<team>/map).
import { toLandingTeam } from "../redirect";

export const dynamic = "force-dynamic";

export default async function Old() {
  return toLandingTeam("map");
}
